export type Lang = "eng" | "cht"

export type Translations = {
  home: string
  mailboxManager: string
  language: string
  english: string
  chinese: string
  tabs: string
  tabPlaceholder: string
  addTab: string
  renameTab: string
  deleteTab: string
  selectMoveTarget: string
  selectByTag: string
  allTags: string
  selectTag: string
  moveSelected: string
  searchByName: string
  apiHTTPError: (status: number) => string
  separator: string
  chooseFile: string
  importEmails: string
  pasteImport: string
  batchExport: string
  exportAll: string
  batchDelete: string
  deleteAll: string
  exportMode: string
  exportFull: string
  exportEmailOnly: string
  selectFileFirst: string
  addSuccess: (count: number, tab: string) => string
  selectEmailsToDelete: string
  confirmDeleteSelected: string
  confirmDeleteAll: string
  selectEmailsToExport: string
  confirmExportSelected: string
  addEmailFirst: string
  confirmExportAll: string
  selectEmailsToMove: string
  tabNameRequired: string
  tabExists: string
  cannotDeleteDefaultTab: string
  cannotRenameDefaultTab: string
  tabRenamePrompt: (current: string) => string
  confirmDeleteTab: (tab: string, moveTo: string) => string
  confirmDeleteEmail: (email: string) => string
  fetchTimeout: string
  fetchFailed: string
  inboxTitle: (email: string) => string
  junkTitle: (email: string) => string
  clearMailboxConfirm: (email: string) => string
  email: string
  remarks: string
  tags: string
  remark: string
  actions: string
  edit: string
  addTag: string
  removeTag: string
  copy: string
  copyEmailAddress: string
  copyRefreshToken: string
  copyAllEmailInfo: string
  removeEmail: string
  editMailInfo: string
  existingTag: string
  newTag: string
  applyTag: string
  noAvailableTags: string
  tagAddFor: (email: string) => string
  tagRemoveFor: (email: string) => string
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
  tagsInputHint: string
  addTagPrompt: (email: string) => string
  removeTagPrompt: (email: string, tags: string) => string
  tagRequired: string
  tagNotFound: string
}

