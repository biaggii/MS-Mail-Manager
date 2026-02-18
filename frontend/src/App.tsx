import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import "./App.css"
import { GetUIState, MailAll, ProcessMailbox, SaveUIState } from "../wailsjs/go/main/App"
import { Lang, translations } from "./i18n/translations"
const DEFAULT_TAB = "Default"
const DEFAULT_SPLIT_SYMBOL = "----"
const DEFAULT_PAGE_SIZE = 5

type ExportMode = "full" | "email-only"
type Email = {
  email: string
  password: string
  client_id: string
  refresh_token: string
  tab: string
  remark: string
  tags: string[]
}
type Post = {
  send: string
  subject: string
  text: string
  html: string
  date: string
}
type TagContextMenuState = {
  x: number
  y: number
  rowEmail: string | null
  tag: string
  source: "filter" | "row"
}

function normalizeTabName(value: string): string {
  const next = value.trim()
  return next === "" ? DEFAULT_TAB : next
}

function normalizeLang(value: string): Lang {
  const next = value.trim().toLowerCase()
  if (next === "cht" || next === "zh") return "cht"
  if (next === "eng" || next === "en") return "eng"
  return "eng"
}

function normalizePageSize(value: number): number {
  return [5, 10, 20, 50, 100].includes(value) ? value : DEFAULT_PAGE_SIZE
}

function normalizeTag(value: string): string {
  return value.trim()
}

