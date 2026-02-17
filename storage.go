package main

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

const defaultAPIBaseURL = "http://127.0.0.1:3000"

func loadState(filePath string) (AppState, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return defaultState(), nil
		}
		return AppState{}, err
	}

	var state AppState
	if err := json.Unmarshal(content, &state); err != nil {
		return AppState{}, err
	}

	return normalizeState(state), nil
}

func saveState(filePath string, state AppState) error {
	state = normalizeState(state)

	if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		return err
	}

	content, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filePath, content, 0o600)
}

func defaultState() AppState {
	return AppState{
		APIBaseURL: defaultAPIBaseURL,
		Accounts:   []Account{},
	}
}

func normalizeState(state AppState) AppState {
	state.APIBaseURL = strings.TrimSpace(state.APIBaseURL)
	state.APIBaseURL = strings.TrimRight(state.APIBaseURL, "/")
	if state.APIBaseURL == "" {
		state.APIBaseURL = defaultAPIBaseURL
	}

	if state.Accounts == nil {
		state.Accounts = []Account{}
	}

	for i := range state.Accounts {
		state.Accounts[i] = normalizeAccount(state.Accounts[i])
	}

	return state
}

func normalizeAccount(account Account) Account {
	account.ID = strings.TrimSpace(account.ID)
	account.Label = strings.TrimSpace(account.Label)
	account.Email = strings.TrimSpace(account.Email)
	account.ClientID = strings.TrimSpace(account.ClientID)
	account.RefreshToken = strings.TrimSpace(account.RefreshToken)
	account.Mailbox = strings.ToUpper(strings.TrimSpace(account.Mailbox))
	account.Socks5 = strings.TrimSpace(account.Socks5)
	account.HTTPProxy = strings.TrimSpace(account.HTTPProxy)

	if account.Mailbox == "" {
		account.Mailbox = "INBOX"
	}

	return account
}