export const translations: Record<Lang, Translations> = {
  eng: {
    home: "Home",
    mailboxManager: "Mailbox Manager",
    language: "Language",
    english: "English",
    chinese: "Cantonese",
    tabs: "Tabs",
    tabPlaceholder: "New tab name",
    addTab: "Add Tab",
    renameTab: "Rename Tab",
    deleteTab: "Delete Tab",
    selectMoveTarget: "Move to tab",
    selectByTag: "Select by tag",
    allTags: "All tags",
    selectTag: "Clear Select",
    moveSelected: "Move Selected",
    searchByName: "Search by name/email",
    apiHTTPError: (status) => `API request failed (HTTP ${status})`,
    separator: "Sep",
    chooseFile: "File",
    importEmails: "Import",
    pasteImport: "Paste",
    batchExport: "Exp Sel",
    exportAll: "Export All",
    batchDelete: "Del Sel",
    deleteAll: "Delete All",
    exportMode: "Exp",
    exportFull: "Full rows",
    exportEmailOnly: "Email only",
    selectFileFirst: "Please choose a file first",
    addSuccess: (count, tab) => `Mailbox addresses added: ${count} (Tab: ${tab})`,
    selectEmailsToDelete: "Please select emails to delete",
    confirmDeleteSelected: "Delete selected mailboxes?",
    confirmDeleteAll: "Delete all mailboxes?",
    selectEmailsToExport: "Please select emails to export",
    confirmExportSelected: "Export selected mailboxes?",
    addEmailFirst: "Please add mailboxes first",
    confirmExportAll: "Export all mailboxes?",
    selectEmailsToMove: "Please select emails to move",
    tabNameRequired: "Tab name is required",
    tabExists: "Tab already exists",
    cannotDeleteDefaultTab: "Default tab cannot be deleted",
    cannotRenameDefaultTab: "Default tab cannot be renamed",
    tabRenamePrompt: (current) => `Rename tab "${current}" to:`,
    confirmDeleteTab: (tab, moveTo) => `Delete tab "${tab}"? Its mails will move to "${moveTo}".`,
    confirmDeleteEmail: (email) => `Delete mailbox ${email}?`,
    fetchTimeout: "Receive timeout",
    fetchFailed: "Receive failed",
    inboxTitle: (email) => `${email} Inbox`,
    junkTitle: (email) => `${email} Junk`,
    clearMailboxConfirm: (email) => `Clear all emails in ${email}?`,
    email: "Email",
    remarks: "Remarks",
    tags: "Tags",
    remark: "Remark",
    actions: "Actions",
    edit: "Edit",
    addTag: "Tag+",
    removeTag: "Tag-",
    copy: "Copy",
    copyEmailAddress: "Copy Email",
    copyRefreshToken: "Copy Refresh Token",
    copyAllEmailInfo: "Copy All Info",
    removeEmail: "Remove Email",
    editMailInfo: "Edit Mail Info",
    existingTag: "Existing tag",
    newTag: "New tag",
    applyTag: "Apply",
    noAvailableTags: "No tags available",
    tagAddFor: (email) => `Add tag for ${email}`,
    tagRemoveFor: (email) => `Remove tag for ${email}`,
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
    tagsInputHint: "Tags (comma separated)",
    addTagPrompt: (email) => `Add tag for ${email}:`,
    removeTagPrompt: (email, tags) => `Remove tag from ${email}. Existing tags: ${tags}`,
    tagRequired: "Tag is required",
    tagNotFound: "Tag not found on this email",
  },
  cht: {
    home: "首頁",
    mailboxManager: "郵箱管理",
    language: "語言",
    english: "英文",
    chinese: "廣東話",
    tabs: "分組",
    tabPlaceholder: "新分組名稱",
    addTab: "新增分組",
    renameTab: "重新命名分組",
    deleteTab: "刪除分組",
    selectMoveTarget: "移動到分組",
    selectByTag: "按標籤選擇",
    allTags: "全部標籤",
    selectTag: "清除選擇",
    moveSelected: "移動選中",
    searchByName: "按用戶名/郵箱搜尋",
    apiHTTPError: (status) => `介面請求失敗 (HTTP ${status})`,
    separator: "分隔",
    chooseFile: "檔案",
    importEmails: "匯入",
    pasteImport: "貼上",
    batchExport: "匯出選中",
    exportAll: "全部匯出",
    batchDelete: "刪除選中",
    deleteAll: "全部刪除",
    exportMode: "匯出",
    exportFull: "完整行",
    exportEmailOnly: "僅郵箱",
    selectFileFirst: "請先選擇檔案解析",
    addSuccess: (count, tab) => `郵箱地址新增成功 共${count}條 (分組: ${tab})`,
    selectEmailsToDelete: "請選擇要刪除的郵箱",
    confirmDeleteSelected: "確認刪除選中的郵箱嗎？",
    confirmDeleteAll: "確認刪除所有郵箱嗎？",
    selectEmailsToExport: "請選擇要匯出的郵箱",
    confirmExportSelected: "確認匯出選中的郵箱嗎？",
    addEmailFirst: "請先新增郵箱",
    confirmExportAll: "確認匯出所有郵箱嗎？",
    selectEmailsToMove: "請選擇要移動的郵箱",
    tabNameRequired: "分組名稱不能為空",
    tabExists: "分組已存在",
    cannotDeleteDefaultTab: "預設分組不可刪除",
    cannotRenameDefaultTab: "預設分組不可重新命名",
    tabRenamePrompt: (current) => `把分組 "${current}" 重新命名為：`,
    confirmDeleteTab: (tab, moveTo) => `確認刪除分組 "${tab}" 嗎？分組內郵箱會移動到 "${moveTo}"。`,
    confirmDeleteEmail: (email) => `確認刪除郵箱 ${email} 嗎？`,
    fetchTimeout: "收取逾時",
    fetchFailed: "收取失敗",
    inboxTitle: (email) => `${email} 的收件箱`,
    junkTitle: (email) => `${email} 的垃圾箱`,
    clearMailboxConfirm: (email) => `確認清空郵箱 ${email} 的所有郵件嗎？`,
    email: "郵箱",
    remarks: "備註",
    tags: "標籤",
    remark: "備註",
    actions: "操作",
    edit: "編輯",
    addTag: "加標籤",
    removeTag: "減標籤",
    copy: "複製",
    copyEmailAddress: "複製郵箱",
    copyRefreshToken: "複製刷新令牌",
    copyAllEmailInfo: "複製全部郵箱資訊",
    removeEmail: "刪除郵箱",
    editMailInfo: "編輯郵箱資訊",
    existingTag: "現有標籤",
    newTag: "新標籤",
    applyTag: "套用",
    noAvailableTags: "暫無可選標籤",
    tagAddFor: (email) => `為 ${email} 新增標籤`,
    tagRemoveFor: (email) => `為 ${email} 移除標籤`,
    inbox: "收件箱",
    junk: "垃圾箱",
    delete: "刪除",
    total: "total",
    prev: "prev",
    next: "next",
    pasteImportTitle: "貼上匯入",
    cancel: "取消",
    import: "匯入",
    editTitle: "編輯",
    save: "儲存",
    password: "密碼",
    clientId: "客戶端ID",
    refreshToken: "刷新令牌",
    receiving: "收取中...",
    fetchNewMail: "收取新郵件",
    cancelReceive: "取消收取",
    clear: "清空",
    sender: "寄件人",
    subject: "主題",
    text: "內容",
    date: "日期",
    view: "查看",
    mailContent: "郵件內容",
    accountDetail: "帳號詳情",
    username: "用戶名",
    tagsInputHint: "標籤（逗號分隔）",
    addTagPrompt: (email) => `為 ${email} 新增標籤：`,
    removeTagPrompt: (email, tags) => `從 ${email} 移除標籤，現有：${tags}`,
    tagRequired: "標籤不能為空",
    tagNotFound: "此郵箱沒有此標籤",
  },
}

