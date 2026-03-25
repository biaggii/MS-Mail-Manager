import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import { useMailManager } from "./useMailManager"
import { Email, ExportMode, Post } from "../types"
import {
  DEFAULT_TAB,
  buildAccountClipboardText,
  buildExportText,
  createEmptyEmail,
  normalizeTabs,
  parseImportRows,
} from "../lib/mail-utils"

const INBOX_MAILBOX = "INBOX"
const JUNK_MAILBOX = "Junk"
const FETCH_MAILBOXES = [INBOX_MAILBOX, JUNK_MAILBOX] as const

type MailboxType = typeof FETCH_MAILBOXES[number]
type TagMode = "add" | "remove" | "rename"

export function useMailboxController() {
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

  const [currentPage, setCurrentPage] = useState(1)
  const [moveTargetTab, setMoveTargetTab] = useState(DEFAULT_TAB)
  const [exportMode, setExportMode] = useState<ExportMode>("full")
  const [pasteVisible, setPasteVisible] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  const [editVisible, setEditVisible] = useState(false)
  const [editEmail, setEditEmail] = useState("")
  const [editForm, setEditForm] = useState<Email>(createEmptyEmail())
  const [tagVisible, setTagVisible] = useState(false)
  const [tagMode, setTagMode] = useState<TagMode>("add")
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

  const pageCount = Math.max(1, Math.ceil(filteredMailList.length / pageSize))
  const tableMailList = useMemo(() => {
    const start = (Math.min(currentPage, pageCount) - 1) * pageSize
    return filteredMailList.slice(start, start + pageSize)
  }, [filteredMailList, currentPage, pageSize, pageCount])

  useEffect(() => {
    if (!tabs.includes(moveTargetTab)) {
      setMoveTargetTab(tabs[0] || DEFAULT_TAB)
    }
  }, [tabs, moveTargetTab])

  const handleAddTab = (name: string) => {
    const exists = tabs.some((tab) => tab.toLowerCase() === name.toLowerCase())
    if (exists) {
      toast.error(t.tabExists)
      return
    }

    const nextTabs = normalizeTabs([...tabs, name])
    setTabs(nextTabs)
    setActiveTab(name)
    setMoveTargetTab(name)
    toast.success(`${t.addTab} ${name}`)
  }

  const handleRenameTab = (oldName: string) => {
    const newName = window.prompt(t.tabRenamePrompt(oldName), oldName)
    if (!newName || newName === oldName) return

    if (tabs.some((tab) => tab.toLowerCase() === newName.toLowerCase() && tab !== oldName)) {
      toast.error(t.tabExists)
      return
    }

    const nextTabs = tabs.map((tab) => tab === oldName ? newName : tab)
    const nextMails = mailList.map((mail) => mail.tab === oldName ? { ...mail, tab: newName } : mail)
    setTabs(nextTabs)
    setMailList(nextMails)
    if (activeTab === oldName) setActiveTab(newName)
    toast.success(`${t.renameTab}: ${newName}`)
  }

  const handleDeleteTab = (name: string) => {
    if (name === DEFAULT_TAB) {
      toast.error(t.cannotDeleteDefaultTab)
      return
    }
    if (!window.confirm(t.confirmDeleteTab(name, DEFAULT_TAB))) return

    const nextTabs = tabs.filter((tab) => tab !== name)
    const nextMails = mailList.map((mail) => mail.tab === name ? { ...mail, tab: DEFAULT_TAB } : mail)
    setTabs(nextTabs)
    setMailList(nextMails)
    if (activeTab === name) setActiveTab(DEFAULT_TAB)
    toast.success(`${t.deleteTab} ${name}`)
  }

  const appendImportedRows = (content: string, onComplete?: () => void) => {
    const rows = parseImportRows(content, splitSymbol, activeTab)
    if (rows.length === 0) {
      toast.error(t.selectFileFirst)
      return
    }

    setMailList([...mailList, ...rows])
    onComplete?.()
    toast.success(t.addSuccess(rows.length, activeTab))
  }

  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    void file.text().then((content) => {
      appendImportedRows(content)
    })

    event.target.value = ""
  }

  const handlePasteImport = () => {
    appendImportedRows(pasteContent, () => {
      setPasteContent("")
      setPasteVisible(false)
    })
  }

  const exportRows = (rows: Email[], filename: string) => {
    const content = buildExportText(rows, splitSymbol, exportMode)
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(`${t.batchExport} ${rows.length}`)
  }

  const handleBatchExport = () => {
    if (selectedEmails.length === 0) {
      toast.error(t.selectEmailsToExport)
      return
    }

    exportRows(mailList.filter((mail) => selectedEmails.includes(mail.email)), "selected_mails.txt")
  }

  const handleExportAll = () => {
    if (mailList.length === 0) {
      toast.error(t.addEmailFirst)
      return
    }

    exportRows(mailList, "all_mails.txt")
  }

  const handleBatchDelete = () => {
    if (selectedEmails.length === 0) {
      toast.error(t.selectEmailsToDelete)
      return
    }
    if (!window.confirm(t.confirmDeleteSelected)) return

    setMailList(mailList.filter((mail) => !selectedEmails.includes(mail.email)))
    clearMailCacheForEmails(selectedEmails)
    setSelectedEmails([])
    toast.success(`${t.batchDelete}: ${selectedEmails.length}`)
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

    setMailList(mailList.map((mail) => selectedEmails.includes(mail.email) ? { ...mail, tab: moveTargetTab } : mail))
    setSelectedEmails([])
    toast.success(`${t.moveSelected} -> ${moveTargetTab}`)
  }

  const handleEdit = (email: Email) => {
    setEditEmail(email.email)
    setEditForm({ ...email })
    setEditVisible(true)
  }

  const handleSaveEdit = () => {
    setMailList(mailList.map((mail) => mail.email === editEmail ? { ...editForm } : mail))
    setEditVisible(false)
    toast.success(`${t.save} ${editEmail}`)
  }

  const openTagModal = (mode: TagMode, email: Email, options?: { tag?: string }) => {
    setTagMode(mode)
    setTagRow(email)
    setTagTarget(options?.tag || "")
    setTagExisting(options?.tag ? [options.tag] : [])
    setTagNew(mode === "rename" ? options?.tag || "" : "")
    setTagVisible(true)
  }

  const handleAddTagModal = (email: Email) => openTagModal("add", email)

  const handleRemoveTagModal = (email: Email, tag?: string) => {
    if (email.tags.length === 0) {
      toast.error(t.tagNotFound)
      return
    }
    openTagModal("remove", email, { tag })
  }

  const handleRenameTagModal = (email: Email, tag: string) => {
    openTagModal("rename", email, { tag })
  }

  const handleApplyTag = () => {
    if (!tagRow) return

    const tagsFromInput = tagNew.split(",").map((tag) => tag.trim()).filter(Boolean)
    const tagsToProcess = [...tagExisting, ...tagsFromInput]

    if (tagMode === "rename") {
      const nextTag = tagNew.trim()
      if (!tagTarget || !nextTag) {
        toast.error(t.tagRequired)
        return
      }

      setMailList(mailList.map((mail) => {
        if (mail.email !== tagRow.email) return mail
        return {
          ...mail,
          tags: Array.from(new Set(mail.tags.map((tag) => tag === tagTarget ? nextTag : tag))),
        }
      }))
    } else {
      if (tagsToProcess.length === 0) {
        toast.error(t.tagRequired)
        return
      }

      setMailList(mailList.map((mail) => {
        if (mail.email !== tagRow.email) return mail
        if (tagMode === "add") {
          return { ...mail, tags: Array.from(new Set([...mail.tags, ...tagsToProcess])) }
        }
        return { ...mail, tags: mail.tags.filter((tag) => !tagsToProcess.includes(tag)) }
      }))
    }

    setTagVisible(false)
    setTagTarget("")
    setTagExisting([])
    setTagNew("")
    toast.success(t.applyTag)
  }

  const openMailbox = async (email: Email, mailbox: MailboxType) => {
    setBoxType(mailbox)
    setNowPostEmail(email)
    setPostList(mailCache[`${email.email}${mailbox}`] || [])
    setEmailListVisible(true)

    try {
      const posts = await fetchMails(email, mailbox)
      setPostList(posts)
    } catch (error) {
      toast.error((error as Error).message)
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
      toast.success(`${t.fetchNewMail} (${posts.length})`)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const handleClearBox = async () => {
    if (!nowPostEmail) return
    if (!window.confirm(t.clearMailboxConfirm(nowPostEmail.email))) return

    try {
      await clearMailbox(nowPostEmail, boxType)
      setPostList([])
      toast.success(t.clear)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const handleCopyAll = (email: Email) => {
    navigator.clipboard.writeText(buildAccountClipboardText(email))
    toast.success(t.copyAllEmailInfo)
  }

  return {
    lang, setLang, t,
    splitSymbol, setSplitSymbol,
    tabs,
    activeTab, setActiveTab,
    pageSize, setPageSize,
    selectedEmails, setSelectedEmails,
    searchKeyword, setSearchKeyword,
    selectByTags, setSelectByTags,
    filteredMailList,
    tagOptions,
    postLoading,
    cancelReceive,
    currentPage, setCurrentPage,
    moveTargetTab, setMoveTargetTab,
    exportMode, setExportMode,
    pasteVisible, setPasteVisible,
    pasteContent, setPasteContent,
    editVisible, setEditVisible,
    editForm, setEditForm,
    tagVisible, setTagVisible,
    tagMode,
    tagRow,
    tagTarget,
    tagExisting, setTagExisting,
    tagNew, setTagNew,
    emailListVisible, setEmailListVisible,
    postList,
    boxType,
    nowPostEmail,
    postContentVisible, setPostContentVisible,
    postContent,
    accountDetailVisible, setAccountDetailVisible,
    accountDetail,
    isSidebarOpen, setIsSidebarOpen,
    pageCount,
    tableMailList,
    handleAddTab,
    handleRenameTab,
    handleDeleteTab,
    handleFileImport,
    handlePasteImport,
    handleBatchExport,
    handleExportAll,
    handleBatchDelete,
    handleDeleteAll,
    handleMoveSelected,
    handleEdit,
    handleSaveEdit,
    handleAddTagModal,
    handleRemoveTagModal,
    handleRenameTagModal,
    handleApplyTag,
    handleInbox: (email: Email) => openMailbox(email, INBOX_MAILBOX),
    handleJunk: (email: Email) => openMailbox(email, JUNK_MAILBOX),
    handleReceive,
    handleClearBox,
    handleCopyAll,
    handleDeleteRow: (email: Email) => {
      if (window.confirm(t.confirmDeleteEmail(email.email))) {
        setMailList(mailList.filter((mail) => mail.email !== email.email))
        toast.success(`${t.delete} ${email.email}`)
      }
    },
    handleShowDetail: (email: Email) => {
      setAccountDetail(email)
      setAccountDetailVisible(true)
    },
    handleViewPost: (html: string) => {
      setPostContent(html)
      setPostContentVisible(true)
    },
  }
}
