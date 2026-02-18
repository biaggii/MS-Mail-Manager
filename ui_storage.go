package main

import (
	"path/filepath"
	"strings"
)

const (
	defaultLang        = "eng"
	defaultSplitSymbol = "----"
	defaultTab         = "Default"
	defaultPageSize    = 5
)

var allowedPageSizes = map[int]struct{}{
	5:   {},
	10:  {},
	20:  {},
	50:  {},
	100: {},
}

func loadUIState(filePath string) (UIState, error) {
	sqliteStorageMu.Lock()
	defer sqliteStorageMu.Unlock()

	db, err := openSQLiteStorage(sqlitePathFromLegacyPath(filePath))
	if err != nil {
		return UIState{}, err
	}
	defer db.Close()

	if err := migrateLegacyUIState(db, filePath); err != nil {
		return UIState{}, err
	}

	return dbLoadUIState(db)
}

func saveUIState(filePath string, state UIState) error {
	sqliteStorageMu.Lock()
	defer sqliteStorageMu.Unlock()

	db, err := openSQLiteStorage(sqlitePathFromLegacyPath(filePath))
	if err != nil {
		return err
	}
	defer db.Close()

	return dbSaveUIState(db, state)
}

func defaultUIState() UIState {
	return UIState{
		Lang:        defaultLang,
		SplitSymbol: defaultSplitSymbol,
		Tabs:        []string{defaultTab},
		ActiveTab:   defaultTab,
		PageSize:    defaultPageSize,
		MailList:    []UIMailItem{},
		MailCache:   map[string][]UIPost{},
	}
}

func normalizeUIState(state UIState) UIState {
	state.Lang = strings.ToLower(strings.TrimSpace(state.Lang))
	switch state.Lang {
	case "en", "eng":
		state.Lang = "eng"
	case "zh", "cht":
		state.Lang = "cht"
	default:
		state.Lang = defaultLang
	}

	state.SplitSymbol = strings.TrimSpace(state.SplitSymbol)
	if state.SplitSymbol == "" {
		state.SplitSymbol = defaultSplitSymbol
	}

	if _, ok := allowedPageSizes[state.PageSize]; !ok {
		state.PageSize = defaultPageSize
	}

	if state.Tabs == nil {
		state.Tabs = []string{}
	}
	if state.MailList == nil {
		state.MailList = []UIMailItem{}
	}
	if state.MailCache == nil {
		state.MailCache = map[string][]UIPost{}
	}

	for i := range state.MailList {
		state.MailList[i] = normalizeUIMailItem(state.MailList[i])
	}

	state.Tabs = normalizeUITabs(state.Tabs)
	for _, row := range state.MailList {
		if !containsTab(state.Tabs, row.Tab) {
			state.Tabs = append(state.Tabs, row.Tab)
		}
	}
	state.Tabs = normalizeUITabs(state.Tabs)

	state.ActiveTab = normalizeUITabName(state.ActiveTab)
	if !containsTab(state.Tabs, state.ActiveTab) {
		state.ActiveTab = defaultTab
	}

	return state
}

func normalizeUIMailItem(item UIMailItem) UIMailItem {
	item.Email = strings.TrimSpace(item.Email)
	item.Password = strings.TrimSpace(item.Password)
	item.ClientID = strings.TrimSpace(item.ClientID)
	item.RefreshToken = strings.TrimSpace(item.RefreshToken)
	item.Tab = normalizeUITabName(item.Tab)
	item.Remark = strings.TrimSpace(item.Remark)
	item.Tags = normalizeTags(item.Tags)
	return item
}

func normalizeTags(tags []string) []string {
	if tags == nil {
		return []string{}
	}
	seen := map[string]struct{}{}
	output := []string{}
	for _, raw := range tags {
		next := strings.TrimSpace(raw)
		if next == "" {
			continue
		}
		if _, ok := seen[next]; ok {
			continue
		}
		seen[next] = struct{}{}
		output = append(output, next)
	}
	return output
}

func normalizeUITabs(input []string) []string {
	seen := map[string]struct{}{}
	output := []string{}
	for _, raw := range append([]string{defaultTab}, input...) {
		next := normalizeUITabName(raw)
		key := strings.ToLower(next)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		output = append(output, next)
	}
	return output
}

func containsTab(tabs []string, target string) bool {
	for _, tab := range tabs {
		if strings.EqualFold(tab, target) {
			return true
		}
	}
	return false
}

func normalizeUITabName(value string) string {
	next := strings.TrimSpace(value)
	if next == "" {
		return defaultTab
	}
	return next
}

func dataDirPath() string {
	return filepath.Join(".", "data")
}

func defaultUIStatePath() string {
	return filepath.Join(dataDirPath(), "ui-state.json")
}
