import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Email, Post } from "../../types"
import { Translations } from "../../i18n/translations"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Mail, RefreshCcw, X, Trash2, Eye, User, Key, FileText, Tag, Edit2, Copy } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ModalsProps {
  t: Translations
  
  // Paste Import
  pasteVisible: boolean
  setPasteVisible: (v: boolean) => void
  pasteContent: string
  setPasteContent: (v: string) => void
  onPasteImport: () => void

  // Edit/Add
  editVisible: boolean
  setEditVisible: (v: boolean) => void
  editForm: Email
  setEditForm: (v: Email) => void
  onSave: () => void

  // Tags
  tagVisible: boolean
  setTagVisible: (v: boolean) => void
  tagMode: "add" | "remove"
  tagRow: Email | null
  tagExisting: string[]
  setTagExisting: (v: string[]) => void
  tagNew: string
  setTagNew: (v: string) => void
  onApplyTag: () => void
  tagOptions: string[]

  // Email List (Inbox/Junk)
  emailListVisible: boolean
  setEmailListVisible: (v: boolean) => void
  postList: Post[]
  postLoading: boolean
  postTitle: string
  onReceive: () => void
  onCancelReceive: () => void
  onClear: () => void
  onViewPost: (html: string) => void

  // Post Content
  postContentVisible: boolean
  setPostContentVisible: (v: boolean) => void
  postContent: string

  // Account Detail
  accountDetailVisible: boolean
  setAccountDetailVisible: (v: boolean) => void
  accountDetail: Email | null
}

