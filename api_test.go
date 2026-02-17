package main

import (
	"strings"
	"testing"
)

func TestBuildActionEndpoint(t *testing.T) {
	tests := []struct {
		name   string
		action string
		want   string
		ok     bool
	}{
		{name: "latest", action: "mail_new", want: "/api/mail_new", ok: true},
		{name: "all", action: "mail_all", want: "/api/mail_all", ok: true},
		{name: "clear", action: "process_mailbox", want: "/api/process-mailbox", ok: true},
		{name: "proxy", action: "test_proxy", want: "/api/test-proxy", ok: true},
		{name: "unknown", action: "noop", want: "", ok: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := buildActionEndpoint(tt.action)
			if tt.ok && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !tt.ok && err == nil {
				t.Fatalf("expected error for action %q", tt.action)
			}
			if got != tt.want {
				t.Fatalf("expected endpoint %q, got %q", tt.want, got)
			}
		})
	}
}

func TestBuildActionURL(t *testing.T) {
	tests := []struct {
		name    string
		baseURL string
		action  string
		wantURL string
		wantErr bool
	}{
		{
			name:    "mail all",
			baseURL: "http://127.0.0.1:3000",
			action:  "mail_all",
			wantURL: "http://127.0.0.1:3000/api/mail_all",
			wantErr: false,
		},
		{
			name:    "unsupported action",
			baseURL: "http://127.0.0.1:3000",
			action:  "unknown",
			wantURL: "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := buildActionURL(tt.baseURL, tt.action)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error but got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.wantURL {
				t.Fatalf("expected URL %q, got %q", tt.wantURL, got)
			}
			if strings.Contains(got, "refresh_token") {
				t.Fatalf("URL should not contain sensitive query params: %q", got)
			}
		})
	}
}

func TestBuildActionPayload(t *testing.T) {
	account := Account{
		Email:        "user@example.test",
		ClientID:     "client-id",
		RefreshToken: "refresh-token",
		Mailbox:      "INBOX",
		Socks5:       "",
		HTTPProxy:    "",
	}

	payload := buildActionPayload(account)

	if payload["email"] != account.Email {
		t.Fatalf("expected email %q, got %q", account.Email, payload["email"])
	}
	if payload["client_id"] != account.ClientID {
		t.Fatalf("expected client_id %q, got %q", account.ClientID, payload["client_id"])
	}
	if payload["refresh_token"] != account.RefreshToken {
		t.Fatalf("expected refresh_token %q, got %q", account.RefreshToken, payload["refresh_token"])
	}
	if payload["mailbox"] != account.Mailbox {
		t.Fatalf("expected mailbox %q, got %q", account.Mailbox, payload["mailbox"])
	}
	if _, exists := payload["socks5"]; exists {
		t.Fatalf("expected socks5 to be omitted when empty")
	}
	if _, exists := payload["http"]; exists {
		t.Fatalf("expected http to be omitted when empty")
	}
}
