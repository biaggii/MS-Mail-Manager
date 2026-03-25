import { Email, Post } from "../types"

export const DEFAULT_TAB = "Default"
export const DEFAULT_SPLIT_SYMBOL = "----"
export const DEFAULT_PAGE_SIZE = 5

export function normalizeTabName(value: string): string {
  const next = value.trim()
  return next === "" ? DEFAULT_TAB : next
}

export function normalizePageSize(value: number): number {
  return [5, 10, 20, 50, 100].includes(value) ? value : DEFAULT_PAGE_SIZE
}

export function normalizeTag(value: string): string {
  return value.trim()
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []
  for (const raw of tags) {
    const next = normalizeTag(raw)
    if (next === "" || seen.has(next)) continue
    seen.add(next)
    output.push(next)
  }
  return output
}

export function normalizeLang(value: string): "eng" | "cht" {
  const next = value.trim().toLowerCase()
  if (next === "cht" || next === "zh") return "cht"
  if (next === "eng" || next === "en") return "eng"
  return "eng"
}

export function normalizeEmail(row: Email): Email {
  return {
    email: (row.email || "").trim(),
    password: (row.password || "").trim(),
    client_id: (row.client_id || "").trim(),
    refresh_token: (row.refresh_token || "").trim(),
    tab: normalizeTabName(row.tab || DEFAULT_TAB),
    remark: (row.remark || "").trim(),
    tags: normalizeTags(row.tags || []),
  }
}

export function normalizeEmailList(rows: Email[]): Email[] {
  return rows.map(normalizeEmail)
}

export function normalizeTabs(input: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []
  for (const raw of [DEFAULT_TAB, ...input]) {
    const tab = normalizeTabName(raw)
    const key = tab.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(tab)
  }
  return output
}