export function Modals({
  t,
  pasteVisible, setPasteVisible, pasteContent, setPasteContent, onPasteImport,
  editVisible, setEditVisible, editForm, setEditForm, onSave,
  tagVisible, setTagVisible, tagMode, tagRow, tagExisting, setTagExisting, tagNew, setTagNew, onApplyTag, tagOptions,
  emailListVisible, setEmailListVisible, postList, postLoading, postTitle, onReceive, onCancelReceive, onClear, onViewPost,
  postContentVisible, setPostContentVisible, postContent,
  accountDetailVisible, setAccountDetailVisible, accountDetail,
}: ModalsProps) {
  return (
    <>
      {/* Paste Import */}
      <Dialog open={pasteVisible} onOpenChange={setPasteVisible}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-xl border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <FileText className="h-5 w-5 text-primary" />
              {t.pasteImportTitle}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80 font-medium">{t.tabPlaceholder}</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 bg-background">
            <Textarea
              className="min-h-[400px] font-mono text-sm shadow-inner ring-1 ring-border/50 focus-visible:ring-primary/30"
              placeholder="email----password----clientID----refreshToken"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
            />
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t gap-3">
            <Button variant="outline" onClick={() => setPasteVisible(false)} className="px-6 font-semibold">{t.cancel}</Button>
            <Button onClick={onPasteImport} className="px-8 font-bold shadow-lg shadow-primary/20">{t.import}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Dialog */}
      <Dialog open={editVisible} onOpenChange={setEditVisible}>
        <DialogContent className="sm:max-w-[600px] p-0 rounded-xl overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-blue-500/5 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
               <Edit2 className="h-5 w-5 text-blue-500" />
               {t.editTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5 bg-background overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.email}</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.password}</Label>
              <Input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.clientId}</Label>
              <Input value={editForm.client_id} onChange={(e) => setEditForm({ ...editForm, client_id: e.target.value })} className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.refreshToken}</Label>
              <Textarea
                value={editForm.refresh_token}
                onChange={(e) => setEditForm({ ...editForm, refresh_token: e.target.value })}
                className="min-h-[120px] font-mono text-xs shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.remark}</Label>
              <Input value={editForm.remark} onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })} className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.tagsInputHint}</Label>
              <Input
                value={editForm.tags.join(", ")}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                className="shadow-sm"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t gap-3">
            <Button variant="outline" onClick={() => setEditVisible(false)} className="px-6 font-semibold">{t.cancel}</Button>
            <Button onClick={onSave} className="px-8 font-bold bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagVisible} onOpenChange={setTagVisible}>
        <DialogContent className="sm:max-w-[450px] p-0 rounded-xl overflow-hidden border-none shadow-2xl">
          <DialogHeader className={cn("p-6 border-b", tagMode === "add" ? "bg-green-500/5" : "bg-red-500/5")}>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
               <Tag className={cn("h-5 w-5", tagMode === "add" ? "text-green-500" : "text-red-500")} />
               {tagMode === "add" ? t.tagAddFor(tagRow?.email || "") : t.tagRemoveFor(tagRow?.email || "")}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6 bg-background">
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.existingTag}</Label>
              <Select
                value={tagExisting[0] || ""}
                onValueChange={(v) => setTagExisting([v])}
              >
                <SelectTrigger className="w-full h-11 shadow-sm">
                  <SelectValue placeholder={t.noAvailableTags} />
                </SelectTrigger>
                <SelectContent>
                  {tagOptions.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.newTag}</Label>
              <Input
                placeholder={t.tagsInputHint}
                value={tagNew}
                onChange={(e) => setTagNew(e.target.value)}
                className="h-11 shadow-sm focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t gap-3">
            <Button variant="outline" onClick={() => setTagVisible(false)} className="px-6 font-semibold">{t.cancel}</Button>
            <Button onClick={onApplyTag} className={cn("px-8 font-bold shadow-lg transition-all", tagMode === "add" ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20")}>
              {t.applyTag}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email List (Inbox/Junk) */}
      <Dialog open={emailListVisible} onOpenChange={(v) => { if(!v) onCancelReceive(); setEmailListVisible(v); }}>
        <DialogContent className="sm:max-w-[1100px] p-0 rounded-xl overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <div className="flex items-center justify-between pr-8">
               <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
                 <Mail className="h-6 w-6 text-primary" />
                 {postTitle}
               </DialogTitle>
               <div className="flex items-center gap-2">
                 {postLoading ? (
                    <Button variant="outline" onClick={onCancelReceive} className="h-9 gap-2 border-orange-500/30 text-orange-600 hover:bg-orange-50 animate-pulse">
                      <X className="h-4 w-4" /> {t.cancelReceive}
                    </Button>
                 ) : (
                    <Button onClick={onReceive} className="h-9 gap-2 shadow-md shadow-primary/20">
                      <RefreshCcw className="h-4 w-4" /> {t.fetchNewMail}
                    </Button>
                 )}
                 <Button variant="outline" onClick={onClear} className="h-9 gap-2 border-red-500/30 text-red-600 hover:bg-red-50 hover:border-red-500/50">
                    <Trash2 className="h-4 w-4" /> {t.clear}
                 </Button>
               </div>
            </div>
          </DialogHeader>
          <div className="p-0 bg-background max-h-[75vh] flex flex-col">
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px] font-bold text-muted-foreground">{t.sender}</TableHead>
                    <TableHead className="font-bold text-muted-foreground">{t.subject}</TableHead>
                    <TableHead className="w-[180px] font-bold text-muted-foreground">{t.date}</TableHead>
                    <TableHead className="w-[100px] text-right pr-6 font-bold text-muted-foreground">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                           <Mail className="h-16 w-16" />
                           <p className="text-lg font-medium">{postLoading ? t.receiving : t.addEmailFirst}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    postList.map((post, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/20 group transition-colors">
                        <TableCell className="font-medium text-primary/80 truncate max-w-[180px]">{post.send}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-sm leading-snug group-hover:text-primary transition-colors">{post.subject}</span>
                            <span className="text-xs text-muted-foreground/70 truncate max-w-[500px]">{post.text}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{post.date}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="outline" size="sm" onClick={() => onViewPost(post.html)} className="h-8 gap-1.5 shadow-sm hover:border-primary/50 hover:text-primary transition-all">
                            <Eye className="h-3.5 w-3.5" /> {t.view}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Content Dialog */}
      <Dialog open={postContentVisible} onOpenChange={setPostContentVisible}>
        <DialogContent className="sm:max-w-[950px] p-0 rounded-xl overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <Mail className="h-5 w-5 text-primary" />
              {t.mailContent}
            </DialogTitle>
          </DialogHeader>
          <div className="p-0 bg-background h-[80vh]">
            <ScrollArea className="h-full">
              <div 
                className="p-8 prose prose-sm max-w-none prose-slate" 
                dangerouslySetInnerHTML={{ __html: postContent }} 
              />
            </ScrollArea>
          </div>
          <DialogFooter className="p-4 bg-muted/20 border-t">
            <Button onClick={() => setPostContentVisible(false)} className="px-8 font-bold">{t.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Detail Dialog */}
      <Dialog open={accountDetailVisible} onOpenChange={setAccountDetailVisible}>
        <DialogContent className="sm:max-w-[550px] p-0 rounded-xl overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary/5 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <User className="h-6 w-6 text-primary" />
              {t.accountDetail}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5 bg-background overflow-y-auto max-h-[70vh] custom-scrollbar">
            {accountDetail && (
              <>
                <div className="grid gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                       <Mail className="h-3 w-3" /> {t.email}
                    </Label>
                    <div className="flex gap-2">
                      <Input value={accountDetail.email} readOnly className="bg-muted/30 font-medium" />
                      <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(accountDetail.email)} className="shrink-0 h-10 w-10">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                       <User className="h-3 w-3" /> {t.username}
                    </Label>
                    <div className="flex gap-2">
                      <Input value={accountDetail.password} readOnly className="bg-muted/30 font-medium" />
                      <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(accountDetail.password)} className="shrink-0 h-10 w-10">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                       <Key className="h-3 w-3" /> {t.clientId}
                    </Label>
                    <div className="flex gap-2">
                      <Input value={accountDetail.client_id} readOnly className="bg-muted/30 font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(accountDetail.client_id)} className="shrink-0 h-10 w-10">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                       <Key className="h-3 w-3" /> {t.refreshToken}
                    </Label>
                    <div className="relative group">
                      <Textarea value={accountDetail.refresh_token} readOnly className="bg-muted/30 font-mono text-xs min-h-[100px] pr-12" />
                      <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(accountDetail.refresh_token)} className="absolute right-2 top-2 h-8 w-8 shadow-sm">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                       <FileText className="h-3 w-3" /> {t.remark}
                    </Label>
                    <Input value={accountDetail.remark || "-"} readOnly className="bg-muted/30 italic" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                       <Tag className="h-3 w-3" /> {t.tags}
                    </Label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-md ring-1 ring-border/50 min-h-[44px]">
                      {accountDetail.tags.length === 0 ? (
                        <span className="text-muted-foreground/50 text-xs italic">{t.noAvailableTags}</span>
                      ) : (
                        accountDetail.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="bg-background px-3 py-1 font-semibold border-primary/20 text-primary">{tag}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t">
             <Button onClick={() => setAccountDetailVisible(false)} className="w-full font-bold h-11 tracking-wide">{t.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
