package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

func TestDefaultStatePathUsesDataFolder(t *testing.T) {
	want := filepath.Clean(filepath.Join("data", "state.json"))
	if got := filepath.Clean(defaultStatePath()); got != want {
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

func TestLoadUIStateMigratesFromLegacyConfigDBWhenTargetIsSkeleton(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	tempWD := t.TempDir()
	if err := os.Chdir(tempWD); err != nil {
		t.Fatalf("chdir temp wd: %v", err)
	}
	defer func() { _ = os.Chdir(wd) }()

	t.Setenv("APPDATA", filepath.Join(t.TempDir(), "appdata"))
	t.Setenv("XDG_CONFIG_HOME", filepath.Join(t.TempDir(), "xdg-config"))

	targetDir := t.TempDir()
	targetDBPath := filepath.Join(targetDir, sqliteDBFileName)
	targetFilePath := filepath.Join(targetDir, "ui-state.json")

	targetDB, err := openSQLiteStorage(targetDBPath)
	if err != nil {
		t.Fatalf("open target db: %v", err)
	}
	if err := dbSaveUIState(targetDB, defaultUIState()); err != nil {
		_ = targetDB.Close()
		t.Fatalf("save skeleton ui state: %v", err)
	}
	_ = targetDB.Close()

	legacyDBPath := legacyAppConfigDBPath()
	if legacyDBPath == "" {
		t.Fatalf("legacy app config db path should not be empty")
	}
	legacyDB, err := openSQLiteStorage(legacyDBPath)
	if err != nil {
		t.Fatalf("open legacy db: %v", err)
	}
	legacyState := defaultUIState()
	legacyState.ActiveTab = "Legacy"
	legacyState.Tabs = []string{"Default", "Legacy"}
	legacyState.MailList = []UIMailItem{
		{
			Email:        "seed@example.test",
			Password:     "seed-user",
			ClientID:     "seed-client",
			RefreshToken: "seed-token",
			Tab:          "Legacy",
			Remark:       "seed",
			Tags:         []string{"seed"},
		},
	}
	if err := dbSaveUIState(legacyDB, legacyState); err != nil {
		_ = legacyDB.Close()
		t.Fatalf("save legacy ui state: %v", err)
	}
	_ = legacyDB.Close()

	got, err := loadUIState(targetFilePath)
	if err != nil {
		t.Fatalf("load ui state: %v", err)
	}
	if len(got.MailList) != 1 || got.MailList[0].Email != "seed@example.test" {
		t.Fatalf("expected migration from legacy config db, got %#v", got.MailList)
	}
}

func TestConcurrentSaveAndLoadUIStateDoesNotFail(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "ui-state.json")
	base := defaultUIState()

	var wg sync.WaitGroup
	errCh := make(chan error, 256)

	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func(worker int) {
			defer wg.Done()
			for n := 0; n < 40; n++ {
				state := base
				state.ActiveTab = "Default"
				state.MailList = []UIMailItem{
					{
						Email:        "user@example.test",
						Password:     "user",
						ClientID:     "client",
						RefreshToken: "token",
						Tab:          "Default",
						Remark:       "w",
						Tags:         []string{"x"},
					},
				}
				if err := saveUIState(filePath, state); err != nil {
					errCh <- err
					return
				}
				if _, err := loadUIState(filePath); err != nil {
					errCh <- err
					return
				}
			}
		}(i)
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		t.Fatalf("concurrent save/load failed: %v", err)
	}
}

func TestSaveUIStateHandlesDuplicateEmailRows(t *testing.T) {
	filePath := filepath.Join(t.TempDir(), "ui-state.json")

	state := defaultUIState()
	state.MailList = []UIMailItem{
		{
			Email:        "dup@example.test",
			Password:     "user1",
			ClientID:     "client1",
			RefreshToken: "token1",
			Tab:          "Default",
			Remark:       "first",
			Tags:         []string{"a"},
		},
		{
			Email:        "dup@example.test",
			Password:     "user2",
			ClientID:     "client2",
			RefreshToken: "token2",
			Tab:          "VIP",
			Remark:       "second",
			Tags:         []string{"b"},
		},
	}

	if err := saveUIState(filePath, state); err != nil {
		t.Fatalf("saveUIState should not fail for duplicate emails, got: %v", err)
	}

	got, err := loadUIState(filePath)
	if err != nil {
		t.Fatalf("loadUIState returned unexpected error: %v", err)
	}
	if len(got.MailList) != 1 {
		t.Fatalf("expected deduped mail list size 1, got %d", len(got.MailList))
	}
	if got.MailList[0].Email != "dup@example.test" {
		t.Fatalf("expected retained email dup@example.test, got %q", got.MailList[0].Email)
	}
}
