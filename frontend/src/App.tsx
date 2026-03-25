import { useState, useMemo, useEffect } from "react"
import { useMailManager } from "./hooks/useMailManager"
import { Navbar } from "./components/layout/Navbar"
import { Sidebar } from "./components/layout/Sidebar"
import { MailToolbar } from "./components/layout/MailToolbar"
import { MailTable } from "./components/layout/MailTable"
import { Modals } from "./components/layout/Modals"
import { Email, Post, ExportMode } from "./types"
import { 
  normalizeTabs, 
  DEFAULT_TAB, 
} from "./lib/mail-utils"
import { toast } from "sonner"
import bgArt from "./assets/BG.jpg"

const INBOX_MAILBOX = "INBOX"
const JUNK_MAILBOX = "Junk"
const FETCH_MAILBOXES = [INBOX_MAILBOX, JUNK_MAILBOX] as const
type MailboxType = typeof FETCH_MAILBOXES[number]

export default function App() {
  const {
    lang, setLang, t,
    splitSymbol, setSplitSymbol,
    tabs, setTabs,
    activeTab, setActiveTab,
    mailList, setMailList,
    mailCache,
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
  } = useMailManager()

  // UI States
  const [currentPage, setCurrentPage] = useState(1)
  const [moveTargetTab, setMoveTargetTab] = useState(DEFAULT_TAB)
  const [exportMode, setExportMode] = useState<ExportMode>("full")
  
  // Modal States
  const [pasteVisible, setPasteVisible] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  
  const [editVisible, setEditVisible] = useState(false)
  const [editEmail, setEditEmail] = useState("")
  const [editForm, setEditForm] = useState<Email>({
    email: "", password: "", client_id: "", refresh_token: "", tab: DEFAULT_TAB, remark: "", tags: []
  })

  const [tagVisible, setTagVisible] = useState(false)
  const [tagMode, setTagMode] = useState<"add" | "remove" | "rename">("add")
  const [tagRow, setTagRow] = useState<Email | null>(null)
  const [tagTarget, setTagTarget] = useState("")
  const [tagExisting, setTagExisting] = useState<string[]>([])
  const [tagNew, setTagNew] = useState("")

  const [emailListVisible, setEmailListVisible] = useState(false)
  const [postList, setPostList] = useState<Post[]>([])
  const [boxType, setBoxType] = useState<MailboxType>(INBOX_MAILBOX)
  const [nowPostEmail, setNowPostEmail] = useState<Email | null>(null)

  const [postContentVisible, setPostContentVisible] = useState(false)
  const [postContent, setPostContent] = useState("")

  const [accountDetailVisible, setAccountDetailVisible] = useState(false)
  const [accountDetail, setAccountDetail] = useState<Email | null>(null)

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)


  // Derived
  const pageCount = Math.max(1, Math.ceil(filteredMailList.length / pageSize))
  const tableMailList = useMemo(() => {
    const start = (Math.min(currentPage, pageCount) - 1) * pageSize
    return filteredMailList.slice(start, start + pageSize)
  }, [filteredMailList, currentPage, pageSize, pageCount])

  useEffect(() => {
    if (!tabs.includes(moveTargetTab)) {
      setMoveTargetTab(tabs[0] || DEFAULT_TAB)
    }
  }, [tabs])

  // Handlers
  const handleAddTab = (name: string) => {
    const exists = tabs.some(t => t.toLowerCase() === name.toLowerCase())
    if (exists) {
      toast.error(t.tabExists)
      return
    }
    const nextTabs = normalizeTabs([...tabs, name])
    setTabs(nextTabs)
    setActiveTab(name)
    setMoveTargetTab(name)
    toast.success(t.addTab + " " + name)
  }

  const handleRenameTab = (oldName: string) => {
    const newName = window.prompt(t.tabRenamePrompt(oldName), oldName)
    if (!newName || newName === oldName) return
    
    if (tabs.some(t => t.toLowerCase() === newName.toLowerCase() && t !== oldName)) {
      toast.error(t.tabExists)
      return
    }

    const nextTabs = tabs.map(t => t === oldName ? newName : t)
    const nextMails = mailList.map(m => m.tab === oldName ? { ...m, tab: newName } : m)
    setTabs(nextTabs)
    setMailList(nextMails)
    if (activeTab === oldName) setActiveTab(newName)
    toast.success(t.renameTab + ": " + newName)
  }

  const handleDeleteTab = (name: string) => {
    if (name === DEFAULT_TAB) {
      toast.error(t.cannotDeleteDefaultTab)
      return
    }
    if (!window.confirm(t.confirmDeleteTab(name, DEFAULT_TAB))) return

    const nextTabs = tabs.filter(t => t !== name)
    const nextMails = mailList.map(m => m.tab === name ? { ...m, tab: DEFAULT_TAB } : m)
    setTabs(nextTabs)
    setMailList(nextMails)
    if (activeTab === name) setActiveTab(DEFAULT_TAB)
    toast.success(t.deleteTab + " " + name)
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then(content => {
      const rows = content.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
        const parts = l.split(splitSymbol)
        return {
          email: parts[0] || "",
          password: parts[1] || "",
          client_id: parts[2] || "",
          refresh_token: parts.slice(3).join(splitSymbol) || "",
          tab: activeTab,
          remark: "",
          tags: []
        }
      })
      if (rows.length === 0) {
        toast.error(t.selectFileFirst)
        return
      }
      setMailList([...mailList, ...rows])
      toast.success(t.addSuccess(rows.length, activeTab))
    })
    e.target.value = ""
  }

  const handlePasteImport = () => {
    const rows = pasteContent.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
        const parts = l.split(splitSymbol)
        return {
          email: parts[0] || "",
          password: parts[1] || "",
          client_id: parts[2] || "",
          refresh_token: parts.slice(3).join(splitSymbol) || "",
          tab: activeTab,
          remark: "",
          tags: []
        }
    })
    if (rows.length === 0) {
      toast.error(t.tagRequired)
      return
    }
    setMailList([...mailList, ...rows])
    setPasteContent("")
    setPasteVisible(false)
    toast.success(t.addSuccess(rows.length, activeTab))
  }

  const handleBatchExport = () => {
    if (selectedEmails.length === 0) {
        toast.error(t.selectEmailsToExport)
        return
    }
    exportRows(mailList.filter(m => selectedEmails.includes(m.email)), "selected_mails.txt")
  }

  const handleExportAll = () => {
    if (mailList.length === 0) {
        toast.error(t.addEmailFirst)
        return
    }
    exportRows(mailList, "all_mails.txt")
  }

  const exportRows = (rows: Email[], filename: string) => {
    const content = exportMode === "email-only" 
        ? rows.map(r => r.email).join("\n")
        : rows.map(r => `${r.email}${splitSymbol}${r.password}${splitSymbol}${r.client_id}${splitSymbol}${r.refresh_token}`).join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t.batchExport + " " + rows.length)
  }

  const handleBatchDelete = () => {
    if (selectedEmails.length === 0) {
        toast.error(t.selectEmailsToDelete)
        return
    }
    if (!window.confirm(t.confirmDeleteSelected)) return
    setMailList(mailList.filter(m => !selectedEmails.includes(m.email)))
    clearMailCacheForEmails(selectedEmails)
    setSelectedEmails([])
    toast.success(t.batchDelete + ": " + selectedEmails.length)
  }

  const handleDeleteAll = () => {
    if (!window.confirm(t.confirmDeleteAll)) return
    setMailList([])
    setTabs([DEFAULT_TAB])
    setActiveTab(DEFAULT_TAB)
    setSelectedEmails([])
    toast.success(t.deleteAll)
  }

  const handleMoveSelected = () => {
    if (selectedEmails.length === 0) {
        toast.error(t.selectEmailsToMove)
        return
    }
    setMailList(mailList.map(m => selectedEmails.includes(m.email) ? { ...m, tab: moveTargetTab } : m))
    setSelectedEmails([])
    toast.success(t.moveSelected + " -> " + moveTargetTab)
  }

  const handleEdit = (email: Email) => {
    setEditEmail(email.email)
    setEditForm({ ...email })
    setEditVisible(true)
  }

  const handleSaveEdit = () => {
    setMailList(mailList.map(m => m.email === editEmail ? { ...editForm } : m))
    setEditVisible(false)
    toast.success(t.save + " " + editEmail)
  }

  const handleAddTagModal = (email: Email) => {
    setTagMode("add")
    setTagRow(email)
    setTagTarget("")
    setTagNew("")
    setTagExisting([])
    setTagVisible(true)
  }

  const handleRemoveTagModal = (email: Email, tag?: string) => {
    if (email.tags.length === 0) {
        toast.error(t.tagNotFound)
        return
    }
    setTagMode("remove")
    setTagRow(email)
    setTagTarget(tag || "")
    setTagNew("")
    setTagExisting(tag ? [tag] : [])
    setTagVisible(true)
  }

  const handleRenameTagModal = (email: Email, tag: string) => {
    setTagMode("rename")
    setTagRow(email)
    setTagTarget(tag)
    setTagExisting([tag])
    setTagNew(tag)
    setTagVisible(true)
  }

  const handleApplyTag = () => {
    if (!tagRow) return
    const tagsFromInput = tagNew.split(",").map(t => t.trim()).filter(Boolean)
    const tagsToProcess = [...tagExisting, ...tagsFromInput]

    if (tagMode === "rename") {
        const nextTag = tagNew.trim()
        if (!tagTarget || !nextTag) {
            toast.error(t.tagRequired)
            return
        }
        setMailList(mailList.map(m => {
            if (m.email !== tagRow.email) return m
            return {
              ...m,
              tags: Array.from(new Set(m.tags.map(tag => tag === tagTarget ? nextTag : tag))),
            }
        }))
    } else {
        if (tagsToProcess.length === 0) {
            toast.error(t.tagRequired)
            return
        }

        setMailList(mailList.map(m => {
            if (m.email !== tagRow.email) return m
            if (tagMode === "add") {
                return { ...m, tags: Array.from(new Set([...m.tags, ...tagsToProcess])) }
            }
            return { ...m, tags: m.tags.filter(t => !tagsToProcess.includes(t)) }
        }))
    }

    setTagVisible(false)
    setTagTarget("")
    setTagExisting([])
    setTagNew("")
    toast.success(t.applyTag)
  }

  const handleInbox = async (email: Email) => {
    setBoxType(INBOX_MAILBOX)
    setNowPostEmail(email)
    setPostList(mailCache[`${email.email}${INBOX_MAILBOX}`] || [])
    setEmailListVisible(true)
    try {
        const posts = await fetchMails(email, INBOX_MAILBOX)
        setPostList(posts)
    } catch (e) {
        toast.error((e as Error).message)
    }
  }

  const handleJunk = async (email: Email) => {
    setBoxType(JUNK_MAILBOX)
    setNowPostEmail(email)
    setPostList(mailCache[`${email.email}${JUNK_MAILBOX}`] || [])
    setEmailListVisible(true)
    try {
        const posts = await fetchMails(email, JUNK_MAILBOX)
        setPostList(posts)
    } catch (e) {
        toast.error((e as Error).message)
    }
  }

  const refreshMailboxPair = async (email: Email) => {
    const refreshedPosts: Partial<Record<MailboxType, Post[]>> = {}

    for (const mailbox of FETCH_MAILBOXES) {
      refreshedPosts[mailbox] = await fetchMails(email, mailbox)
    }

    return refreshedPosts
  }

  const handleReceive = async () => {
    if (!nowPostEmail) return
    try {
        const refreshedPosts = await refreshMailboxPair(nowPostEmail)
        const posts = refreshedPosts[boxType] || []
        setPostList(posts)
        toast.success(t.fetchNewMail + " (" + posts.length + ")")
    } catch (e) {
        toast.error((e as Error).message)
    }
  }

  const handleClearBox = async () => {
    if (!nowPostEmail) return
    if (!window.confirm(t.clearMailboxConfirm(nowPostEmail.email))) return
    try {
        await clearMailbox(nowPostEmail, boxType)
        setPostList([])
        toast.success(t.clear)
    } catch (e) {
        toast.error((e as Error).message)
    }
  }

  const handleCopyAll = (email: Email) => {
    const text = [
        `address: ${email.email}`,
        `clientID: ${email.client_id}`,
        `refreshToken: ${email.refresh_token}`,
        `tag: ${email.tags.join(", ")}`,
        `remark: ${email.remark || ""}`
    ].join("\n")
    navigator.clipboard.writeText(text)
    toast.success(t.copyAllEmailInfo)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden text-foreground antialiased">
      <div className="absolute inset-0">
        <img src={bgArt} alt="" className="h-full w-full object-cover object-center opacity-90 saturate-140" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,96,226,0.22),transparent_36%),radial-gradient(circle_at_78%_14%,rgba(137,61,255,0.28),transparent_30%),radial-gradient(circle_at_bottom,rgba(64,10,108,0.18),transparent_48%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(9,3,20,0.18),rgba(16,8,31,0.06),rgba(4,1,10,0.22))]" />
      </div>

      <div className="relative flex h-full flex-col p-3">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,9,35,0.22),rgba(9,4,18,0.32))] shadow-[0_30px_120px_rgba(73,0,128,0.45)] ring-1 ring-white/8">
          <Navbar t={t} lang={lang} onLangChange={setLang} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
          
          <div className="relative flex flex-1 overflow-hidden">
            <Sidebar 
              t={t}
              tabs={tabs}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onAddTab={handleAddTab}
              onRenameTab={handleRenameTab}
              onDeleteTab={handleDeleteTab}
              isSidebarOpen={isSidebarOpen}
            />
            
            <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
              <MailToolbar 
                t={t}
                splitSymbol={splitSymbol}
                setSplitSymbol={setSplitSymbol}
                onPasteImport={() => setPasteVisible(true)}
                onFileImport={handleFileImport}
                exportMode={exportMode}
                setExportMode={setExportMode}
                onBatchExport={handleBatchExport}
                onExportAll={handleExportAll}
                onBatchDelete={handleBatchDelete}
                onDeleteAll={handleDeleteAll}
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
                tagOptions={tagOptions}
                selectByTags={selectByTags}
                onSelectTagsChange={setSelectByTags}
                onClearTags={() => setSelectByTags([])}
                moveTargetTab={moveTargetTab}
                setMoveTargetTab={setMoveTargetTab}
                onMoveSelected={handleMoveSelected}
                tabs={tabs}
              />
              
              <div className="flex-1 overflow-hidden relative">
                <MailTable 
                  t={t}
                  emails={tableMailList}
                  selectedEmails={selectedEmails}
                  onToggleAll={(checked) => {
                    const emails = tableMailList.map(e => e.email)
                    if (checked) setSelectedEmails(Array.from(new Set([...selectedEmails, ...emails])))
                    else setSelectedEmails(selectedEmails.filter(e => !emails.includes(e)))
                  }}
                  onToggleEmail={(email, checked) => {
                    if (checked) setSelectedEmails([...selectedEmails, email])
                    else setSelectedEmails(selectedEmails.filter(e => e !== email))
                  }}
                  onEdit={handleEdit}
                  onAddTag={handleAddTagModal}
                  onRemoveTag={handleRemoveTagModal}
                  onRenameTag={handleRenameTagModal}
                  onInbox={handleInbox}
                  onJunk={handleJunk}
                  onDelete={(email) => {
                    if (window.confirm(t.confirmDeleteEmail(email.email))) {
                        setMailList(mailList.filter(m => m.email !== email.email))
                        toast.success(t.delete + " " + email.email)
                    }
                  }}
                  onShowDetail={(email) => {
                    setAccountDetail(email)
                    setAccountDetailVisible(true)
                  }}
                  onCopyEmail={(email) => {
                    navigator.clipboard.writeText(email)
                    toast.success(t.copyEmailAddress)
                  }}
                  onCopyRefreshToken={(token) => {
                    navigator.clipboard.writeText(token)
                    toast.success(t.copyRefreshToken)
                  }}
                  onCopyAll={handleCopyAll}
                  currentPage={currentPage}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  totalCount={filteredMailList.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
              </div>
            </main>
          </div>
        </div>
      </div>

      <Modals 
        t={t}
        pasteVisible={pasteVisible}
        setPasteVisible={setPasteVisible}
        splitSymbol={splitSymbol}
        pasteContent={pasteContent}
        setPasteContent={setPasteContent}
        onPasteImport={handlePasteImport}
        editVisible={editVisible}
        setEditVisible={setEditVisible}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveEdit}
        tagVisible={tagVisible}
        setTagVisible={setTagVisible}
        tagMode={tagMode}
        tagRow={tagRow}
        tagTarget={tagTarget}
        tagExisting={tagExisting}
        setTagExisting={setTagExisting}
        tagNew={tagNew}
        setTagNew={setTagNew}
        onApplyTag={handleApplyTag}
        tagOptions={tagMode === "add" ? tagOptions : (tagRow?.tags || [])}
        emailListVisible={emailListVisible}
        setEmailListVisible={setEmailListVisible}
        postList={postList}
        postLoading={postLoading}
        postTitle={nowPostEmail ? (boxType === INBOX_MAILBOX ? t.inboxTitle(nowPostEmail.email) : t.junkTitle(nowPostEmail.email)) : ""}
        onReceive={handleReceive}
        onCancelReceive={cancelReceive}
        onClear={handleClearBox}
        onViewPost={(html) => {
            setPostContent(html)
            setPostContentVisible(true)
        }}
        postContentVisible={postContentVisible}
        setPostContentVisible={setPostContentVisible}
        postContent={postContent}
        accountDetailVisible={accountDetailVisible}
        setAccountDetailVisible={setAccountDetailVisible}
        accountDetail={accountDetail}
      />
    </div>
  )
}
