package main

import "testing"

func TestParseAccountsFromText(t *testing.T) {
	raw := `
JoshuaWalker1453@outlook.com----hG0C1LsGKJMDm3----9e5f94bc-e8a4-4e73-b8be-63364c29d753----token-1
bad-line
SherriPage3148@outlook.com----awQr5mXr4n----9e5f94bc-e8a4-4e73-b8be-63364c29d753----token-2
`

	accounts, errs := parseAccountsFromText(raw, "----")
	if len(accounts) != 2 {
		t.Fatalf("expected 2 parsed accounts, got %d", len(accounts))
	}
	if len(errs) != 1 {
		t.Fatalf("expected 1 parse error, got %d", len(errs))
	}

	if accounts[0].Email != "JoshuaWalker1453@outlook.com" {
		t.Fatalf("unexpected first email: %q", accounts[0].Email)
	}
	if accounts[0].Label != "hG0C1LsGKJMDm3" {
		t.Fatalf("unexpected first label: %q", accounts[0].Label)
	}
	if accounts[0].Mailbox != "INBOX" {
		t.Fatalf("expected default mailbox INBOX, got %q", accounts[0].Mailbox)
	}
}

func TestParseAccountsFromTextSplitNHandlesTokenContent(t *testing.T) {
	raw := "a@b.com----user----cid----abc----def"

	accounts, errs := parseAccountsFromText(raw, "----")
	if len(errs) != 0 {
		t.Fatalf("expected no parse errors, got %d", len(errs))
	}
	if len(accounts) != 1 {
		t.Fatalf("expected 1 parsed account, got %d", len(accounts))
	}
	if accounts[0].RefreshToken != "abc----def" {
		t.Fatalf("expected token with separator preserved, got %q", accounts[0].RefreshToken)
	}
}
