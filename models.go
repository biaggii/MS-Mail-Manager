package main

type Account struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	Email        string `json:"email"`
	ClientID     string `json:"clientID"`
	RefreshToken string `json:"refreshToken"`
	Mailbox      string `json:"mailbox"`
	Socks5       string `json:"socks5"`
	HTTPProxy    string `json:"httpProxy"`
}

type AccountInput struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	Email        string `json:"email"`
	ClientID     string `json:"clientID"`
	RefreshToken string `json:"refreshToken"`
	Mailbox      string `json:"mailbox"`
	Socks5       string `json:"socks5"`
	HTTPProxy    string `json:"httpProxy"`
}

type AppState struct {
	APIBaseURL string    `json:"apiBaseURL"`
	Accounts   []Account `json:"accounts"`
}

type ActionResult struct {
	Action     string `json:"action"`
	URL        string `json:"url"`
	StatusCode int    `json:"statusCode"`
	Body       string `json:"body"`
}

type ImportResult struct {
	State    AppState `json:"state"`
	Imported int      `json:"imported"`
	Failed   int      `json:"failed"`
	Errors   []string `json:"errors"`
}
