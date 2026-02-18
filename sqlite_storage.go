package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	_ "modernc.org/sqlite"
)

const sqliteDBFileName = "app.db"

type mailTagPair struct {
	Email string
	Tag   string
}

func sqlitePathFromLegacyPath(filePath string) string {
	dir := filepath.Dir(filePath)
	if dir == "" {
		dir = "."
	}
	return filepath.Join(dir, sqliteDBFileName)
}

func legacyStatePathFromAnyPath(filePath string) string {
	dir := filepath.Dir(filePath)
	if dir == "" {
		dir = "."
	}
	return filepath.Join(dir, "state.json")
}

func legacyUIStatePathFromAnyPath(filePath string) string {
	dir := filepath.Dir(filePath)
	if dir == "" {
		dir = "."
	}
	return filepath.Join(dir, "ui-state.json")
}

func openSQLiteStorage(dbPath string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	if err := initSQLiteSchema(db); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

func initSQLiteSchema(db *sql.DB) error {
	statements := []string{
		`PRAGMA journal_mode=WAL;`,
		`PRAGMA synchronous=NORMAL;`,
		`PRAGMA foreign_keys=ON;`,
		`PRAGMA busy_timeout=5000;`,
		`CREATE TABLE IF NOT EXISTS app_settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS accounts (
			id TEXT PRIMARY KEY,
			label TEXT NOT NULL,
			email TEXT NOT NULL,
			client_id TEXT NOT NULL,
			refresh_token TEXT NOT NULL,
			mailbox TEXT NOT NULL,
			socks5 TEXT NOT NULL DEFAULT '',
			http_proxy TEXT NOT NULL DEFAULT ''
		);`,
		`CREATE TABLE IF NOT EXISTS ui_settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS ui_tabs (
			name TEXT PRIMARY KEY
		);`,
		`CREATE TABLE IF NOT EXISTS ui_mails (
			email TEXT PRIMARY KEY,
			password TEXT NOT NULL DEFAULT '',
			client_id TEXT NOT NULL DEFAULT '',
			refresh_token TEXT NOT NULL DEFAULT '',
			tab TEXT NOT NULL DEFAULT 'Default',
			remark TEXT NOT NULL DEFAULT ''
		);`,
		`CREATE TABLE IF NOT EXISTS ui_tags (
			name TEXT PRIMARY KEY
		);`,
		`CREATE TABLE IF NOT EXISTS ui_mail_tags (
			email TEXT NOT NULL,
			tag TEXT NOT NULL,
			PRIMARY KEY (email, tag),
			FOREIGN KEY (email) REFERENCES ui_mails(email) ON DELETE CASCADE,
			FOREIGN KEY (tag) REFERENCES ui_tags(name) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS ui_mail_cache (
			cache_key TEXT PRIMARY KEY,
			posts_json TEXT NOT NULL DEFAULT '[]'
		);`,
		`CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);`,
		`CREATE INDEX IF NOT EXISTS idx_ui_mails_tab ON ui_mails(tab);`,
		`CREATE INDEX IF NOT EXISTS idx_ui_mail_tags_tag ON ui_mail_tags(tag);`,
	}

	for _, statement := range statements {
		if _, err := db.Exec(statement); err != nil {
			return fmt.Errorf("sqlite schema init failed: %w", err)
		}
	}

	return nil
}

func dbTableHasRows(db *sql.DB, tableName string) (bool, error) {
	var count int
	query := fmt.Sprintf("SELECT COUNT(1) FROM %s", tableName)
	if err := db.QueryRow(query).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func dbHasAppData(db *sql.DB) (bool, error) {
	settings, err := dbTableHasRows(db, "app_settings")
	if err != nil {
		return false, err
	}
	if settings {
		return true, nil
	}
	return dbTableHasRows(db, "accounts")
}

func dbHasUIData(db *sql.DB) (bool, error) {
	tables := []string{"ui_settings", "ui_tabs", "ui_mails", "ui_mail_cache", "ui_tags", "ui_mail_tags"}
	for _, table := range tables {
		hasRows, err := dbTableHasRows(db, table)
		if err != nil {
			return false, err
		}
		if hasRows {
			return true, nil
		}
	}
	return false, nil
}

func readLegacyAppStateFile(filePath string) (AppState, bool, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return AppState{}, false, nil
		}
		return AppState{}, false, err
	}

	var state AppState
	if err := json.Unmarshal(content, &state); err != nil {
		return AppState{}, false, err
	}
	return normalizeState(state), true, nil
}

