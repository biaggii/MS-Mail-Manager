package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
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