function normalizeTags(tags: string[]): string[] {
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

function parseTagsInput(value: string): string[] {
  return normalizeTags(value.split(","))
}

function tagsToText(tags: string[]): string {
  return normalizeTags(tags).join(", ")
}

function normalizeEmail(row: Email): Email {
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

function normalizeEmailList(rows: Email[]): Email[] {
  return rows.map(normalizeEmail)
}

function normalizeTabs(input: string[]): string[] {
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

function App() {
  const [lang, setLang] = useState<Lang>("eng")
  const t = translations[lang]
  const [splitSymbol, setSplitSymbol] = useState(DEFAULT_SPLIT_SYMBOL)
  const [fileName, setFileName] = useState("")
  const [emailList, setEmailList] = useState<string[]>([])
  const [tabs, setTabs] = useState<string[]>([DEFAULT_TAB])
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB)
  const [newTabName, setNewTabName] = useState("")
  const [moveTargetTab, setMoveTargetTab] = useState(DEFAULT_TAB)
  const [selectByTags, setSelectByTags] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [exportMode, setExportMode] = useState<ExportMode>("full")
  const [mailList, setMailList] = useState<Email[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [dialogCopyVisible, setDialogCopyVisible] = useState(false)
  const [tagContextMenu, setTagContextMenu] = useState<TagContextMenuState | null>(null)
  const [dialogTagVisible, setDialogTagVisible] = useState(false)
  const [copyTextarea, setCopyTextarea] = useState("")
  const [tagDialogMode, setTagDialogMode] = useState<"add" | "remove">("add")
  const [tagDialogRow, setTagDialogRow] = useState<Email | null>(null)
  const [tagDialogExisting, setTagDialogExisting] = useState<string[]>([])
  const [tagDialogNew, setTagDialogNew] = useState("")
  const [dialogEditVisible, setDialogEditVisible] = useState(false)
  const [dialogEmailVisible, setDialogEmailVisible] = useState(false)
  const [dialogPostVisible, setDialogPostVisible] = useState(false)
  const [dialogEmailContent, setDialogEmailContent] = useState("")
  const [dialogAccountVisible, setDialogAccountVisible] = useState(false)
  const [accountDetail, setAccountDetail] = useState<Email | null>(null)
  const [boxType, setBoxType] = useState("INBOX")
  const [postLoading, setPostLoading] = useState(false)
  const [postList, setPostList] = useState<Post[]>([])
  const [mailCache, setMailCache] = useState<Record<string, Post[]>>({})
  const [nowPost, setNowPost] = useState<Email | null>(null)
  const receiveRequestRef = useRef(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [stateLoaded, setStateLoaded] = useState(false)
  const [editEmail, setEditEmail] = useState("")
  const [editForm, setEditForm] = useState<Email>({
    email: "",
    password: "",
    client_id: "",
    refresh_token: "",
    tab: DEFAULT_TAB,
    remark: "",
    tags: [],
  })

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

        setLang(normalizeLang(stored?.lang || "eng"))
        setSplitSymbol((stored?.splitSymbol || DEFAULT_SPLIT_SYMBOL).trim() || DEFAULT_SPLIT_SYMBOL)
        setMailList(loadedList)
        setTabs(mergedTabs)
        setActiveTab(resolvedTab)
        setMoveTargetTab(resolvedTab)
        setPageSize(normalizePageSize(stored?.pageSize || DEFAULT_PAGE_SIZE))
        setMailCache((stored?.mailCache || {}) as Record<string, Post[]>)
      })
      .catch(() => {
        if (cancelled) return
      })
      .finally(() => {
        if (!cancelled) {
          setStateLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

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
      // Ignore persistence failures in UI loop; user actions should remain responsive.
    })
  }, [stateLoaded, lang, splitSymbol, tabs, activeTab, pageSize, mailList, mailCache])

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0] || DEFAULT_TAB)
    }
    if (!tabs.includes(moveTargetTab)) {
      setMoveTargetTab(tabs[0] || DEFAULT_TAB)
    }
  }, [tabs, activeTab, moveTargetTab])

  useEffect(() => {
    const existing = new Set(mailList.map((item) => item.email))
    setSelectedEmails((prev) => prev.filter((item) => existing.has(item)))
  }, [mailList])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && tagContextMenu) {
        setTagContextMenu(null)
        return
      }
      if (dialogTagVisible) {
        if (event.key === "Escape") {
          closeTagDialog()
          return
        }
        if (event.key === "Enter") {
          event.preventDefault()
          handleApplyTagDialog()
          return
        }
        if (event.key === "Delete" && tagDialogMode === "remove") {
          const hasTargets = tagDialogExisting.length > 0 || parseTagsInput(tagDialogNew).length > 0
          if (hasTargets) {
            event.preventDefault()
            handleApplyTagDialog()
          }
          return
        }
      }
      if (event.key !== "Escape") return
      if (dialogPostVisible) {
        setDialogPostVisible(false)
        return
      }
      if (dialogEmailVisible) {
        handleCancelReceive()
        setDialogEmailVisible(false)
        return
      }
      if (dialogEditVisible) {
        setDialogEditVisible(false)
        return
      }
      if (dialogAccountVisible) {
        setDialogAccountVisible(false)
        return
      }
      if (dialogCopyVisible) {
        setDialogCopyVisible(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    dialogAccountVisible,
    dialogCopyVisible,
    dialogEditVisible,
    dialogEmailVisible,
    dialogPostVisible,
    dialogTagVisible,
    tagContextMenu,
    tagDialogMode,
    tagDialogExisting,
    tagDialogNew,
  ])

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

  const pageTotal = filteredMailList.length
  const pageCount = Math.max(1, Math.ceil(pageTotal / pageSize))
  const clampedPage = Math.min(currentPage, pageCount)
  const tableMailList = useMemo(() => {
    const start = (clampedPage - 1) * pageSize
    return filteredMailList.slice(start, start + pageSize)
  }, [filteredMailList, clampedPage, pageSize])

  const tagOptions = useMemo(() => {
    const seen = new Set<string>()
    const output: string[] = []
    for (const item of mailList) {
      if (normalizeTabName(item.tab || DEFAULT_TAB) !== activeTab) continue
      for (const tag of item.tags || []) {
        const next = normalizeTag(tag)
        if (next === "" || seen.has(next)) continue
        seen.add(next)
        output.push(next)
      }
    }
    return output.sort((a, b) => a.localeCompare(b))
  }, [mailList, activeTab])

  const allTagOptions = useMemo(() => {
    const seen = new Set<string>()
    const output: string[] = []
    for (const item of mailList) {
      for (const tag of item.tags || []) {
        const next = normalizeTag(tag)
        if (next === "" || seen.has(next)) continue
        seen.add(next)
        output.push(next)
      }
    }
    return output.sort((a, b) => a.localeCompare(b))
  }, [mailList])

  const dialogTagOptions = useMemo(() => {
    if (tagDialogMode === "add") return allTagOptions
    if (!tagDialogRow) return []
    const current = mailList.find((item) => item.email === tagDialogRow.email)
    return normalizeTags(current?.tags || tagDialogRow.tags || [])
  }, [tagDialogMode, tagDialogRow, allTagOptions, mailList])

  useEffect(() => {
    setSelectByTags((prev) => prev.filter((tag) => tagOptions.includes(tag)))
  }, [tagOptions])

  useEffect(() => {
    if (!dialogTagVisible) return
    setTagDialogExisting((prev) => {
      const filtered = prev.filter((tag) => dialogTagOptions.includes(tag))
      if (filtered.length === prev.length && filtered.every((tag, idx) => tag === prev[idx])) {
        return prev
      }
      return filtered
    })
  }, [dialogTagVisible, dialogTagOptions])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchKeyword, selectByTags])

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

  function handleSelectByTagsChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = Array.from(event.target.selectedOptions).map((item) => normalizeTag(item.value))
    setSelectByTags(normalizeTags(next))
  }

  function openTagContextMenu(
    event: React.MouseEvent<HTMLElement>,
    source: "filter" | "row",
    row: Email | null = null,
    tag = "",
  ) {
    event.preventDefault()
    event.stopPropagation()
    setTagContextMenu({
      x: event.clientX,
      y: event.clientY,
      rowEmail: row?.email || null,
      tag: normalizeTag(tag),
      source,
    })
  }

  function closeTagContextMenu() {
    setTagContextMenu(null)
  }

  async function copyText(value: string) {
    const text = value.trim()
    if (text === "") return
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      const area = document.createElement("textarea")
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand("copy")
      document.body.removeChild(area)
    }
  }

  function buildAllEmailInfo(row: Email): string {
    return [
      `address: ${row.email}`,
      `clientID: ${row.client_id}`,
      `refreshToken: ${row.refresh_token}`,
      `tag: ${tagsToText(row.tags || [])}`,
    ].join("\n")
  }

  function handleTagDialogExistingChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = Array.from(event.target.selectedOptions).map((item) => normalizeTag(item.value))
    setTagDialogExisting(normalizeTags(next))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name.length > 10 ? `${file.name.slice(0, 10)}...` : file.name)
    file.text().then((content) => {
      setEmailList(content.split("\n"))
    })
    event.target.value = ""
  }

  function parseLine(line: string): Email {
    const tempArr = line.split(splitSymbol)
    return {
      email: tempArr[0] || "",
      password: tempArr[1] || "",
      client_id: tempArr[2] || "",
      refresh_token: tempArr.slice(3).join(splitSymbol) || "",
      tab: activeTab,
      remark: "",
      tags: [],
    }
  }

  function parseImportedLines(lines: string[]) {
    return lines
      .map((item) => item.trim())
      .filter((item) => item !== "")
      .map(parseLine)
  }

  function importParsedRows(parsed: Email[]) {
    if (parsed.length === 0) {
      alert(t.selectFileFirst)
      return
    }
    const next = mailList.concat(parsed.map((item) => ({ ...item, tab: activeTab })))
    saveMailList(next)
    setEmailList([])
    setCopyTextarea("")
    setDialogCopyVisible(false)
    setFileName("")
    alert(t.addSuccess(parsed.length, activeTab))
  }

  function handleAdd() {
    importParsedRows(parseImportedLines(emailList))
  }

  function handlePasteAdd() {
    importParsedRows(parseImportedLines(copyTextarea.split("\n")))
  }

  function handleSelectionChange(email: string, checked: boolean) {
    if (checked) setSelectedEmails((prev) => (prev.includes(email) ? prev : [...prev, email]))
    else setSelectedEmails((prev) => prev.filter((item) => item !== email))
  }

  function handleToggleAll(checked: boolean) {
    const pageEmails = tableMailList.map((item) => item.email)
    if (checked) {
      setSelectedEmails((prev) => Array.from(new Set([...prev, ...pageEmails])))
    } else {
      setSelectedEmails((prev) => prev.filter((item) => !pageEmails.includes(item)))
    }
  }

  function handleAddTab() {
    const rawName = newTabName.trim()
    if (rawName === "") {
      alert(t.tabNameRequired)
      return
    }

    const exists = tabs.some((item) => item.toLowerCase() === rawName.toLowerCase())
    if (exists) {
      alert(t.tabExists)
      return
    }

    const nextTab = normalizeTabName(rawName)
    const nextTabs = normalizeTabs([...tabs, nextTab])
    setTabs(nextTabs)
    setActiveTab(nextTab)
    setMoveTargetTab(nextTab)
    setNewTabName("")
  }

  function handleRenameActiveTab() {
    if (activeTab === DEFAULT_TAB) {
      alert(t.cannotRenameDefaultTab)
      return
    }

    const rawName = window.prompt(t.tabRenamePrompt(activeTab), activeTab)
    if (rawName === null) return

    const nextTab = rawName.trim()
    if (nextTab === "" || nextTab === activeTab) return

    const exists = tabs.some((item) => item.toLowerCase() === nextTab.toLowerCase() && item !== activeTab)
    if (exists) {
      alert(t.tabExists)
      return
    }

    const normalizedNextTab = normalizeTabName(nextTab)
    const updatedRows = mailList.map((item) => (normalizeTabName(item.tab || DEFAULT_TAB) === activeTab
      ? { ...item, tab: normalizedNextTab }
      : item))
    const updatedTabs = tabs.map((item) => (item === activeTab ? normalizedNextTab : item))
    saveMailList(updatedRows)
    setTabs(normalizeTabs(updatedTabs))
    setActiveTab(normalizedNextTab)
    if (moveTargetTab === activeTab) setMoveTargetTab(normalizedNextTab)
  }

  function handleDeleteActiveTab() {
    if (activeTab === DEFAULT_TAB) {
      alert(t.cannotDeleteDefaultTab)
      return
    }
    if (!window.confirm(t.confirmDeleteTab(activeTab, DEFAULT_TAB))) return

    const updatedRows = mailList.map((item) => (normalizeTabName(item.tab || DEFAULT_TAB) === activeTab
      ? { ...item, tab: DEFAULT_TAB }
      : item))
    const nextTabs = tabs.filter((item) => item !== activeTab)
    saveMailList(updatedRows)
    setTabs(normalizeTabs(nextTabs))
    setActiveTab(DEFAULT_TAB)
    setMoveTargetTab(DEFAULT_TAB)
    setSelectedEmails([])
  }

  function handleMoveSelected() {
    if (selectedEmails.length === 0) {
      alert(t.selectEmailsToMove)
      return
    }

    const targetTab = normalizeTabName(moveTargetTab)
    const next = mailList.map((item) => (selectedEmails.includes(item.email)
      ? { ...item, tab: targetTab }
      : item))
    saveMailList(next)
    setSelectedEmails([])
  }

  function handleSelectByTag() {
    setSelectByTags([])
  }

  function resolveContextRow(): Email | null {
    if (!tagContextMenu?.rowEmail) return null
    return mailList.find((item) => item.email === tagContextMenu.rowEmail) || null
  }

  function handleTagContextCopy() {
    if (!tagContextMenu) return
    if (tagContextMenu.source === "filter") {
      void copyText(selectByTags.join(", "))
      closeTagContextMenu()
      return
    }

    if (tagContextMenu.tag !== "") {
      void copyText(tagContextMenu.tag)
      closeTagContextMenu()
      return
    }

    const row = resolveContextRow()
    if (row) {
      void copyText(tagsToText(row.tags || []))
    }
    closeTagContextMenu()
  }

  function handleTagContextCopyEmail() {
    const row = resolveContextRow()
    if (!row) return
    void copyText(row.email)
    closeTagContextMenu()
  }

  function handleTagContextCopyRefreshToken() {
    const row = resolveContextRow()
    if (!row) return
    void copyText(row.refresh_token)
    closeTagContextMenu()
  }

  function handleTagContextCopyAllInfo() {
    const row = resolveContextRow()
    if (!row) return
    void copyText(buildAllEmailInfo(row))
    closeTagContextMenu()
  }

  function handleTagContextEdit() {
    const row = resolveContextRow()
    if (!row) return
    handleEdit(row)
    closeTagContextMenu()
  }

  function handleTagContextDeleteEmail() {
    const row = resolveContextRow()
    if (!row) return
    handleDelete(row)
    closeTagContextMenu()
  }

  function handleTagContextAdd() {
    if (!tagContextMenu) return
    if (tagContextMenu.source === "filter") {
      const raw = window.prompt(t.newTag, "")
      if (raw === null) {
        closeTagContextMenu()
        return
      }
      const next = parseTagsInput(raw)
      if (next.length === 0) {
        alert(t.tagRequired)
        return
      }
      setSelectByTags((prev) => normalizeTags([...prev, ...next]))
      closeTagContextMenu()
      return
    }

    const row = resolveContextRow()
    if (row) {
      openTagDialog(row, "add")
    }
    closeTagContextMenu()
  }

  function handleTagContextRemove() {
    if (!tagContextMenu) return
    if (tagContextMenu.source === "filter") {
      const targets = normalizeTags(selectByTags)
      if (targets.length === 0) {
        setSelectByTags([])
        closeTagContextMenu()
        return
      }
      const next = mailList.map((item) => ({
        ...item,
        tags: normalizeTags((item.tags || []).filter((tag) => !targets.includes(normalizeTag(tag)))),
      }))
      saveMailList(next)
      setSelectByTags([])
      closeTagContextMenu()
      return
    }

    const row = resolveContextRow()
    if (!row) {
      closeTagContextMenu()
      return
    }

    if (tagContextMenu.tag !== "") {
      const next = mailList.map((item) => {
        if (item.email !== row.email) return item
        return {
          ...item,
          tags: normalizeTags((item.tags || []).filter((tag) => normalizeTag(tag) !== tagContextMenu.tag)),
        }
      })
      saveMailList(next)
      closeTagContextMenu()
      return
    }

    openTagDialog(row, "remove")
    closeTagContextMenu()
  }

  function handleBatchDelete() {
    if (selectedEmails.length === 0) {
      alert(t.selectEmailsToDelete)
      return
    }
    if (!window.confirm(t.confirmDeleteSelected)) return
    const next = mailList.filter((item) => !selectedEmails.includes(item.email))
    saveMailList(next)
    clearMailCacheForEmails(selectedEmails)
    setSelectedEmails([])
  }

  function handleDeleteAll() {
    if (!window.confirm(t.confirmDeleteAll)) return
    saveMailList([])
    setTabs([DEFAULT_TAB])
    setActiveTab(DEFAULT_TAB)
    setMoveTargetTab(DEFAULT_TAB)
    setSelectByTags([])
    setSelectedEmails([])
    setMailCache({})
  }

  function exportRows(rows: Email[], fileNameValue: string) {
    const exportContent = exportMode === "email-only"
      ? rows.map((item) => item.email).join("\n")
      : rows
        .map((item) => `${item.email}${splitSymbol}${item.password}${splitSymbol}${item.client_id}${splitSymbol}${item.refresh_token}`)
        .join("\n")
    const blob = new Blob([exportContent], { type: "text/plain" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = fileNameValue
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function handleBatchExport() {
    if (selectedEmails.length === 0) {
      alert(t.selectEmailsToExport)
      return
    }
    if (!window.confirm(t.confirmExportSelected)) return
    exportRows(
      mailList.filter((item) => selectedEmails.includes(item.email)),
      exportMode === "email-only" ? "selected_mail_addresses.txt" : "selected_mails.txt",
    )
  }

  function handleExportAll() {
    if (mailList.length === 0) {
      alert(t.addEmailFirst)
      return
    }
    if (!window.confirm(t.confirmExportAll)) return
    exportRows(mailList, exportMode === "email-only" ? "all_mail_addresses.txt" : "all_mails.txt")
  }

  function handleEdit(row: Email) {
    setEditEmail(row.email)
    setEditForm({ ...row, remark: row.remark || "", tags: normalizeTags(row.tags || []) })
    setDialogEditVisible(true)
  }

  function handleSave() {
    if (!editEmail) return
    const next = mailList.map((item) => (item.email === editEmail
      ? { ...editForm, tab: item.tab }
      : item))
    saveMailList(next)
    setDialogEditVisible(false)
  }

  function handleDelete(row: Email) {
    if (!window.confirm(t.confirmDeleteEmail(row.email))) return
    const next = mailList.filter((item) => item.email !== row.email)
    saveMailList(next)
    clearMailCacheForEmails([row.email])
    setSelectedEmails((prev) => prev.filter((item) => item !== row.email))
  }

  function openTagDialog(row: Email, mode: "add" | "remove") {
    const existing = normalizeTags(row.tags || [])
    if (mode === "remove" && existing.length === 0) {
      alert(t.tagNotFound)
      return
    }
    setTagDialogMode(mode)
    setTagDialogRow(row)
    setTagDialogNew("")
    setTagDialogExisting(mode === "remove" ? [] : [])
    setDialogTagVisible(true)
  }

  function handleAddTag(row: Email) {
    openTagDialog(row, "add")
  }

  function handleRemoveTag(row: Email) {
    openTagDialog(row, "remove")
  }

  function closeTagDialog() {
    setDialogTagVisible(false)
    setTagDialogRow(null)
    setTagDialogExisting([])
    setTagDialogNew("")
  }

  function handleApplyTagDialog() {
    if (!tagDialogRow) return
    const selectedExisting = normalizeTags(tagDialogExisting)
    const inputTags = parseTagsInput(tagDialogNew)

    const next = mailList.map((item) => {
      if (item.email !== tagDialogRow.email) return item

      if (tagDialogMode === "add") {
        const candidate = normalizeTag(tagDialogNew || selectedExisting[0] || "")
        if (candidate === "") {
          return item
        }
        return {
          ...item,
          tags: normalizeTags([...(item.tags || []), candidate]),
        }
      }

      const current = normalizeTags(item.tags || [])
      const targets = normalizeTags([...selectedExisting, ...inputTags])
      if (targets.length === 0) {
        return item
      }
      const hasAny = targets.some((tag) => current.includes(tag))
      if (!hasAny) {
        return item
      }
      return {
        ...item,
        tags: normalizeTags(current.filter((tag) => !targets.includes(tag))),
      }
    })

    if (tagDialogMode === "add") {
      const candidate = normalizeTag(tagDialogNew || selectedExisting[0] || "")
      if (candidate === "") {
        alert(t.tagRequired)
        return
      }
    } else {
      const targets = normalizeTags([...selectedExisting, ...inputTags])
      if (targets.length === 0) {
        alert(t.tagRequired)
        return
      }
      const currentRow = mailList.find((item) => item.email === tagDialogRow.email)
      const currentTags = normalizeTags(currentRow?.tags || [])
      if (!targets.some((tag) => currentTags.includes(tag))) {
        alert(t.tagNotFound)
        return
      }
    }

    saveMailList(next)
    closeTagDialog()
  }

  function handleShowAccount(row: Email) {
    setAccountDetail(row)
    setDialogAccountVisible(true)
  }

  async function getPosts(row: Email, mailbox: string) {
    if (postLoading) return
    const requestID = Date.now()
    receiveRequestRef.current = requestID
    setPostLoading(true)
    let userError = ""
    try {
      const result = await MailAll(
        row.email,
        row.password,
        row.client_id,
        row.refresh_token,
        mailbox,
      )
      if (receiveRequestRef.current !== requestID) {
        return
      }

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
        setPostList(nextPosts)
        setMailCache((prev) => ({ ...prev, [cacheKey]: nextPosts }))
        return
      }

      if ((result?.statusCode || 200) >= 400) {
        throw new Error(data?.message || t.apiHTTPError(result.statusCode))
      }
      throw new Error(data?.message || t.fetchFailed)
    } catch (error) {
      if (receiveRequestRef.current !== requestID) {
        return
      }
      const err = error as Error
      userError = err.message || t.fetchFailed
    } finally {
      if (receiveRequestRef.current === requestID) {
        setPostLoading(false)
      }
    }
    if (userError) {
      alert(userError)
    }
  }

  function handleInbox(row: Email) {
    setBoxType("INBOX")
    setNowPost(row)
    setPostList(mailCache[`${row.email}INBOX`] || [])
    setDialogEmailVisible(true)
    void getPosts(row, "INBOX")
  }

  function handleTrash(row: Email) {
    setBoxType("Junk")
    setNowPost(row)
    setPostList(mailCache[`${row.email}Junk`] || [])
    setDialogEmailVisible(true)
    void getPosts(row, "Junk")
  }

  function handleReceive() {
    if (!nowPost) return
    void getPosts(nowPost, boxType)
  }

  function handleCancelReceive() {
    receiveRequestRef.current = Date.now()
    setPostLoading(false)
  }

  function handleClear() {
    if (!nowPost) return
    if (!window.confirm(t.clearMailboxConfirm(nowPost.email))) return
    setPostList([])
    const cacheKey = `${nowPost.email}${boxType}`
    setMailCache((prev) => ({ ...prev, [cacheKey]: [] }))
    void ProcessMailbox(
      nowPost.email,
      nowPost.password,
      nowPost.client_id,
      nowPost.refresh_token,
      boxType,
    )
      .then((result) => {
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
      })
      .catch((error) => {
        alert((error as Error).message || t.fetchFailed)
      })
  }

  const postTitle = nowPost ? (boxType === "INBOX" ? t.inboxTitle(nowPost.email) : t.junkTitle(nowPost.email)) : ""

  return (
    <div className="home-container">
      <div className="top-nav">
        <div className="top-nav-main">
          <span className="active">{t.mailboxManager}</span>
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`tab-chip ${tab === activeTab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            className="field tab-input"
            placeholder={t.tabPlaceholder}
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
          />
          <button className="btn blue" onClick={handleAddTab}>{t.addTab}</button>
          <button className="btn dark" onClick={handleRenameActiveTab}>{t.renameTab}</button>
          <button className="btn orange" onClick={handleDeleteActiveTab}>{t.deleteTab}</button>
        </div>
        <div className="lang-switch">
          <label htmlFor="lang-select">{t.language}</label>
          <select id="lang-select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="eng">{t.english}</option>
            <option value="cht">{t.chinese}</option>
          </select>
        </div>
      </div>

      <div className="toolbar main-toolbar">
        <label>{t.separator}</label>
        <input className="field" value={splitSymbol} onChange={(e) => setSplitSymbol(e.target.value)} />
        <label className="btn blue">
          {fileName || t.chooseFile}
          <input type="file" accept=".txt,.csv" hidden onChange={handleFileChange} />
        </label>
        <button className="btn green" onClick={handleAdd}>{t.importEmails}</button>
        <button className="btn green" onClick={() => setDialogCopyVisible(true)}>{t.pasteImport}</button>
        <label>{t.exportMode}</label>
        <select className="field mini" value={exportMode} onChange={(e) => setExportMode(e.target.value as ExportMode)}>
          <option value="full">{t.exportFull}</option>
          <option value="email-only">{t.exportEmailOnly}</option>
        </select>
        <button className="btn orange" onClick={handleBatchExport}>{t.batchExport}</button>
        <button className="btn orange" onClick={handleExportAll}>{t.exportAll}</button>
        <button className="btn orange" onClick={handleBatchDelete}>{t.batchDelete}</button>
        <button className="btn red" onClick={handleDeleteAll}>{t.deleteAll}</button>
        <input
          className="field search"
          placeholder={t.searchByName}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <select
          className="field multi-tags"
          value={selectByTags}
          onChange={handleSelectByTagsChange}
          onContextMenu={(e) => openTagContextMenu(e, "filter")}
          multiple
        >
          {tagOptions.map((tag) => (
            <option key={`tag-${tag}`} value={tag}>{tag}</option>
          ))}
        </select>
        <button className="btn dark" onClick={handleSelectByTag}>{t.selectTag}</button>
        <label>{t.selectMoveTarget}</label>
        <select className="field mini" value={moveTargetTab} onChange={(e) => setMoveTargetTab(e.target.value)}>
          {tabs.map((tab) => (
            <option key={`move-${tab}`} value={tab}>{tab}</option>
          ))}
        </select>
        <button className="btn dark" onClick={handleMoveSelected}>{t.moveSelected}</button>
      </div>

      <div className="table-wrap">
        <table className="mail-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={tableMailList.length > 0 && tableMailList.every((x) => selectedEmails.includes(x.email))}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                />
              </th>
              <th className="line-no-col">#</th>
              <th>{t.email}</th>
              <th>{t.remarks}</th>
              <th>{t.tags}</th>
              <th style={{ width: 360 }}>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {tableMailList.map((row, idx) => (
              <tr key={`${row.email}-${row.client_id}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(row.email)}
                    onChange={(e) => handleSelectionChange(row.email, e.target.checked)}
                  />
                </td>
                <td className="line-no-col">{(clampedPage - 1) * pageSize + idx + 1}</td>
                <td>
                  <button
                    className="link-btn"
                    onClick={() => handleShowAccount(row)}
                    onContextMenu={(e) => openTagContextMenu(e, "row", row)}
                  >
                    {row.email}
                  </button>
                </td>
                <td className="truncate">{row.remark || ""}</td>
                <td>
                  <div className="tag-list-cell" onContextMenu={(e) => openTagContextMenu(e, "row", row)}>
                    {row.tags.length === 0 && <span className="tag-empty">-</span>}
                    {row.tags.map((tag) => (
                      <span
                        key={`${row.email}-${tag}`}
                        className="tag-chip"
                        onContextMenu={(e) => openTagContextMenu(e, "row", row, tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button className="btn-sm blue" onClick={() => handleEdit(row)}>{t.edit}</button>
                  <button className="btn-sm dark" onClick={() => handleAddTag(row)}>{t.addTag}</button>
                  <button className="btn-sm orange" onClick={() => handleRemoveTag(row)}>{t.removeTag}</button>
                  <button className="btn-sm green" onClick={() => handleInbox(row)}>{t.inbox}</button>
                  <button className="btn-sm green" onClick={() => handleTrash(row)}>{t.junk}</button>
                  <button className="btn-sm red" onClick={() => handleDelete(row)}>{t.delete}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>{t.total}: {pageTotal}</span>
        <select value={pageSize} onChange={(e) => { setPageSize(normalizePageSize(Number(e.target.value))); setCurrentPage(1) }}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>{t.prev}</button>
        <span>{clampedPage} / {pageCount}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}>{t.next}</button>
      </div>

      {tagContextMenu && (
        <div className="context-menu-layer" onClick={closeTagContextMenu} onContextMenu={(e) => e.preventDefault()}>
          <div
            className="context-menu"
            style={{ left: `${tagContextMenu.x}px`, top: `${tagContextMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {tagContextMenu.source === "filter" && (
              <>
                <button onClick={handleTagContextCopy}>{t.copy}</button>
                <button onClick={handleTagContextRemove}>{t.removeTag}</button>
                <button onClick={handleTagContextAdd}>{t.addTag}</button>
              </>
            )}
            {tagContextMenu.source === "row" && (
              <>
                {tagContextMenu.tag !== "" && <button onClick={handleTagContextCopy}>{t.copy}</button>}
                <button onClick={handleTagContextCopyEmail}>{t.copyEmailAddress}</button>
                <button onClick={handleTagContextCopyRefreshToken}>{t.copyRefreshToken}</button>
                <button onClick={handleTagContextCopyAllInfo}>{t.copyAllEmailInfo}</button>
                <button onClick={handleTagContextEdit}>{t.editMailInfo}</button>
                <button onClick={handleTagContextDeleteEmail}>{t.removeEmail}</button>
                <button onClick={handleTagContextRemove}>{t.removeTag}</button>
                <button onClick={handleTagContextAdd}>{t.addTag}</button>
              </>
            )}
          </div>
        </div>
      )}

      {dialogCopyVisible && (
        <div className="modal">
          <div className="panel dialog">
            <div className="dialog-header">
              <span className="dialog-title">{t.pasteImportTitle}</span>
              <button className="dialog-close" onClick={() => setDialogCopyVisible(false)}>×</button>
            </div>
            <div className="dialog-body">
              <textarea rows={16} value={copyTextarea} onChange={(e) => setCopyTextarea(e.target.value)} />
            </div>
            <div className="panel-actions">
              <button onClick={() => setDialogCopyVisible(false)}>{t.cancel}</button>
              <button className="btn-sm blue" onClick={handlePasteAdd}>{t.import}</button>
            </div>
          </div>
        </div>
      )}

      {dialogTagVisible && tagDialogRow && (
        <div className="modal">
          <div className="panel dialog">
            <div className="dialog-header">
              <span className="dialog-title">
                {tagDialogMode === "add" ? t.tagAddFor(tagDialogRow.email) : t.tagRemoveFor(tagDialogRow.email)}
              </span>
              <button className="dialog-close" onClick={closeTagDialog}>×</button>
            </div>
            <div className="dialog-body">
              <label className="field-label">{t.existingTag}</label>
              <select
                className={tagDialogMode === "remove" ? "multi-tags" : ""}
                value={tagDialogExisting}
                onChange={handleTagDialogExistingChange}
                multiple={tagDialogMode === "remove"}
              >
                {dialogTagOptions.length === 0 && (
                  <option value="" disabled>{t.noAvailableTags}</option>
                )}
                {dialogTagOptions.map((tag) => (
                  <option key={`dlg-tag-${tag}`} value={tag}>{tag}</option>
                ))}
              </select>
              <label className="field-label">{t.newTag}</label>
              <input
                value={tagDialogNew}
                onChange={(e) => setTagDialogNew(e.target.value)}
                placeholder={t.tagsInputHint}
              />
            </div>
            <div className="panel-actions">
              <button onClick={closeTagDialog}>{t.cancel}</button>
              <button className="btn-sm blue" onClick={handleApplyTagDialog}>{t.applyTag}</button>
            </div>
          </div>
        </div>
      )}

      {dialogEditVisible && (
        <div className="modal">
          <div className="panel dialog">
            <div className="dialog-header">
              <span className="dialog-title">{t.editTitle}</span>
              <button className="dialog-close" onClick={() => setDialogEditVisible(false)}>×</button>
            </div>
            <div className="dialog-body">
              <label className="field-label">{t.email}</label>
              <input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
              <label className="field-label">{t.password}</label>
              <input value={editForm.password} onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))} />
              <label className="field-label">{t.clientId}</label>
              <input value={editForm.client_id} onChange={(e) => setEditForm((p) => ({ ...p, client_id: e.target.value }))} />
              <label className="field-label">{t.refreshToken}</label>
              <textarea rows={8} value={editForm.refresh_token} onChange={(e) => setEditForm((p) => ({ ...p, refresh_token: e.target.value }))} />
              <label className="field-label">{t.remark}</label>
              <input value={editForm.remark || ""} onChange={(e) => setEditForm((p) => ({ ...p, remark: e.target.value }))} />
              <label className="field-label">{t.tagsInputHint}</label>
              <input value={tagsToText(editForm.tags || [])} onChange={(e) => setEditForm((p) => ({ ...p, tags: parseTagsInput(e.target.value) }))} />
            </div>
            <div className="panel-actions">
              <button onClick={() => setDialogEditVisible(false)}>{t.cancel}</button>
              <button className="btn-sm blue" onClick={handleSave}>{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {dialogEmailVisible && (
        <div className="modal">
          <div className="panel dialog wide">
            <div className="dialog-header">
              <span className="dialog-title">{postTitle}</span>
              <button className="dialog-close" onClick={() => { handleCancelReceive(); setDialogEmailVisible(false) }}>×</button>
            </div>
            <div className="dialog-body">
              <div className="panel-actions left">
                <button className="btn-sm blue" onClick={handleReceive} disabled={postLoading}>
                  {postLoading ? t.receiving : t.fetchNewMail}
                </button>
                {postLoading && (
                  <button className="btn-sm orange" onClick={handleCancelReceive}>
                    {t.cancelReceive}
                  </button>
                )}
                <button className="btn-sm red" onClick={handleClear}>{t.clear}</button>
              </div>
              <div className="table-wrap modal-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t.sender}</th>
                      <th>{t.subject}</th>
                      <th>{t.text}</th>
                      <th>{t.date}</th>
                      <th style={{ width: 100 }}>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postList.map((post, idx) => (
                      <tr key={idx}>
                        <td>{post.send}</td>
                        <td>{post.subject}</td>
                        <td className="truncate">{post.text}</td>
                        <td>{post.date}</td>
                        <td>
                          <button
                            className="btn-sm blue"
                            onClick={() => {
                              setDialogEmailContent(post.html)
                              setDialogPostVisible(true)
                            }}
                          >
                            {t.view}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {dialogPostVisible && (
        <div className="modal">
          <div className="panel dialog wide">
            <div className="dialog-header">
              <span className="dialog-title">{t.mailContent}</span>
              <button className="dialog-close" onClick={() => setDialogPostVisible(false)}>×</button>
            </div>
            <div className="dialog-body">
              <div className="html-wrap" dangerouslySetInnerHTML={{ __html: dialogEmailContent }} />
            </div>
          </div>
        </div>
      )}

      {dialogAccountVisible && accountDetail && (
        <div className="modal">
          <div className="panel dialog">
            <div className="dialog-header">
              <span className="dialog-title">{t.accountDetail}</span>
              <button className="dialog-close" onClick={() => setDialogAccountVisible(false)}>×</button>
            </div>
            <div className="dialog-body">
              <label className="field-label">{t.email}</label>
              <input value={accountDetail.email} readOnly />
              <label className="field-label">{t.username}</label>
              <input value={accountDetail.password} readOnly />
              <label className="field-label">{t.clientId}</label>
              <input value={accountDetail.client_id} readOnly />
              <label className="field-label">{t.refreshToken}</label>
              <textarea rows={8} value={accountDetail.refresh_token} readOnly />
              <label className="field-label">{t.remark}</label>
              <input value={accountDetail.remark || ""} readOnly />
              <label className="field-label">{t.tags}</label>
              <input value={tagsToText(accountDetail.tags || [])} readOnly />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
