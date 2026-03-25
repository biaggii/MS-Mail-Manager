import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileUp,
  Trash2,
  Search,
  Filter,
  MoveHorizontal,
  Download,
  FileText,
  Upload,
  Clipboard
} from "lucide-react"
import { Translations } from "../../i18n/translations"
import { ExportMode } from "../../types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface MailToolbarProps {
  t: Translations
  splitSymbol: string
  setSplitSymbol: (v: string) => void
  onPasteImport: () => void
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  exportMode: ExportMode
  setExportMode: (v: ExportMode) => void
  onBatchExport: () => void
  onExportAll: () => void
  onBatchDelete: () => void
  onDeleteAll: () => void
  searchKeyword: string
  setSearchKeyword: (v: string) => void
  tagOptions: string[]
  selectByTags: string[]
  onSelectTagsChange: (tags: string[]) => void
  onClearTags: () => void
  moveTargetTab: string
  setMoveTargetTab: (v: string) => void
  onMoveSelected: () => void
  tabs: string[]
}

export function MailToolbar({
  t,
  splitSymbol,
  setSplitSymbol,
  onPasteImport,
  onFileImport,
  exportMode,
  setExportMode,
  onBatchExport,
  onExportAll,
  onBatchDelete,
  onDeleteAll,
  searchKeyword,
  setSearchKeyword,
  tagOptions,
  selectByTags,
  onSelectTagsChange,
  onClearTags,
  moveTargetTab,
  setMoveTargetTab,
  onMoveSelected,
  tabs,
}: MailToolbarProps) {
  const selectedTagLabel =
    selectByTags.length === 0
      ? t.allTags
      : selectByTags.length === 1
        ? selectByTags[0]
        : `${selectByTags.length} tags`

  const toggleTagSelection = (tag: string, checked: boolean) => {
    if (checked) {
      onSelectTagsChange(Array.from(new Set([...selectByTags, tag])))
      return
    }
    onSelectTagsChange(selectByTags.filter((item) => item !== tag))
  }

  return (
    <div className="neon-divider flex flex-col gap-4 border-b bg-[linear-gradient(180deg,rgba(19,9,34,0.14),rgba(13,7,24,0.04))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/4 p-1.5 ring-1 ring-white/8">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">{t.separator}</span>
            <Input
              className="h-8 w-16 border-white/8 bg-black/12 text-center text-xs font-mono"
              value={splitSymbol}
              onChange={(e) => setSplitSymbol(e.target.value)}
            />
          </div>
          <div className="h-8 w-px bg-border/60 mx-1" />
          <div className="flex items-center gap-1.5">
            <label className="cursor-pointer">
              <div className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/8 bg-black/12 px-4 py-2 text-sm font-medium shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-colors hover:bg-white/8">
                <Upload className="h-4 w-4 text-primary" />
                <span className="hidden lg:inline">{t.chooseFile}</span>
              </div>
              <input type="file" accept=".txt,.csv" hidden onChange={onFileImport} />
            </label>
            <Button variant="outline" onClick={onPasteImport} className="gap-2 border-white/8 bg-black/12 shadow-[0_12px_30px_rgba(0,0,0,0.16)] hover:bg-white/8">
              <Clipboard className="h-4 w-4 text-primary" />
              <span className="hidden lg:inline">{t.pasteImport}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-2xl bg-white/4 p-1.5 ring-1 ring-white/8">
             <Select value={exportMode} onValueChange={(v) => setExportMode(v as ExportMode)}>
              <SelectTrigger className="h-8 w-[120px] border-white/8 bg-black/12 text-xs">
                <SelectValue placeholder={t.exportMode} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t.exportFull}</SelectItem>
                <SelectItem value="email-only">{t.exportEmailOnly}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onBatchExport} className="h-8 gap-1.5 border-white/8 bg-black/12 text-xs shadow-sm hover:bg-white/8">
              <FileUp className="h-3.5 w-3.5" />
              {t.batchExport}
            </Button>
            <Button variant="outline" size="sm" onClick={onExportAll} className="h-8 gap-1.5 border-white/8 bg-black/12 text-xs shadow-sm hover:bg-white/8">
              <Download className="h-3.5 w-3.5" />
              {t.exportAll}
            </Button>
          </div>
          
          <Separator orientation="vertical" className="neon-divider h-8 mx-1" />
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onBatchDelete} className="h-8 gap-1.5 border-white/10 bg-black/25 text-xs transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              {t.batchDelete}
            </Button>
            <Button variant="destructive" size="sm" onClick={onDeleteAll} className="h-8 gap-1.5 rounded-xl bg-[linear-gradient(90deg,rgba(255,76,110,0.9),rgba(255,43,77,0.98))] text-xs shadow-[0_18px_36px_rgba(255,29,87,0.28)]">
              <Trash2 className="h-3.5 w-3.5" />
              {t.deleteAll}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-10 rounded-2xl border-white/8 bg-black/12 pl-9 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
              placeholder={t.searchByName}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/4 p-1.5 ring-1 ring-white/8">
              <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 min-w-[180px] justify-between rounded-xl border-white/8 bg-black/12 px-3 text-xs shadow-sm hover:bg-white/8"
                  >
                    <span className="truncate">{selectedTagLabel}</span>
                    <span className="ml-3 text-[10px] text-primary/80">{selectByTags.length > 0 ? "Active" : "Filter"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-2xl border-white/10 bg-[linear-gradient(180deg,rgba(28,13,46,0.96),rgba(16,8,28,0.94))] p-2 shadow-[0_18px_50px_rgba(74,18,130,0.38)] backdrop-blur-xl">
                  <DropdownMenuLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
                    {t.tags}
                  </DropdownMenuLabel>
                  <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                    {selectByTags.length === 0 ? (
                      <Badge variant="secondary" className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] text-white/75">
                        {t.allTags}
                      </Badge>
                    ) : (
                      selectByTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full bg-[linear-gradient(90deg,rgba(238,205,255,0.95),rgba(196,143,255,0.88))] px-2.5 py-1 text-[10px] text-[#51166d]">
                          {tag}
                        </Badge>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {tagOptions.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">{t.noAvailableTags}</div>
                  ) : (
                    tagOptions.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={selectByTags.includes(tag)}
                        onCheckedChange={(checked) => toggleTagSelection(tag, checked === true)}
                        className="rounded-xl px-3 py-2 text-sm text-white/85 focus:bg-white/10 focus:text-white"
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {selectByTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearTags} className="h-7 px-2 text-[10px] text-primary hover:bg-primary/10">
                  {t.selectTag}
                </Button>
              )}
            </div>
          </div>
        </div>

          <div className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(90deg,rgba(114,29,163,0.16),rgba(65,12,99,0.1))] p-1.5 ring-1 ring-primary/18 shadow-[0_12px_30px_rgba(83,20,124,0.16)]">
          <div className="flex items-center gap-2 px-2 py-1">
            <MoveHorizontal className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary/80">{t.selectMoveTarget}</span>
          </div>
          <Select value={moveTargetTab} onValueChange={setMoveTargetTab}>
            <SelectTrigger className="h-8 w-[140px] border-white/8 bg-black/12 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab} value={tab}>{tab}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onMoveSelected} className="h-8 rounded-xl bg-[linear-gradient(90deg,rgba(197,90,255,0.95),rgba(132,52,255,0.95))] px-4 text-xs font-semibold text-primary-foreground shadow-[0_16px_40px_rgba(138,60,255,0.35)] hover:brightness-110">
            {t.moveSelected}
          </Button>
        </div>
      </div>
    </div>
  )
}
