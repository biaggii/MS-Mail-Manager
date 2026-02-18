package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	mu          sync.Mutex
	state       AppState
	statePath   string
	uiStatePath string
	client      *http.Client
	tokenMu     sync.Mutex
	tokenAuth   map[string]oauthTokenCacheEntry
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		state:       defaultState(),
		statePath:   defaultStatePath(),
		uiStatePath: defaultUIStatePath(),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		tokenAuth: map[string]oauthTokenCacheEntry{},
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	loadedState, err := loadState(a.statePath)
	if err != nil {
		runtime.LogWarningf(a.ctx, "Failed to load state file %s: %v", a.statePath, err)
		return
	}

	a.mu.Lock()
	a.state = loadedState
	a.mu.Unlock()
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) GetState() AppState {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.state
}

func (a *App) GetUIState() (UIState, error) {
	return loadUIState(a.uiStatePath)
}

func (a *App) SaveUIState(input UIState) (UIState, error) {
	normalized := normalizeUIState(input)
	if err := saveUIState(a.uiStatePath, normalized); err != nil {
		return UIState{}, err
	}
	return normalized, nil
}

func (a *App) SetAPIBaseURL(rawURL string) (AppState, error) {
	baseURL := strings.TrimRight(strings.TrimSpace(rawURL), "/")
	if baseURL == "" {
		return AppState{}, fmt.Errorf("api base URL is required")
	}
	if !strings.HasPrefix(baseURL, "http://") && !strings.HasPrefix(baseURL, "https://") {
		return AppState{}, fmt.Errorf("api base URL must start with http:// or https://")
	}

	a.mu.Lock()
	a.state.APIBaseURL = baseURL
	next := a.state
	a.mu.Unlock()

	if err := saveState(a.statePath, next); err != nil {
		return AppState{}, err
	}

	return next, nil
}

func (a *App) UpsertAccount(input AccountInput) (AppState, error) {
	account := normalizeAccount(Account{
		ID:           input.ID,
		Label:        input.Label,
		Email:        input.Email,
		ClientID:     input.ClientID,
		RefreshToken: input.RefreshToken,
		Mailbox:      input.Mailbox,
		Socks5:       input.Socks5,
		HTTPProxy:    input.HTTPProxy,
	})

	if account.Email == "" || account.ClientID == "" || account.RefreshToken == "" {
		return AppState{}, fmt.Errorf("email, client ID, and refresh token are required")
	}

	if account.ID == "" {
		account.ID = generateAccountID()
	}
	if account.Label == "" {
		account.Label = account.Email
	}

	a.mu.Lock()
	updated := false
	for i := range a.state.Accounts {
		if a.state.Accounts[i].ID == account.ID {
			a.state.Accounts[i] = account
			updated = true
			break
		}
	}
	if !updated {
		a.state.Accounts = append(a.state.Accounts, account)
	}
	next := a.state
	a.mu.Unlock()

	if err := saveState(a.statePath, next); err != nil {
		return AppState{}, err
	}

	return next, nil
}

func (a *App) DeleteAccount(accountID string) (AppState, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return AppState{}, fmt.Errorf("account ID is required")
	}

	a.mu.Lock()
	nextAccounts := make([]Account, 0, len(a.state.Accounts))
	removed := false
	for _, account := range a.state.Accounts {
		if account.ID == accountID {
			removed = true
			continue
		}
		nextAccounts = append(nextAccounts, account)
	}
	if !removed {
		a.mu.Unlock()
		return AppState{}, fmt.Errorf("account not found: %s", accountID)
	}
	a.state.Accounts = nextAccounts
	next := a.state
	a.mu.Unlock()

	if err := saveState(a.statePath, next); err != nil {
		return AppState{}, err
	}

	return next, nil
}

