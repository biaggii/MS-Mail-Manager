package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadStateMissingFileReturnsDefaults(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "state.json")

	state, err := loadState(filePath)
	if err != nil {
		t.Fatalf("loadState returned unexpected error: %v", err)
	}

	if state.APIBaseURL != defaultAPIBaseURL {
		t.Fatalf("expected default API base URL %q, got %q", defaultAPIBaseURL, state.APIBaseURL)
	}

	if len(state.Accounts) != 0 {
		t.Fatalf("expected no accounts, got %d", len(state.Accounts))
	}
}

func TestSaveAndLoadStateRoundTrip(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "state.json")

	want := AppState{
		APIBaseURL: "https://example.test",
		Accounts: []Account{
			{
				ID:           "acc-1",
				Label:        "Primary",
				Email:        "user@example.test",
				ClientID:     "client-id",
				RefreshToken: "token",
				Mailbox:      "INBOX",
				Socks5:       "socks5://127.0.0.1:1080",
				HTTPProxy:    "http://127.0.0.1:8080",
			},
		},
	}

	if err := saveState(filePath, want); err != nil {
		t.Fatalf("saveState returned unexpected error: %v", err)
	}

	got, err := loadState(filePath)
	if err != nil {
		t.Fatalf("loadState returned unexpected error: %v", err)
	}

	if got.APIBaseURL != want.APIBaseURL {
		t.Fatalf("expected API base URL %q, got %q", want.APIBaseURL, got.APIBaseURL)
	}

	if len(got.Accounts) != 1 {
		t.Fatalf("expected 1 account, got %d", len(got.Accounts))
	}

	if got.Accounts[0].Email != want.Accounts[0].Email {
		t.Fatalf("expected email %q, got %q", want.Accounts[0].Email, got.Accounts[0].Email)
	}
}

func TestSaveStateCreatesParentDirectories(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "nested", "dir", "state.json")

	if err := saveState(filePath, AppState{APIBaseURL: defaultAPIBaseURL}); err != nil {
		t.Fatalf("saveState returned unexpected error: %v", err)
	}

	if _, err := os.Stat(filePath); err != nil {
		t.Fatalf("expected state file to exist: %v", err)
	}
}
