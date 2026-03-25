import bgArt from "./assets/BG.jpg"
import { Navbar } from "./components/layout/Navbar"
import { Sidebar } from "./components/layout/Sidebar"
import { MailToolbar } from "./components/layout/MailToolbar"
import { MailTable } from "./components/layout/MailTable"
import { Modals } from "./components/layout/Modals"
import { useMailboxController } from "./hooks/useMailboxController"
import { toast } from "sonner"

export default function App() {
  const {
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
    handleInbox,
    handleJunk,
    handleReceive,
    handleClearBox,
    handleCopyAll,
    handleDeleteRow,
    handleShowDetail,
    handleViewPost,
  } = useMailboxController()

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

              <div className="relative flex-1 overflow-hidden">
                <MailTable
                  t={t}
                  emails={tableMailList}
                  selectedEmails={selectedEmails}
                  onToggleAll={(checked) => {
                    const emails = tableMailList.map((email) => email.email)
                    if (checked) {
                      setSelectedEmails(Array.from(new Set([...selectedEmails, ...emails])))
                      return
                    }
                    setSelectedEmails(selectedEmails.filter((email) => !emails.includes(email)))
                  }}
                  onToggleEmail={(email, checked) => {
                    if (checked) {
                      setSelectedEmails([...selectedEmails, email])
                      return
                    }
                    setSelectedEmails(selectedEmails.filter((value) => value !== email))
                  }}
                  onEdit={handleEdit}
                  onAddTag={handleAddTagModal}
                  onRemoveTag={handleRemoveTagModal}
                  onRenameTag={handleRenameTagModal}
                  onInbox={handleInbox}
                  onJunk={handleJunk}
                  onDelete={handleDeleteRow}
                  onShowDetail={handleShowDetail}
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
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setCurrentPage(1)
                  }}
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
        postTitle={nowPostEmail ? (boxType === "INBOX" ? t.inboxTitle(nowPostEmail.email) : t.junkTitle(nowPostEmail.email)) : ""}
        onReceive={handleReceive}
        onCancelReceive={cancelReceive}
        onClear={handleClearBox}
        onViewPost={handleViewPost}
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
