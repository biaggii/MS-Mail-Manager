package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRunActionUsesPostJSONBody(t *testing.T) {
	var gotMethod string
	var gotPath string
	var gotContentType string
	var gotBody map[string]string

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotMethod = r.Method
		gotPath = r.URL.Path
		gotContentType = r.Header.Get("Content-Type")

		if err := json.NewDecoder(r.Body).Decode(&gotBody); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"code":"200","data":[]}`))
	}))
	defer srv.Close()

	app := NewApp()
	app.client = srv.Client()
	app.state = AppState{
		APIBaseURL: srv.URL,
		Accounts: []Account{
			{
				ID:           "acc-1",
				Email:        "user@example.test",
				ClientID:     "client-id",
				RefreshToken: "refresh-token",
				Mailbox:      "INBOX",
			},
		},
	}

	result, err := app.RunAction("acc-1", "mail_all")
	if err != nil {
		t.Fatalf("RunAction returned unexpected error: %v", err)
	}

	if gotMethod != http.MethodPost {
		t.Fatalf("expected POST request, got %s", gotMethod)
	}
	if gotPath != "/api/mail_all" {
		t.Fatalf("expected path /api/mail_all, got %s", gotPath)
	}
	if gotContentType != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", gotContentType)
	}
	if gotBody["refresh_token"] != "refresh-token" {
		t.Fatalf("expected refresh_token in JSON body")
	}
	if gotBody["mailbox"] != "INBOX" {
		t.Fatalf("expected mailbox INBOX, got %s", gotBody["mailbox"])
	}
	if result.URL != srv.URL+"/api/mail_all" {
		t.Fatalf("expected result URL %q, got %q", srv.URL+"/api/mail_all", result.URL)
	}
}

func TestRunActionWithMailboxOverridesMailboxInBody(t *testing.T) {
	var gotBody map[string]string

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := json.NewDecoder(r.Body).Decode(&gotBody); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"code":"200","data":[]}`))
	}))
	defer srv.Close()

	app := NewApp()
	app.client = srv.Client()
	app.state = AppState{
		APIBaseURL: srv.URL,
		Accounts: []Account{
			{
				ID:           "acc-1",
				Email:        "user@example.test",
				ClientID:     "client-id",
				RefreshToken: "refresh-token",
				Mailbox:      "INBOX",
			},
		},
	}

	_, err := app.RunActionWithMailbox("acc-1", "mail_all", "Junk")
	if err != nil {
		t.Fatalf("RunActionWithMailbox returned unexpected error: %v", err)
	}

	if gotBody["mailbox"] != "Junk" {
		t.Fatalf("expected mailbox override Junk, got %s", gotBody["mailbox"])
	}
}

func TestRunActionWithMailboxRequiresAPIBaseURL(t *testing.T) {
	app := NewApp()
	app.state = AppState{
		APIBaseURL: "",
		Accounts: []Account{
			{
				ID:           "acc-1",
				Email:        "user@example.test",
				ClientID:     "client-id",
				RefreshToken: "refresh-token",
				Mailbox:      "INBOX",
			},
		},
	}

	_, err := app.RunActionWithMailbox("acc-1", "mail_all", "INBOX")
	if err == nil {
		t.Fatalf("expected error when API base URL is empty")
	}
}

func TestMailAllUsesDirectGoPath(t *testing.T) {
	var gotTokenHit bool
	var gotMessagesHit bool

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/oauth2/v2.0/token":
			gotTokenHit = true
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"access_token":"token-1","expires_in":3600,"scope":"https://graph.microsoft.com/Mail.Read"}`))
		case "/v1.0/me/mailFolders/inbox/messages":
			gotMessagesHit = true
			if got := r.Header.Get("Authorization"); got != "Bearer token-1" {
				t.Fatalf("expected bearer token, got %q", got)
			}
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"value":[{"id":"m1","subject":"hello","bodyPreview":"preview","body":{"content":"<p>hello</p>"},"createdDateTime":"2026-02-18T00:00:00Z","from":{"emailAddress":{"address":"noreply@example.com"}}}]}`))
		default:
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	oldOAuth := oauthTokenEndpoint
	oldGraph := graphAPIBaseURL
	oauthTokenEndpoint = srv.URL + "/oauth2/v2.0/token"
	graphAPIBaseURL = srv.URL + "/v1.0"
	defer func() {
		oauthTokenEndpoint = oldOAuth
		graphAPIBaseURL = oldGraph
	}()

	app := NewApp()
	app.client = srv.Client()

	result, err := app.MailAll("user@example.test", "", "client-id", "refresh-token", "INBOX")
	if err != nil {
		t.Fatalf("MailAll returned unexpected error: %v", err)
	}

	if !gotTokenHit || !gotMessagesHit {
		t.Fatalf("expected oauth + graph mail endpoints to be called")
	}
	if result.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", result.StatusCode)
	}
	var payload struct {
		Code int `json:"code"`
		Data []struct {
			ID   string `json:"id"`
			Send string `json:"send"`
		} `json:"data"`
	}
	if err := json.Unmarshal([]byte(result.Body), &payload); err != nil {
		t.Fatalf("invalid response body: %v", err)
	}
	if payload.Code != 200 || len(payload.Data) != 1 || payload.Data[0].ID != "m1" {
		t.Fatalf("unexpected payload: %+v", payload)
	}
}

func TestProcessMailboxUsesProcessEndpoint(t *testing.T) {
	var deleteHits int

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/oauth2/v2.0/token":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"access_token":"token-1","expires_in":3600,"scope":"https://graph.microsoft.com/Mail.Read"}`))
		case r.URL.Path == "/v1.0/me/mailFolders/junkemail/messages":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"value":[{"id":"m1"},{"id":"m2"}]}`))
		case strings.HasPrefix(r.URL.Path, "/v1.0/me/messages/") && r.Method == http.MethodDelete:
			deleteHits++
			w.WriteHeader(http.StatusNoContent)
		default:
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	oldOAuth := oauthTokenEndpoint
	oldGraph := graphAPIBaseURL
	oauthTokenEndpoint = srv.URL + "/oauth2/v2.0/token"
	graphAPIBaseURL = srv.URL + "/v1.0"
	defer func() {
		oauthTokenEndpoint = oldOAuth
		graphAPIBaseURL = oldGraph
	}()

	app := NewApp()
	app.client = srv.Client()

	_, err := app.ProcessMailbox("user@example.test", "", "client-id", "refresh-token", "Junk")
	if err != nil {
		t.Fatalf("ProcessMailbox returned unexpected error: %v", err)
	}

	if deleteHits != 2 {
		t.Fatalf("expected 2 delete calls, got %d", deleteHits)
	}
}

func TestMailAllReturnsErrorWhenRequiredInputMissing(t *testing.T) {
	app := NewApp()
	_, err := app.MailAll("", "", "client-id", "refresh-token", "INBOX")
	if err == nil {
		t.Fatalf("expected validation error")
	}
	if !strings.Contains(err.Error(), "required") {
		t.Fatalf("expected required-field error, got %v", err)
	}
}
