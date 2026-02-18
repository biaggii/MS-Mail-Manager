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

type UIMailItem struct {
	Email        string   `json:"email"`
	Password     string   `json:"password"`
	ClientID     string   `json:"client_id"`
	RefreshToken string   `json:"refresh_token"`
	Tab          string   `json:"tab"`
	Remark       string   `json:"remark"`
	Tags         []string `json:"tags"`
}

type UIPost struct {
	Send    string `json:"send"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
	HTML    string `json:"html"`
	Date    string `json:"date"`
}

type UIState struct {
	Lang        string              `json:"lang"`
	SplitSymbol string              `json:"splitSymbol"`
	Tabs        []string            `json:"tabs"`
	ActiveTab   string              `json:"activeTab"`
	PageSize    int                 `json:"pageSize"`
	MailList    []UIMailItem        `json:"mailList"`
	MailCache   map[string][]UIPost `json:"mailCache"`
}
