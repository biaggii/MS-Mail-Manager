import { useState, useMemo, useEffect } from "react"
import { useMailManager } from "./hooks/useMailManager"
import { Navbar } from "./components/layout/Navbar"
import { Sidebar } from "./components/layout/Sidebar"
import { MailToolbar } from "./components/layout/MailToolbar"
import { MailTable } from "./components/layout/MailTable"
import { Modals } from "./components/layout/Modals"
import { Email, Post, ExportMode } from "./types"
import { 
  normalizeEmailList, 
  normalizeTabs, 
  normalizeTabName, 
  DEFAULT_TAB, 
  tagsToText, 
  parseTagsInput 
} from "./lib/mail-utils"
import { toast } from "sonner"

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
  const [tagMode, setTagMode] = useState<"add" | "remove">("add")
  const [tagRow, setTagRow] = useState<Email | null>(null)
  const [tagExisting, setTagExisting] = useState<string[]>([])
  const [tagNew, setTagNew] = useState("")

  const [emailListVisible, setEmailListVisible] = useState(false)
  const [postList, setPostList] = useState<Post[]>([])
  const [boxType, setBoxType] = useState("INBOX")
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
    setTagNew("")
    setTagExisting([])
    setTagVisible(true)
  }

  const handleRemoveTagModal = (email: Email) => {
    if (email.tags.length === 0) {
        toast.error(t.tagNotFound)
        return
    }
    setTagMode("remove")
    setTagRow(email)
    setTagNew("")
    setTagExisting([])
    setTagVisible(true)
  }

  const handleApplyTag = () => {
    if (!tagRow) return
    const tagsToAdd = tagNew.split(",").map(t => t.trim()).filter(Boolean)
    const tagsToProcess = [...tagExisting, ...tagsToAdd]
    
    if (tagsToProcess.length === 0) {
        toast.error(t.tagRequired)
        return
    }

    setMailList(mailList.map(m => {
        if (m.email !== tagRow.email) return m
        if (tagMode === "add") {
            return { ...m, tags: Array.from(new Set([...m.tags, ...tagsToProcess])) }
        } else {
            return { ...m, tags: m.tags.filter(t => !tagsToProcess.includes(t)) }
        }
    }))
    setTagVisible(false)
    toast.success(t.applyTag)
  }

  const handleInbox = async (email: Email) => {
    setBoxType("INBOX")
    setNowPostEmail(email)
    setPostList(mailCache[`${email.email}INBOX`] || [])
    setEmailListVisible(true)
    try {
        const posts = await fetchMails(email, "INBOX")
        setPostList(posts)
    } catch (e) {
        toast.error((e as Error).message)
    }
  }

  const handleJunk = async (email: Email) => {
    setBoxType("Junk")
    setNowPostEmail(email)
    setPostList(mailCache[`${email.email}Junk`] || [])
    setEmailListVisible(true)
    try {
        const posts = await fetchMails(email, "Junk")
        setPostList(posts)
    } catch (e) {
        toast.error((e as Error).message)
    }
  }

  const handleReceive = async () => {
    if (!nowPostEmail) return
    try {
        const posts = await fetchMails(nowPostEmail, boxType)
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
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden font-sans antialiased">
      <Navbar t={t} lang={lang} onLangChange={setLang} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden">
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
        
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/5">
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

      <Modals 
        t={t}
        pasteVisible={pasteVisible}
        setPasteVisible={setPasteVisible}
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
        postTitle={nowPostEmail ? (boxType === "INBOX" ? t.inboxTitle(nowPostEmail.email) : t.junkTitle(nowPostEmail.email)) : ""}
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
