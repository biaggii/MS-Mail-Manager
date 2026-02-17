import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import "./App.css"

type Email = {
  email: string
  password: string
  client_id: string
  refresh_token: string
}

type Post = {
  send: string
  subject: string
  text: string
  html: string
  date: string
}

type Lang = "en" | "zh"

type Translations = {
  home: string
  mailboxManager: string
  language: string
  english: string
  chinese: string
  separator: string
  chooseFile: string
  importEmails: string
  pasteImport: string
  batchExport: string
  exportAll: string
  batchDelete: string
  deleteAll: string
  selectFileFirst: string
  addSuccess: (count: number) => string
  selectEmailsToDelete: string
  confirmDeleteSelected: string
  confirmDeleteAll: string
  selectEmailsToExport: string
  confirmExportSelected: string
  addEmailFirst: string
  confirmExportAll: string
  confirmDeleteEmail: (email: string) => string
  fetchTimeout: string
  fetchFailed: string
  inboxTitle: (email: string) => string
  junkTitle: (email: string) => string
  clearMailboxConfirm: (email: string) => string
  email: string
  actions: string
  edit: string
  inbox: string
  junk: string
  delete: string
  total: string
  prev: string
  next: string
  pasteImportTitle: string
  cancel: string
  import: string
  editTitle: string
  save: string
  password: string
  clientId: string
  refreshToken: string
  receiving: string
  fetchNewMail: string
  cancelReceive: string
  clear: string
  sender: string
  subject: string
  text: string
  date: string
  view: string
  mailContent: string
  accountDetail: string
  username: string
}

const translations: Record<Lang, Translations> = {
  en: {
    home: "Home",
    mailboxManager: "Mailbox Manager",
    language: "Language",
    english: "English",
    chinese: "Chinese",
    separator: "Separator:",
    chooseFile: "Choose File",
    importEmails: "Import Emails",
    pasteImport: "Paste Import",
    batchExport: "Batch Export",
    exportAll: "Export All",
    batchDelete: "Batch Delete",
    deleteAll: "Delete All",
    selectFileFirst: "Please choose a file first",
    addSuccess: (count) => `Mailbox addresses added: ${count}`,
    selectEmailsToDelete: "Please select emails to delete",
    confirmDeleteSelected: "Delete selected mailboxes?",
    confirmDeleteAll: "Delete all mailboxes?",
    selectEmailsToExport: "Please select emails to export",
    confirmExportSelected: "Export selected mailboxes?",
    addEmailFirst: "Please add mailboxes first",
    confirmExportAll: "Export all mailboxes?",
    confirmDeleteEmail: (email) => `Delete mailbox ${email}?`,
    fetchTimeout: "Receive timeout",
    fetchFailed: "Receive failed",
    inboxTitle: (email) => `${email} Inbox`,
    junkTitle: (email) => `${email} Junk`,
    clearMailboxConfirm: (email) => `Clear all emails in ${email}?`,
    email: "Email",
    actions: "Actions",
    edit: "Edit",
    inbox: "Inbox",
    junk: "Junk",
    delete: "Delete",
    total: "total",
    prev: "prev",
    next: "next",
    pasteImportTitle: "Paste Import",
    cancel: "Cancel",
    import: "Import",
    editTitle: "Edit",
    save: "Save",
    password: "Password",
    clientId: "Client ID",
    refreshToken: "Refresh Token",
    receiving: "Receiving...",
    fetchNewMail: "Fetch New Mail",
    cancelReceive: "Cancel",
    clear: "Clear",
    sender: "Sender",
    subject: "Subject",
    text: "Text",
    date: "Date",
    view: "View",
    mailContent: "Mail Content",
    accountDetail: "Account Details",
    username: "Username",
  },
  zh: {
    home: "首页",
    mailboxManager: "邮箱管理",
    language: "语言",
    english: "英文",
    chinese: "中文",
    separator: "分隔符：",
    chooseFile: "选择文件",
    importEmails: "导入邮箱",
    pasteImport: "粘贴导入",
    batchExport: "批量导出",
    exportAll: "全部导出",
    batchDelete: "批量删除",
    deleteAll: "全部删除",
    selectFileFirst: "请先选择文件解析",
    addSuccess: (count) => `邮箱地址添加成功 共${count}条`,
    selectEmailsToDelete: "请选择要删除的邮箱",
    confirmDeleteSelected: "确认删除选中的邮箱吗？",
    confirmDeleteAll: "确认删除所有邮箱吗？",
    selectEmailsToExport: "请选择要导出的邮箱",
    confirmExportSelected: "确认导出选中的邮箱吗？",
    addEmailFirst: "请先添加邮箱",
    confirmExportAll: "确认导出所有邮箱吗？",
    confirmDeleteEmail: (email) => `确认删除邮箱 ${email} 吗？`,
    fetchTimeout: "收取超时",
    fetchFailed: "收取失败",
    inboxTitle: (email) => `${email}的收件箱`,
    junkTitle: (email) => `${email}的垃圾箱`,
    clearMailboxConfirm: (email) => `确认清空邮箱 ${email} 的所有邮件吗？`,
    email: "邮箱",
    actions: "操作",
    edit: "编辑",
    inbox: "收件箱",
    junk: "垃圾箱",
    delete: "删除",
    total: "total",
    prev: "prev",
    next: "next",
    pasteImportTitle: "粘贴导入",
    cancel: "取消",
    import: "导入",
    editTitle: "编辑",
    save: "保存",
    password: "密码",
    clientId: "客户端ID",
    refreshToken: "刷新令牌",
    receiving: "收取中...",
    fetchNewMail: "收取新邮件",
    cancelReceive: "取消收取",
    clear: "清空",
    sender: "发件人",
    subject: "主题",
    text: "文本",
    date: "日期",
    view: "查看",
    mailContent: "邮件内容",
    accountDetail: "账号详情",
    username: "用户名",
  },
}

