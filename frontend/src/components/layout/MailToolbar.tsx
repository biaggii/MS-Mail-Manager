import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
  return (
    <div className="flex flex-col gap-4 p-4 border-b bg-card shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-md ring-1 ring-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">{t.separator}</span>
            <Input
              className="h-8 w-16 text-center text-xs font-mono bg-background"
              value={splitSymbol}
              onChange={(e) => setSplitSymbol(e.target.value)}
            />
          </div>
          <div className="h-8 w-px bg-border/60 mx-1" />
          <div className="flex items-center gap-1.5">
            <label className="cursor-pointer">
              <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span className="hidden lg:inline">{t.chooseFile}</span>
              </div>
              <input type="file" accept=".txt,.csv" hidden onChange={onFileImport} />
            </label>
            <Button variant="outline" onClick={onPasteImport} className="gap-2 shadow-sm">
              <Clipboard className="h-4 w-4 text-primary" />
              <span className="hidden lg:inline">{t.pasteImport}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-muted/40 p-1.5 rounded-md ring-1 ring-border/50">
             <Select value={exportMode} onValueChange={(v) => setExportMode(v as ExportMode)}>
              <SelectTrigger className="h-8 w-[120px] text-xs bg-background">
                <SelectValue placeholder={t.exportMode} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t.exportFull}</SelectItem>
                <SelectItem value="email-only">{t.exportEmailOnly}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onBatchExport} className="h-8 text-xs gap-1.5 shadow-sm">
              <FileUp className="h-3.5 w-3.5" />
              {t.batchExport}
            </Button>
            <Button variant="outline" size="sm" onClick={onExportAll} className="h-8 text-xs gap-1.5 shadow-sm">
              <Download className="h-3.5 w-3.5" />
              {t.exportAll}
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-8 mx-1" />
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onBatchDelete} className="h-8 text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all">
              <Trash2 className="h-3.5 w-3.5" />
              {t.batchDelete}
            </Button>
            <Button variant="destructive" size="sm" onClick={onDeleteAll} className="h-8 text-xs gap-1.5 shadow-md shadow-destructive/10">
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
              className="pl-9 h-10 shadow-sm"
              placeholder={t.searchByName}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-md ring-1 ring-border/50">
              <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              <select
                className="h-8 w-[160px] text-xs bg-background rounded-md border border-input shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
                multiple
                value={selectByTags}
                onChange={(e) => onSelectTagsChange(Array.from(e.target.selectedOptions).map((option) => option.value))}
              >
                <option value="all">{t.allTags}</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              {selectByTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearTags} className="h-7 px-2 text-[10px] text-primary hover:bg-primary/10">
                  {t.selectTag}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-primary/5 p-1.5 rounded-lg ring-1 ring-primary/20">
          <div className="flex items-center gap-2 px-2 py-1">
            <MoveHorizontal className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary/80">{t.selectMoveTarget}</span>
          </div>
          <Select value={moveTargetTab} onValueChange={setMoveTargetTab}>
            <SelectTrigger className="h-8 w-[140px] text-xs bg-background border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab} value={tab}>{tab}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onMoveSelected} className="h-8 text-xs font-semibold shadow-sm px-4">
            {t.moveSelected}
          </Button>
        </div>
      </div>
    </div>
  )
}
