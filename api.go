package main

import (
	"fmt"
	"strings"
)

func buildActionEndpoint(action string) (string, error) {
	switch action {
	case "mail_new":
		return "/api/mail_new", nil
	case "mail_all":
		return "/api/mail_all", nil
	case "process_mailbox":
		return "/api/process-mailbox", nil
	case "test_proxy":
		return "/api/test-proxy", nil
	default:
		return "", fmt.Errorf("unsupported action: %s", action)
	}
}

func buildActionURL(baseURL string, action string) (string, error) {
	endpoint, err := buildActionEndpoint(action)
	if err != nil {
		return "", err
	}

	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	return fmt.Sprintf("%s%s", baseURL, endpoint), nil
}

func buildActionPayload(account Account) map[string]string {
	payload := map[string]string{
		"refresh_token": account.RefreshToken,
		"client_id":     account.ClientID,
		"email":         account.Email,
		"mailbox":       account.Mailbox,
	}

	if account.Socks5 != "" {
		payload["socks5"] = account.Socks5
	}
	if account.HTTPProxy != "" {
		payload["http"] = account.HTTPProxy
	}

	return payload
}
