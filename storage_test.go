package main

import (
	"encoding/json"
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

	dbPath := filepath.Join(filepath.Dir(filePath), sqliteDBFileName)
	if _, err := os.Stat(dbPath); err != nil {
		t.Fatalf("expected sqlite db file to exist: %v", err)
	}
}

func TestLoadStateMigratesLegacyJSON(t *testing.T) {
	dir := t.TempDir()
	legacyPath := filepath.Join(dir, "state.json")

	legacy := AppState{
		APIBaseURL: "https://legacy.example.test",
		Accounts: []Account{
			{
				ID:           "acc-legacy",
				Label:        "Legacy",
				Email:        "legacy@example.test",
				ClientID:     "legacy-client",
				RefreshToken: "legacy-token",
				Mailbox:      "INBOX",
			},
		},
	}

	content, err := json.Marshal(legacy)
	if err != nil {
		t.Fatalf("marshal legacy state: %v", err)
	}
	if err := os.WriteFile(legacyPath, content, 0o600); err != nil {
		t.Fatalf("write legacy state file: %v", err)
	}

	got, err := loadState(legacyPath)
	if err != nil {
		t.Fatalf("loadState returned unexpected error: %v", err)
	}
	if got.APIBaseURL != legacy.APIBaseURL {
		t.Fatalf("expected migrated apiBaseURL %q, got %q", legacy.APIBaseURL, got.APIBaseURL)
	}
	if len(got.Accounts) != 1 || got.Accounts[0].Email != "legacy@example.test" {
		t.Fatalf("expected migrated accounts, got %#v", got.Accounts)
	}

	dbPath := filepath.Join(dir, sqliteDBFileName)
	if _, err := os.Stat(dbPath); err != nil {
		t.Fatalf("expected sqlite db file to exist: %v", err)
	}

	updatedLegacy := AppState{APIBaseURL: "https://should-not-overwrite.example.test"}
	content, err = json.Marshal(updatedLegacy)
	if err != nil {
		t.Fatalf("marshal updated legacy state: %v", err)
	}
	if err := os.WriteFile(legacyPath, content, 0o600); err != nil {
		t.Fatalf("overwrite legacy state file: %v", err)
	}

	gotAgain, err := loadState(legacyPath)
	if err != nil {
		t.Fatalf("loadState after migration returned unexpected error: %v", err)
	}
	if gotAgain.APIBaseURL != legacy.APIBaseURL {
		t.Fatalf("expected db source of truth %q, got %q", legacy.APIBaseURL, gotAgain.APIBaseURL)
	}
}
