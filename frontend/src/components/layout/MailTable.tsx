import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Tag as TagIcon, 
  Inbox, 
  Trash, 
  Copy, 
  Mail, 
  Key, 
  User, 
  ChevronLeft,
  ChevronRight,
  Clipboard
} from "lucide-react"
import { Email } from "../../types"
import { Translations } from "../../i18n/translations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MailTableProps {
  t: Translations
  emails: Email[]
  selectedEmails: string[]
  onToggleAll: (checked: boolean) => void
  onToggleEmail: (email: string, checked: boolean) => void
  onEdit: (email: Email) => void
  onAddTag: (email: Email) => void
  onRemoveTag: (email: Email) => void
  onInbox: (email: Email) => void
  onJunk: (email: Email) => void
  onDelete: (email: Email) => void
  onShowDetail: (email: Email) => void
  onCopyEmail: (email: string) => void
  onCopyRefreshToken: (token: string) => void
  onCopyAll: (email: Email) => void
  currentPage: number
  pageCount: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function MailTable({
  t,
  emails,
  selectedEmails,
  onToggleAll,
  onToggleEmail,
  onEdit,
  onAddTag,
  onRemoveTag,
  onInbox,
  onJunk,
  onDelete,
  onShowDetail,
  onCopyEmail,
  onCopyRefreshToken,
  onCopyAll,
  currentPage,
  pageCount,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: MailTableProps) {
  const isAllSelected = emails.length > 0 && emails.every((e) => selectedEmails.includes(e.email))

  return (
    <div className="flex flex-col h-full bg-card rounded-md shadow-sm border m-4 overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => onToggleAll(!!checked)}
                />
              </TableHead>
              <TableHead className="w-[60px] text-center font-bold">#</TableHead>
              <TableHead className="min-w-[200px]">{t.email}</TableHead>
              <TableHead>{t.remarks}</TableHead>
              <TableHead>{t.tags}</TableHead>
              <TableHead className="text-right pr-6">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Mail className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">{t.addEmailFirst}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              emails.map((email, idx) => (
                <ContextMenu key={email.email}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="group hover:bg-muted/30 transition-colors cursor-context-menu">
                      <TableCell>
                        <Checkbox
                          checked={selectedEmails.includes(email.email)}
                          onCheckedChange={(checked) => onToggleEmail(email.email, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Button
                            variant="link"
                            className="p-0 h-auto justify-start font-semibold text-primary hover:text-primary/80 transition-colors"
                            onClick={() => onShowDetail(email)}
                          >
                            {email.email}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground max-w-[200px] truncate block italic">
                          {email.remark || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {email.tags.length === 0 ? (
                            <span className="text-muted-foreground/30 text-xs">-</span>
                          ) : (
                            email.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="px-2 py-0 text-[10px] font-medium bg-secondary/50 text-secondary-foreground ring-1 ring-border/50">
                                {tag}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <div className="hidden group-hover:flex items-center gap-1 mr-2 animate-in fade-in slide-in-from-right-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => onInbox(email)}
                            >
                              <Inbox className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-500 hover:bg-orange-500/10"
                              onClick={() => onJunk(email)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1.5">
                              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">{t.actions}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onInbox(email)} className="gap-2.5 py-2">
                                <Inbox className="h-4 w-4 text-primary" /> {t.inbox}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onJunk(email)} className="gap-2.5 py-2">
                                <Trash className="h-4 w-4 text-orange-500" /> {t.junk}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1.5" />
                              <DropdownMenuItem onClick={() => onEdit(email)} className="gap-2.5 py-2">
                                <Edit2 className="h-4 w-4 text-blue-500" /> {t.edit}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onAddTag(email)} className="gap-2.5 py-2">
                                <TagIcon className="h-4 w-4 text-green-500" /> {t.addTag}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onRemoveTag(email)} className="gap-2.5 py-2">
                                <TagIcon className="h-4 w-4 text-red-500" /> {t.removeTag}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1.5" />
                              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">{t.copy}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onCopyEmail(email.email)} className="gap-2.5 py-2">
                                <User className="h-4 w-4 text-muted-foreground" /> {t.copyEmailAddress}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onCopyRefreshToken(email.refresh_token)} className="gap-2.5 py-2">
                                <Key className="h-4 w-4 text-muted-foreground" /> {t.copyRefreshToken}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onCopyAll(email)} className="gap-2.5 py-2">
                                <Clipboard className="h-4 w-4 text-muted-foreground" /> {t.copyAllEmailInfo}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1.5" />
                              <DropdownMenuItem onClick={() => onDelete(email)} className="gap-2.5 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="h-4 w-4" /> {t.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-64">
                    <ContextMenuItem onClick={() => onCopyEmail(email.email)} className="gap-2">
                        <User className="h-4 w-4 text-muted-foreground" /> {t.copyEmailAddress}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onAddTag(email)} className="gap-2">
                        <TagIcon className="h-4 w-4 text-green-500" /> {t.addTag}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onRemoveTag(email)} className="gap-2">
                        <TagIcon className="h-4 w-4 text-red-500" /> {t.removeTag}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onDelete(email)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> {t.removeEmail}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-4 border-t bg-muted/20">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {t.total}: <span className="text-foreground font-bold">{totalCount}</span>
          </p>
          <div className="flex items-center gap-2 bg-background p-1 rounded-md border shadow-sm">
            <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(parseInt(v))}>
              <SelectTrigger className="h-8 w-[80px] border-none shadow-none focus:ring-0 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shadow-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center min-w-[100px] h-9 bg-background border rounded-md px-3 shadow-sm">
             <span className="text-sm font-bold text-primary mr-1">{currentPage}</span>
             <span className="text-sm text-muted-foreground">/ {pageCount}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shadow-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