func (a *App) ImportAccounts(raw string, delimiter string) (ImportResult, error) {
	parsed, errs := parseAccountsFromText(raw, delimiter)
	if len(parsed) == 0 {
		return ImportResult{
			State:    a.GetState(),
			Imported: 0,
			Failed:   len(errs),
			Errors:   errs,
		}, nil
	}

	a.mu.Lock()
	for _, input := range parsed {
		account := normalizeAccount(Account{
			ID:           input.ID,
			Label:        input.Label,
			Email:        input.Email,
			ClientID:     input.ClientID,
			RefreshToken: input.RefreshToken,
			Mailbox:      input.Mailbox,
			Socks5:       input.Socks5,
			HTTPProxy:    input.HTTPProxy,
		})
		if account.Label == "" {
			account.Label = account.Email
		}

		replaced := false
		for i := range a.state.Accounts {
			if a.state.Accounts[i].Email == account.Email {
				account.ID = a.state.Accounts[i].ID
				a.state.Accounts[i] = account
				replaced = true
				break
			}
		}

		if !replaced {
			account.ID = generateAccountID()
			a.state.Accounts = append(a.state.Accounts, account)
		}
	}
	next := a.state
	a.mu.Unlock()

	if err := saveState(a.statePath, next); err != nil {
		return ImportResult{}, err
	}

	return ImportResult{
		State:    next,
		Imported: len(parsed),
		Failed:   len(errs),
		Errors:   errs,
	}, nil
}

func (a *App) RunActionWithMailbox(accountID string, action string, mailbox string) (ActionResult, error) {
	accountID = strings.TrimSpace(accountID)
	action = strings.TrimSpace(action)
	mailbox = strings.TrimSpace(mailbox)

	if accountID == "" {
		return ActionResult{}, fmt.Errorf("account ID is required")
	}
	if action == "" {
		return ActionResult{}, fmt.Errorf("action is required")
	}

	account, baseURL, err := a.findAccountAndBaseURL(accountID)
	if err != nil {
		return ActionResult{}, err
	}

	if mailbox == "" {
		mailbox = account.Mailbox
	}
	if mailbox == "" {
		mailbox = "INBOX"
	}

	account.Mailbox = mailbox
	return a.executeAction(baseURL, account, action)
}

func (a *App) RunAction(accountID string, action string) (ActionResult, error) {
	accountID = strings.TrimSpace(accountID)
	action = strings.TrimSpace(action)

	if accountID == "" {
		return ActionResult{}, fmt.Errorf("account ID is required")
	}
	if action == "" {
		return ActionResult{}, fmt.Errorf("action is required")
	}

	account, baseURL, err := a.findAccountAndBaseURL(accountID)
	if err != nil {
		return ActionResult{}, err
	}
	if account.Mailbox == "" {
		account.Mailbox = "INBOX"
	}

	return a.executeAction(baseURL, account, action)
}

func (a *App) findAccountAndBaseURL(accountID string) (Account, string, error) {
	a.mu.Lock()
	baseURL := a.state.APIBaseURL
	var account Account
	found := false
	for _, candidate := range a.state.Accounts {
		if candidate.ID == accountID {
			account = candidate
			found = true
			break
		}
	}
	a.mu.Unlock()

	if !found {
		return Account{}, "", fmt.Errorf("account not found: %s", accountID)
	}
	if baseURL == "" {
		return Account{}, "", fmt.Errorf("api base URL is not configured")
	}

	return account, baseURL, nil
}

func (a *App) executeAction(baseURL string, account Account, action string) (ActionResult, error) {
	requestURL, err := buildActionURL(baseURL, action)
	if err != nil {
		return ActionResult{}, err
	}

	payload := buildActionPayload(account)
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return ActionResult{}, err
	}

	reqContext := a.ctx
	if reqContext == nil {
		reqContext = context.Background()
	}

	req, err := http.NewRequestWithContext(reqContext, http.MethodPost, requestURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return ActionResult{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.client.Do(req)
	if err != nil {
		return ActionResult{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return ActionResult{}, err
	}

	return ActionResult{
		Action:     action,
		URL:        requestURL,
		StatusCode: resp.StatusCode,
		Body:       string(body),
	}, nil
}

func defaultStatePath() string {
	return filepath.Join(dataDirPath(), "state.json")
}

func generateAccountID() string {
	return fmt.Sprintf("acc-%d", time.Now().UnixNano())
}
