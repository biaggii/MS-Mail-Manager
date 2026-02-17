package main

import (
	"fmt"
	"strings"
)

func parseAccountsFromText(raw string, delimiter string) ([]AccountInput, []string) {
	delimiter = strings.TrimSpace(delimiter)
	if delimiter == "" {
		delimiter = "----"
	}

	lines := strings.Split(raw, "\n")
	accounts := make([]AccountInput, 0, len(lines))
	errs := make([]string, 0)

	for i, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, delimiter, 4)
		if len(parts) != 4 {
			errs = append(errs, fmt.Sprintf("line %d: expected 4 parts", i+1))
			continue
		}

		account := AccountInput{
			Email:        strings.TrimSpace(parts[0]),
			Label:        strings.TrimSpace(parts[1]),
			ClientID:     strings.TrimSpace(parts[2]),
			RefreshToken: strings.TrimSpace(parts[3]),
			Mailbox:      "INBOX",
		}

		if account.Email == "" || account.ClientID == "" || account.RefreshToken == "" {
			errs = append(errs, fmt.Sprintf("line %d: email/clientID/token required", i+1))
			continue
		}

		accounts = append(accounts, account)
	}

	return accounts, errs
}