const LANG_STORAGE_KEY = "uiLang"

function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function App() {
  const apiBaseURL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "")
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    return saved === "zh" ? "zh" : "en"
  })
  const t = translations[lang]
  const [splitSymbol, setSplitSymbol] = useState("----")
  const [fileName, setFileName] = useState("")
  const [emailList, setEmailList] = useState<string[]>([])
  const [mailList, setMailList] = useState<Email[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [dialogCopyVisible, setDialogCopyVisible] = useState(false)
  const [copyTextarea, setCopyTextarea] = useState("")
  const [dialogEditVisible, setDialogEditVisible] = useState(false)
  const [dialogEmailVisible, setDialogEmailVisible] = useState(false)
  const [dialogPostVisible, setDialogPostVisible] = useState(false)
  const [dialogEmailContent, setDialogEmailContent] = useState("")
  const [dialogAccountVisible, setDialogAccountVisible] = useState(false)
  const [accountDetail, setAccountDetail] = useState<Email | null>(null)
  const [boxType, setBoxType] = useState("INBOX")
  const [postLoading, setPostLoading] = useState(false)
  const [postList, setPostList] = useState<Post[]>([])
  const [nowPost, setNowPost] = useState<Email | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [editIndex, setEditIndex] = useState(-1)
  const [editForm, setEditForm] = useState<Email>({
    email: "",
    password: "",
    client_id: "",
    refresh_token: "",
  })

  useEffect(() => {
    setMailList(safeParseJSON<Email[]>(localStorage.getItem("localMailList"), []))
  }, [])

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  }, [lang])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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
  }, [dialogAccountVisible, dialogCopyVisible, dialogEditVisible, dialogEmailVisible, dialogPostVisible])

  const pageTotal = mailList.length
  const pageCount = Math.max(1, Math.ceil(pageTotal / pageSize))
  const clampedPage = Math.min(currentPage, pageCount)
  const tableMailList = useMemo(() => {
    const start = (clampedPage - 1) * pageSize
    return mailList.slice(start, start + pageSize)
  }, [mailList, clampedPage, pageSize])

  function saveMailList(next: Email[]) {
    setMailList(next)
    localStorage.setItem("localMailList", JSON.stringify(next))
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
    const next = mailList.concat(parsed)
    saveMailList(next)
    setEmailList([])
    setCopyTextarea("")
    setDialogCopyVisible(false)
    setFileName("")
    alert(t.addSuccess(parsed.length))
  }

  function handleAdd() {
    importParsedRows(parseImportedLines(emailList))
  }

  function handlePasteAdd() {
    importParsedRows(parseImportedLines(copyTextarea.split("\n")))
  }

  function handleSelectionChange(email: string, checked: boolean) {
    if (checked) setSelectedEmails((prev) => [...prev, email])
    else setSelectedEmails((prev) => prev.filter((item) => item !== email))
  }

  function handleToggleAll(checked: boolean) {
    if (checked) {
      setSelectedEmails(tableMailList.map((item) => item.email))
    } else {
      setSelectedEmails([])
    }
  }

  function handleBatchDelete() {
    if (selectedEmails.length === 0) {
      alert(t.selectEmailsToDelete)
      return
    }
    if (!window.confirm(t.confirmDeleteSelected)) return
    const next = mailList.filter((item) => !selectedEmails.includes(item.email))
    saveMailList(next)
    setSelectedEmails([])
  }

  function handleDeleteAll() {
    if (!window.confirm(t.confirmDeleteAll)) return
    saveMailList([])
    setSelectedEmails([])
  }

  function exportRows(rows: Email[], fileNameValue: string) {
    const exportContent = rows
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
    exportRows(mailList.filter((item) => selectedEmails.includes(item.email)), "selected_mails.txt")
  }

  function handleExportAll() {
    if (mailList.length === 0) {
      alert(t.addEmailFirst)
      return
    }
    if (!window.confirm(t.confirmExportAll)) return
    exportRows(mailList, "all_mails.txt")
  }

  function handleEdit(row: Email, index: number) {
    const absoluteIndex = (clampedPage - 1) * pageSize + index
    setEditIndex(absoluteIndex)
    setEditForm({ ...row })
    setDialogEditVisible(true)
  }

  function handleSave() {
    if (editIndex < 0) return
    const next = [...mailList]
    next[editIndex] = editForm
    saveMailList(next)
    setDialogEditVisible(false)
  }

  function handleDelete(row: Email) {
    if (!window.confirm(t.confirmDeleteEmail(row.email))) return
    const next = mailList.filter((item) => item.email !== row.email)
    saveMailList(next)
  }

  function handleShowAccount(row: Email) {
    setAccountDetail(row)
    setDialogAccountVisible(true)
  }

  async function getPosts(row: Email, mailbox: string) {
    if (postLoading) return
    setPostLoading(true)
    try {
      const controller = new AbortController()
      abortRef.current = controller
      const timeout = window.setTimeout(() => controller.abort(), 15000)

      const response = await fetch(`${apiBaseURL}/api/mail_all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          email: row.email,
          password: row.password,
          client_id: row.client_id,
          refresh_token: row.refresh_token,
          mailbox,
        }),
      })
      window.clearTimeout(timeout)

      const text = await response.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error(text || `HTTP ${response.status}`)
      }

      if (data && (data.code === 200 || data.code === "200")) {
        setPostList(data.data || [])
        localStorage.setItem(`${row.email}${mailbox}`, JSON.stringify(data.data || []))
        return
      }

      throw new Error(data?.message || t.fetchFailed)
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        alert(t.fetchTimeout)
      } else {
        alert((error as Error).message || t.fetchFailed)
      }
    } finally {
      abortRef.current = null
      setPostLoading(false)
    }
  }

  function handleInbox(row: Email) {
    setBoxType("INBOX")
    setNowPost(row)
    setPostList(safeParseJSON<Post[]>(localStorage.getItem(`${row.email}INBOX`), []))
    setDialogEmailVisible(true)
    void getPosts(row, "INBOX")
  }

  function handleTrash(row: Email) {
    setBoxType("Junk")
    setNowPost(row)
    setPostList(safeParseJSON<Post[]>(localStorage.getItem(`${row.email}Junk`), []))
    setDialogEmailVisible(true)
    void getPosts(row, "Junk")
  }

  function handleReceive() {
    if (!nowPost) return
    void getPosts(nowPost, boxType)
  }

  function handleCancelReceive() {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setPostLoading(false)
  }

  function handleClear() {
    if (!nowPost) return
    if (!window.confirm(t.clearMailboxConfirm(nowPost.email))) return
    setPostList([])
    localStorage.setItem(`${nowPost.email}${boxType}`, JSON.stringify([]))
    void fetch(`${apiBaseURL}/api/process-mailbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: nowPost.email,
        password: nowPost.password,
        client_id: nowPost.client_id,
        refresh_token: nowPost.refresh_token,
        mailbox: boxType,
      }),
    })
  }

  const postTitle = nowPost ? (boxType === "INBOX" ? t.inboxTitle(nowPost.email) : t.junkTitle(nowPost.email)) : ""

  return (
    <div className="home-container">
      <div className="top-nav">
        <span>{t.home}</span>
        <span className="active">{t.mailboxManager}</span>
        <div className="lang-switch">
          <label htmlFor="lang-select">{t.language}</label>
          <select id="lang-select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="en">{t.english}</option>
            <option value="zh">{t.chinese}</option>
          </select>
        </div>
      </div>

      <div className="toolbar">
        <label>{t.separator}</label>
        <input className="field" value={splitSymbol} onChange={(e) => setSplitSymbol(e.target.value)} />
        <label className="btn blue">
          +{fileName || t.chooseFile}
          <input type="file" accept=".txt,.csv" hidden onChange={handleFileChange} />
        </label>
        <button className="btn green" onClick={handleAdd}>{t.importEmails}</button>
        <button className="btn green" onClick={() => setDialogCopyVisible(true)}>{t.pasteImport}</button>
        <button className="btn orange" onClick={handleBatchExport}>{t.batchExport}</button>
        <button className="btn orange" onClick={handleExportAll}>{t.exportAll}</button>
        <button className="btn orange" onClick={handleBatchDelete}>{t.batchDelete}</button>
        <button className="btn red" onClick={handleDeleteAll}>{t.deleteAll}</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>
                <input
                  type="checkbox"
                  checked={tableMailList.length > 0 && tableMailList.every((x) => selectedEmails.includes(x.email))}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                />
              </th>
              <th>{t.email}</th>
              <th style={{ width: 260 }}>{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {tableMailList.map((row, index) => (
              <tr key={`${row.email}-${index}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(row.email)}
                    onChange={(e) => handleSelectionChange(row.email, e.target.checked)}
                  />
                </td>
                <td>
                  <button className="link-btn" onClick={() => handleShowAccount(row)}>
                    {row.email}
                  </button>
                </td>
                <td>
                  <button className="btn-sm blue" onClick={() => handleEdit(row, index)}>{t.edit}</button>
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
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
