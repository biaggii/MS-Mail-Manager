package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var oauthTokenEndpoint = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token"
var graphAPIBaseURL = "https://graph.microsoft.com/v1.0"

type oauthTokenCacheEntry struct {
	AccessToken string
	ExpiresAt   time.Time
}

type graphTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	Scope       string `json:"scope"`
}

type graphMailEnvelope struct {
	Value []graphMailItemRaw `json:"value"`
}

type graphMailItemRaw struct {
	ID              string `json:"id"`
	Subject         string `json:"subject"`
	BodyPreview     string `json:"bodyPreview"`
	CreatedDateTime string `json:"createdDateTime"`
	ReceivedDateTime string `json:"receivedDateTime"`
	Body            struct {
		Content string `json:"content"`
	} `json:"body"`
	From struct {
		EmailAddress struct {
			Address string `json:"address"`
		} `json:"emailAddress"`
	} `json:"from"`
}

type appMailItem struct {
	ID      string `json:"id"`
	Send    string `json:"send"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
	HTML    string `json:"html"`
	Date    string `json:"date"`
}

func normalizeMailboxForGraph(mailbox string) string {
	switch strings.ToUpper(strings.TrimSpace(mailbox)) {
	case "JUNK":
		return "junkemail"
	case "INBOX":
		return "inbox"
	default:
		return "inbox"
	}
}

func (a *App) requestContext() context.Context {
	if a.ctx != nil {
		return a.ctx
	}
	return context.Background()
}

func (a *App) getCachedToken(key string) (string, bool) {
	a.tokenMu.Lock()
	defer a.tokenMu.Unlock()

	entry, ok := a.tokenAuth[key]
	if !ok {
		return "", false
	}
	if time.Now().After(entry.ExpiresAt) {
		delete(a.tokenAuth, key)
		return "", false
	}
	return entry.AccessToken, true
}

func (a *App) setCachedToken(key string, accessToken string, expiresInSeconds int) {
	if accessToken == "" {
		return
	}
	if expiresInSeconds <= 60 {
		expiresInSeconds = 60
	}

	a.tokenMu.Lock()
	a.tokenAuth[key] = oauthTokenCacheEntry{
		AccessToken: accessToken,
		ExpiresAt:   time.Now().Add(time.Duration(expiresInSeconds-60) * time.Second),
	}
	a.tokenMu.Unlock()
}

func (a *App) graphAccessToken(email string, clientID string, refreshToken string) (string, error) {
	cacheKey := strings.ToLower(strings.TrimSpace(email))
	if token, ok := a.getCachedToken(cacheKey); ok {
		return token, nil
	}

	form := url.Values{}
	form.Set("client_id", strings.TrimSpace(clientID))
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", strings.TrimSpace(refreshToken))
	form.Set("scope", "https://graph.microsoft.com/.default")

	req, err := http.NewRequestWithContext(a.requestContext(), http.MethodPost, oauthTokenEndpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := a.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("oauth token request failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp graphTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("oauth token parse error: %w", err)
	}
	if strings.TrimSpace(tokenResp.AccessToken) == "" {
		return "", fmt.Errorf("oauth token response missing access token")
	}

	a.setCachedToken(cacheKey, tokenResp.AccessToken, tokenResp.ExpiresIn)
	return tokenResp.AccessToken, nil
}

func (a *App) graphMailAll(accessToken string, mailbox string, top int) ([]appMailItem, error) {
	if top <= 0 {
		top = 10000
	}
	folder := normalizeMailboxForGraph(mailbox)
	requestURL := fmt.Sprintf("%s/me/mailFolders/%s/messages?$top=%d", graphAPIBaseURL, folder, top)

	req, err := http.NewRequestWithContext(a.requestContext(), http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("graph messages request failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var envelope graphMailEnvelope
	if err := json.Unmarshal(body, &envelope); err != nil {
		return nil, fmt.Errorf("graph messages parse error: %w", err)
	}

	result := make([]appMailItem, 0, len(envelope.Value))
	for _, item := range envelope.Value {
		date := item.CreatedDateTime
		if date == "" {
			date = item.ReceivedDateTime
		}
		result = append(result, appMailItem{
			ID:      item.ID,
			Send:    item.From.EmailAddress.Address,
			Subject: item.Subject,
			Text:    item.BodyPreview,
			HTML:    item.Body.Content,
			Date:    date,
		})
	}
	return result, nil
}

func (a *App) graphDeleteMail(accessToken string, id string) error {
	requestURL := fmt.Sprintf("%s/me/messages/%s", graphAPIBaseURL, url.PathEscape(id))
	req, err := http.NewRequestWithContext(a.requestContext(), http.MethodDelete, requestURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := a.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("graph delete request failed (HTTP %d): %s", resp.StatusCode, string(body))
	}
	return nil
}

func (a *App) MailAll(email string, password string, clientID string, refreshToken string, mailbox string) (ActionResult, error) {
	_ = password

	email = strings.TrimSpace(email)
	clientID = strings.TrimSpace(clientID)
	refreshToken = strings.TrimSpace(refreshToken)
	if email == "" || clientID == "" || refreshToken == "" {
		return ActionResult{}, fmt.Errorf("email, client ID, and refresh token are required")
	}

	accessToken, err := a.graphAccessToken(email, clientID, refreshToken)
	if err != nil {
		return ActionResult{}, err
	}

	mails, err := a.graphMailAll(accessToken, mailbox, 10000)
	if err != nil {
		return ActionResult{}, err
	}

	body, err := json.Marshal(map[string]any{
		"code": 200,
		"data": mails,
	})
	if err != nil {
		return ActionResult{}, err
	}

	return ActionResult{
		Action:     "mail_all",
		URL:        "internal://graph/mail_all",
		StatusCode: http.StatusOK,
		Body:       string(body),
	}, nil
}

func (a *App) ProcessMailbox(email string, password string, clientID string, refreshToken string, mailbox string) (ActionResult, error) {
	_ = password

	email = strings.TrimSpace(email)
	clientID = strings.TrimSpace(clientID)
	refreshToken = strings.TrimSpace(refreshToken)
	if email == "" || clientID == "" || refreshToken == "" {
		return ActionResult{}, fmt.Errorf("email, client ID, and refresh token are required")
	}

	accessToken, err := a.graphAccessToken(email, clientID, refreshToken)
	if err != nil {
		return ActionResult{}, err
	}

	mails, err := a.graphMailAll(accessToken, mailbox, 10000)
	if err != nil {
		return ActionResult{}, err
	}

	for _, mail := range mails {
		if mail.ID == "" {
			continue
		}
		if err := a.graphDeleteMail(accessToken, mail.ID); err != nil {
			return ActionResult{}, err
		}
	}

	body, err := json.Marshal(map[string]any{
		"code":    200,
		"message": "ok",
	})
	if err != nil {
		return ActionResult{}, err
	}

	return ActionResult{
		Action:     "process_mailbox",
		URL:        "internal://graph/process-mailbox",
		StatusCode: http.StatusOK,
		Body:       string(body),
	}, nil
}
