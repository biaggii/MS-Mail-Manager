package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultStatePathUsesDataFolder(t *testing.T) {
	want := filepath.Join("Data", "state.json")
	if got := filepath.Clean(defaultStatePath()); got != filepath.Clean(want) {
		t.Fatalf("expected default state path %q, got %q", want, got)
	}
}

func TestSaveAndLoadUIStateRoundTrip(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "ui-state.json")

	want := UIState{
		Lang:        "zh",
		SplitSymbol: "----",
		Tabs:        []string{"Default", "VIP"},
		ActiveTab:   "VIP",
		PageSize:    20,
		MailList: []UIMailItem{
			{
				Email:        "user@example.test",
				Password:     "username123",
				ClientID:     "client-id",
				RefreshToken: "refresh-token",
				Tab:          "VIP",
				Remark:       "Important account",
				Tags:         []string{"otp", "openai"},
			},
		},
		MailCache: map[string][]UIPost{
			"user@example.testINBOX": {
				{
					Send:    "noreply@example.test",
					Subject: "Code",
					Text:    "123456",
					HTML:    "<p>123456</p>",
					Date:    "2026-02-18T00:00:00Z",
				},
			},
		},
	}

	if err := saveUIState(filePath, want); err != nil {
		t.Fatalf("saveUIState returned unexpected error: %v", err)
	}

	got, err := loadUIState(filePath)
	if err != nil {
		t.Fatalf("loadUIState returned unexpected error: %v", err)
	}

	if got.PageSize != 20 {
		t.Fatalf("expected page size 20, got %d", got.PageSize)
	}
	if got.Lang != "cht" {
		t.Fatalf("expected lang cht, got %q", got.Lang)
	}

	if len(got.MailList) != 1 || got.MailList[0].Remark != "Important account" {
		t.Fatalf("expected remark to round-trip, got %#v", got.MailList)
	}
	if len(got.MailList[0].Tags) != 2 || got.MailList[0].Tags[0] != "otp" || got.MailList[0].Tags[1] != "openai" {
		t.Fatalf("expected tags to round-trip, got %#v", got.MailList[0].Tags)
	}

	if len(got.MailCache["user@example.testINBOX"]) != 1 {
		t.Fatalf("expected cached inbox post to round-trip")
	}
}

func TestNormalizeUIStateFillsDefaults(t *testing.T) {
	got := normalizeUIState(UIState{
		Lang:      "invalid",
		Tabs:      []string{"", "A"},
		ActiveTab: "missing",
		MailList: []UIMailItem{
			{
				Email: "  user@example.test  ",
				Tab:   "",
				Tags:  []string{" otp ", "OTP", "", " openai "},
			},
		},
		PageSize: 0,
	})

	if got.Lang != "eng" {
		t.Fatalf("expected lang eng, got %q", got.Lang)
	}
	if got.PageSize != 5 {
		t.Fatalf("expected page size 5, got %d", got.PageSize)
	}
	if got.MailList[0].Tab != "Default" {
		t.Fatalf("expected default tab, got %q", got.MailList[0].Tab)
	}
	if got.ActiveTab != "Default" {
		t.Fatalf("expected active tab Default, got %q", got.ActiveTab)
	}
	if len(got.MailList[0].Tags) != 3 || got.MailList[0].Tags[0] != "otp" || got.MailList[0].Tags[1] != "OTP" || got.MailList[0].Tags[2] != "openai" {
		t.Fatalf("expected normalized tags [otp OTP openai], got %#v", got.MailList[0].Tags)
	}
}

func TestLoadUIStateMigratesLegacyJSON(t *testing.T) {
	dir := t.TempDir()
	legacyPath := filepath.Join(dir, "ui-state.json")

	legacy := UIState{
		Lang:        "zh",
		SplitSymbol: "----",
		Tabs:        []string{"Default", "Legacy"},
		ActiveTab:   "Legacy",
		PageSize:    10,
		MailList: []UIMailItem{
			{
				Email:        "legacy@example.test",
				Password:     "legacy-user",
				ClientID:     "legacy-client",
				RefreshToken: "legacy-token",
				Tab:          "Legacy",
				Remark:       "legacy remark",
				Tags:         []string{"otp"},
			},
		},
		MailCache: map[string][]UIPost{
			"legacy@example.testINBOX": {
				{
					Send:    "noreply@example.test",
					Subject: "Legacy",
					Text:    "legacy",
					HTML:    "<p>legacy</p>",
					Date:    "2026-02-18T00:00:00Z",
				},
			},
		},
	}

	content, err := json.Marshal(legacy)
	if err != nil {
		t.Fatalf("marshal legacy ui state: %v", err)
	}
	if err := os.WriteFile(legacyPath, content, 0o600); err != nil {
		t.Fatalf("write legacy ui state file: %v", err)
	}

	got, err := loadUIState(legacyPath)
	if err != nil {
		t.Fatalf("loadUIState returned unexpected error: %v", err)
	}
	if got.Lang != "cht" {
		t.Fatalf("expected migrated lang cht, got %q", got.Lang)
	}
	if len(got.MailList) != 1 || got.MailList[0].Email != "legacy@example.test" {
		t.Fatalf("expected migrated mail list, got %#v", got.MailList)
	}
	if len(got.MailCache["legacy@example.testINBOX"]) != 1 {
		t.Fatalf("expected migrated mail cache")
	}

	dbPath := filepath.Join(dir, sqliteDBFileName)
	if _, err := os.Stat(dbPath); err != nil {
		t.Fatalf("expected sqlite db file to exist: %v", err)
	}

	updatedLegacy := UIState{Lang: "eng", ActiveTab: "Updated"}
	content, err = json.Marshal(updatedLegacy)
	if err != nil {
		t.Fatalf("marshal updated legacy ui state: %v", err)
	}
	if err := os.WriteFile(legacyPath, content, 0o600); err != nil {
		t.Fatalf("overwrite legacy ui state file: %v", err)
	}

	gotAgain, err := loadUIState(legacyPath)
	if err != nil {
		t.Fatalf("loadUIState after migration returned unexpected error: %v", err)
	}
	if gotAgain.ActiveTab != "Legacy" {
		t.Fatalf("expected db source of truth tab Legacy, got %q", gotAgain.ActiveTab)
	}
}