func readLegacyUIStateFile(filePath string) (UIState, bool, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return UIState{}, false, nil
		}
		return UIState{}, false, err
	}

	var state UIState
	if err := json.Unmarshal(content, &state); err != nil {
		return UIState{}, false, err
	}
	return normalizeUIState(state), true, nil
}

func migrateLegacyAppState(db *sql.DB, filePath string) error {
	hasData, err := dbHasAppData(db)
	if err != nil {
		return err
	}
	if hasData {
		return nil
	}

	state, found, err := readLegacyAppStateFile(filePath)
	if err != nil {
		return err
	}
	if !found {
		return nil
	}

	return dbSaveAppState(db, state)
}

func migrateLegacyUIState(db *sql.DB, filePath string) error {
	hasData, err := dbHasUIData(db)
	if err != nil {
		return err
	}
	if hasData {
		return nil
	}

	state, found, err := readLegacyUIStateFile(filePath)
	if err != nil {
		return err
	}
	if !found {
		return nil
	}

	return dbSaveUIState(db, state)
}

func dbLoadAppState(db *sql.DB) (AppState, error) {
	state := defaultState()

	var apiBaseURL string
	switch err := db.QueryRow(`SELECT value FROM app_settings WHERE key = 'apiBaseURL'`).Scan(&apiBaseURL); err {
	case nil:
		state.APIBaseURL = apiBaseURL
	case sql.ErrNoRows:
	default:
		return AppState{}, err
	}

	rows, err := db.Query(`
		SELECT id, label, email, client_id, refresh_token, mailbox, socks5, http_proxy
		FROM accounts
		ORDER BY rowid
	`)
	if err != nil {
		return AppState{}, err
	}
	defer rows.Close()

	accounts := []Account{}
	for rows.Next() {
		var account Account
		if err := rows.Scan(
			&account.ID,
			&account.Label,
			&account.Email,
			&account.ClientID,
			&account.RefreshToken,
			&account.Mailbox,
			&account.Socks5,
			&account.HTTPProxy,
		); err != nil {
			return AppState{}, err
		}
		accounts = append(accounts, normalizeAccount(account))
	}
	if err := rows.Err(); err != nil {
		return AppState{}, err
	}

	state.Accounts = accounts
	return normalizeState(state), nil
}

