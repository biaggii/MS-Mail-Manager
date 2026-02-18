import { useEffect, useState, useRef, useMemo } from "react"
import { GetUIState, MailAll, ProcessMailbox, SaveUIState } from "../../wailsjs/go/main/App"
import { Lang, translations } from "../i18n/translations"
import { Email, Post, ExportMode } from "../types"
import {
  DEFAULT_TAB,
  DEFAULT_SPLIT_SYMBOL,
  DEFAULT_PAGE_SIZE,
  normalizeLang,
  normalizeTabName,
  normalizePageSize,
  normalizeEmailList,
  normalizeTabs,
  normalizeTags,
  tagsToText,
} from "../lib/mail-utils"

function normalizeLangValue(value: string): Lang {
  const next = value.trim().toLowerCase()
  if (next === "cht" || next === "zh") return "cht"
  if (next === "eng" || next === "en") return "eng"
  return "eng"
}

export function useMailManager() {
  const [lang, setLang] = useState<Lang>("eng")
  const t = translations[lang]
  const [splitSymbol, setSplitSymbol] = useState(DEFAULT_SPLIT_SYMBOL)
  const [tabs, setTabs] = useState<string[]>([DEFAULT_TAB])
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB)
  const [mailList, setMailList] = useState<Email[]>([])
  const [mailCache, setMailCache] = useState<Record<string, Post[]>>({})
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [stateLoaded, setStateLoaded] = useState(false)
  const [postLoading, setPostLoading] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [selectByTags, setSelectByTags] = useState<string[]>([])
  const receiveRequestRef = useRef(0)

  // Initialization
  useEffect(() => {
    let cancelled = false
    void GetUIState()
      .then((stored) => {
        if (cancelled) return

        const loadedList = normalizeEmailList((stored?.mailList || []) as Email[])
        const loadedTabs = normalizeTabs((stored?.tabs || []) as string[])
        const mergedTabs = normalizeTabs([...loadedTabs, ...loadedList.map((item) => item.tab || DEFAULT_TAB)])
        const savedTab = normalizeTabName(stored?.activeTab || DEFAULT_TAB)
        const resolvedTab = mergedTabs.includes(savedTab) ? savedTab : mergedTabs[0]

        setLang(normalizeLangValue(stored?.lang || "eng"))
        setSplitSymbol((stored?.splitSymbol || DEFAULT_SPLIT_SYMBOL).trim() || DEFAULT_SPLIT_SYMBOL)
        setMailList(loadedList)
        setTabs(mergedTabs)
        setActiveTab(resolvedTab)
        setPageSize(normalizePageSize(stored?.pageSize || DEFAULT_PAGE_SIZE))
        setMailCache((stored?.mailCache || {}) as Record<string, Post[]>)
        setStateLoaded(true)
      })
      .catch((error) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Local data load failed: ${message}`)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Auto-save
  useEffect(() => {
    if (!stateLoaded) return
    void SaveUIState({
      lang,
      splitSymbol,
      tabs,
      activeTab,
      pageSize: normalizePageSize(pageSize),
      mailList: normalizeEmailList(mailList),
      mailCache,
    } as any).catch(() => {
      // Ignore persistence failures in UI loop
    })
  }, [stateLoaded, lang, splitSymbol, tabs, activeTab, pageSize, mailList, mailCache])

  const filteredMailList = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    return mailList.filter((item) => {
      const tab = normalizeTabName(item.tab || DEFAULT_TAB)
      if (tab !== activeTab) return false
      const itemTags = normalizeTags(item.tags || [])
      if (selectByTags.length > 0 && !selectByTags.some((tag) => itemTags.includes(tag))) {
        return false
      }
      if (keyword === "") return true
      return item.email.toLowerCase().includes(keyword)
        || item.password.toLowerCase().includes(keyword)
        || (item.remark || "").toLowerCase().includes(keyword)
        || itemTags.some((tag) => tag.includes(keyword))
    })
  }, [mailList, activeTab, searchKeyword, selectByTags])

  const tagOptions = useMemo(() => {
    const seen = new Set<string>()
    const output: string[] = []
    for (const item of mailList) {
      if (normalizeTabName(item.tab || DEFAULT_TAB) !== activeTab) continue
      for (const tag of item.tags || []) {
        const next = tag.trim()
        if (next === "" || seen.has(next)) continue
        seen.add(next)
        output.push(next)
      }
    }
    return output.sort((a, b) => a.localeCompare(b))
  }, [mailList, activeTab])

  function saveMailList(next: Email[]) {
    const normalized = normalizeEmailList(next)
    const mergedTabs = normalizeTabs([...tabs, ...normalized.map((item) => item.tab || DEFAULT_TAB)])
    setMailList(normalized)
    setTabs(mergedTabs)
  }

  function clearMailCacheForEmails(emails: string[]) {
    if (emails.length === 0) return
    const targets = new Set(emails.map((item) => item.toLowerCase()))
    const targetList = Array.from(targets)
    setMailCache((prev) => {
      const next: Record<string, Post[]> = {}
      for (const key of Object.keys(prev)) {
        const lowerKey = key.toLowerCase()
        const matched = targetList.some((email) => lowerKey.startsWith(email))
        if (!matched) {
          next[key] = prev[key]
        }
      }
      return next
    })
  }

  async function fetchMails(row: Email, mailbox: string) {
    if (postLoading) return []
    const requestID = Date.now()
    receiveRequestRef.current = requestID
    setPostLoading(true)

    try {
      const result = await MailAll(
        row.email,
        row.password,
        row.client_id,
        row.refresh_token,
        mailbox,
      )
      if (receiveRequestRef.current !== requestID) return []

      const text = result?.body || ""
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error(text || t.fetchFailed)
      }

      if (data && (data.code === 200 || data.code === "200")) {
        const cacheKey = `${row.email}${mailbox}`
        const nextPosts = (data.data || []) as Post[]
        setMailCache((prev) => ({ ...prev, [cacheKey]: nextPosts }))
        return nextPosts
      }

      if ((result?.statusCode || 200) >= 400) {
        throw new Error(data?.message || t.apiHTTPError(result.statusCode))
      }
      throw new Error(data?.message || t.fetchFailed)
    } finally {
      if (receiveRequestRef.current === requestID) {
        setPostLoading(false)
      }
    }
  }

  function cancelReceive() {
    receiveRequestRef.current = Date.now()
    setPostLoading(false)
  }

  async function clearMailbox(row: Email, boxType: string) {
    const cacheKey = `${row.email}${boxType}`
    setMailCache((prev) => ({ ...prev, [cacheKey]: [] }))
    try {
      const result = await ProcessMailbox(
        row.email,
        row.password,
        row.client_id,
        row.refresh_token,
        boxType,
      )
      if ((result?.statusCode || 200) >= 400) {
        let message = t.apiHTTPError(result.statusCode)
        if (result?.body) {
          try {
            const parsed = JSON.parse(result.body)
            message = parsed?.message || message
          } catch {
            message = result.body
          }
        }
        throw new Error(message)
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  return {
    lang, setLang, t,
    splitSymbol, setSplitSymbol,
    tabs, setTabs,
    activeTab, setActiveTab,
    mailList, setMailList: saveMailList,
    mailCache, setMailCache,
    pageSize, setPageSize,
    selectedEmails, setSelectedEmails,
    searchKeyword, setSearchKeyword,
    selectByTags, setSelectByTags,
    filteredMailList,
    tagOptions,
    postLoading,
    fetchMails,
    cancelReceive,
    clearMailbox,
    clearMailCacheForEmails,
  }
}