func dbSaveAppState(db *sql.DB, state AppState) error {
	state = normalizeState(state)

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.Exec(`DELETE FROM app_settings`); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT INTO app_settings(key, value) VALUES('apiBaseURL', ?)`, state.APIBaseURL); err != nil {
		return err
	}

	if _, err := tx.Exec(`DELETE FROM accounts`); err != nil {
		return err
	}

	for _, account := range state.Accounts {
		if _, err := tx.Exec(`
			INSERT INTO accounts(id, label, email, client_id, refresh_token, mailbox, socks5, http_proxy)
			VALUES(?, ?, ?, ?, ?, ?, ?, ?)
		`,
			account.ID,
			account.Label,
			account.Email,
			account.ClientID,
			account.RefreshToken,
			account.Mailbox,
			account.Socks5,
			account.HTTPProxy,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func dbLoadUIState(db *sql.DB) (UIState, error) {
	state := defaultUIState()

	settings := map[string]string{}
	rows, err := db.Query(`SELECT key, value FROM ui_settings`)
	if err != nil {
		return UIState{}, err
	}
	for rows.Next() {
		var key string
		var value string
		if err := rows.Scan(&key, &value); err != nil {
			rows.Close()
			return UIState{}, err
		}
		settings[key] = value
	}
	if err := rows.Close(); err != nil {
		return UIState{}, err
	}

	if value, ok := settings["lang"]; ok {
		state.Lang = value
	}
	if value, ok := settings["splitSymbol"]; ok {
		state.SplitSymbol = value
	}
	if value, ok := settings["activeTab"]; ok {
		state.ActiveTab = value
	}
	if value, ok := settings["pageSize"]; ok {
		if pageSize, err := strconv.Atoi(strings.TrimSpace(value)); err == nil {
			state.PageSize = pageSize
		}
	}

	tabs := []string{}
	rows, err = db.Query(`SELECT name FROM ui_tabs ORDER BY rowid`)
	if err != nil {
		return UIState{}, err
	}
	for rows.Next() {
		var tab string
		if err := rows.Scan(&tab); err != nil {
			rows.Close()
			return UIState{}, err
		}
		tabs = append(tabs, tab)
	}
	if err := rows.Close(); err != nil {
		return UIState{}, err
	}
	state.Tabs = tabs

	mails := []UIMailItem{}
	rows, err = db.Query(`
		SELECT email, password, client_id, refresh_token, tab, remark
		FROM ui_mails
		ORDER BY rowid
	`)
	if err != nil {
		return UIState{}, err
	}
	for rows.Next() {
		var item UIMailItem
		if err := rows.Scan(
			&item.Email,
			&item.Password,
			&item.ClientID,
			&item.RefreshToken,
			&item.Tab,
			&item.Remark,
		); err != nil {
			rows.Close()
			return UIState{}, err
		}
		item.Tags = []string{}
		mails = append(mails, item)
	}
	if err := rows.Close(); err != nil {
		return UIState{}, err
	}

	tagsByEmail := map[string][]string{}
	rows, err = db.Query(`SELECT email, tag FROM ui_mail_tags ORDER BY rowid`)
	if err != nil {
		return UIState{}, err
	}
	for rows.Next() {
		var email string
		var tag string
		if err := rows.Scan(&email, &tag); err != nil {
			rows.Close()
			return UIState{}, err
		}
		tagsByEmail[email] = append(tagsByEmail[email], tag)
	}
	if err := rows.Close(); err != nil {
		return UIState{}, err
	}
	for i := range mails {
		mails[i].Tags = normalizeTags(tagsByEmail[mails[i].Email])
	}
	state.MailList = mails

	cache := map[string][]UIPost{}
	rows, err = db.Query(`SELECT cache_key, posts_json FROM ui_mail_cache`)
	if err != nil {
		return UIState{}, err
	}
	for rows.Next() {
		var cacheKey string
		var postsJSON string
		if err := rows.Scan(&cacheKey, &postsJSON); err != nil {
			rows.Close()
			return UIState{}, err
		}

		posts := []UIPost{}
		if strings.TrimSpace(postsJSON) != "" {
			if err := json.Unmarshal([]byte(postsJSON), &posts); err != nil {
				rows.Close()
				return UIState{}, err
			}
		}
		cache[cacheKey] = posts
	}
	if err := rows.Close(); err != nil {
		return UIState{}, err
	}
	state.MailCache = cache

	return normalizeUIState(state), nil
}

func dbSaveUIState(db *sql.DB, state UIState) error {
	state = normalizeUIState(state)

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.Exec(`DELETE FROM ui_settings`); err != nil {
		return err
	}
	settings := map[string]string{
		"lang":        state.Lang,
		"splitSymbol": state.SplitSymbol,
		"activeTab":   state.ActiveTab,
		"pageSize":    strconv.Itoa(state.PageSize),
	}
	for key, value := range settings {
		if _, err := tx.Exec(`INSERT INTO ui_settings(key, value) VALUES(?, ?)`, key, value); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(`DELETE FROM ui_tabs`); err != nil {
		return err
	}
	for _, tab := range state.Tabs {
		if _, err := tx.Exec(`INSERT INTO ui_tabs(name) VALUES(?)`, tab); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(`DELETE FROM ui_mail_tags`); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM ui_tags`); err != nil {
		return err
	}
	if _, err := tx.Exec(`DELETE FROM ui_mails`); err != nil {
		return err
	}

	tagSet := map[string]struct{}{}
	tagLinks := []mailTagPair{}
	for _, row := range state.MailList {
		if _, err := tx.Exec(`
			INSERT INTO ui_mails(email, password, client_id, refresh_token, tab, remark)
			VALUES(?, ?, ?, ?, ?, ?)
		`, row.Email, row.Password, row.ClientID, row.RefreshToken, row.Tab, row.Remark); err != nil {
			return err
		}

		for _, tag := range normalizeTags(row.Tags) {
			tagSet[tag] = struct{}{}
			tagLinks = append(tagLinks, mailTagPair{Email: row.Email, Tag: tag})
		}
	}
	for tag := range tagSet {
		if _, err := tx.Exec(`INSERT INTO ui_tags(name) VALUES(?)`, tag); err != nil {
			return err
		}
	}
	for _, pair := range tagLinks {
		if _, err := tx.Exec(`INSERT INTO ui_mail_tags(email, tag) VALUES(?, ?)`, pair.Email, pair.Tag); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(`DELETE FROM ui_mail_cache`); err != nil {
		return err
	}
	for cacheKey, posts := range state.MailCache {
		body, err := json.Marshal(posts)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(`INSERT INTO ui_mail_cache(cache_key, posts_json) VALUES(?, ?)`, cacheKey, string(body)); err != nil {
			return err
		}
	}

	return tx.Commit()
}
