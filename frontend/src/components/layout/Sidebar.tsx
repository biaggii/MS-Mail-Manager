import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Folder, FolderPlus, Trash2, Edit2, ChevronRight, Hash } from "lucide-react"
import { Translations } from "../../i18n/translations"
import { useState } from "react"

interface SidebarProps {
  t: Translations
  tabs: string[]
  activeTab: string
  onSelectTab: (tab: string) => void
  onAddTab: (name: string) => void
  onRenameTab: (tab: string) => void
  onDeleteTab: (tab: string) => void
  isSidebarOpen: boolean
}

export function Sidebar({
  t,
  tabs,
  activeTab,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  isSidebarOpen,
}: SidebarProps) {
  const [newTabName, setNewTabName] = useState("")

  const handleAddTab = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTabName.trim()) {
      onAddTab(newTabName.trim())
      setNewTabName("")
    }
  }

  return (
    <div className={cn(
      "neon-divider shrink-0 border-r bg-[linear-gradient(180deg,rgba(18,10,34,0.12),rgba(9,5,18,0.03))] transition-all duration-300",
      "flex h-full flex-col",
      isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
    )}>
      <div className="neon-divider border-b p-4">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/90">
          <Folder className="h-4 w-4 text-primary" />
          {t.tabs}
        </h2>
        <form onSubmit={handleAddTab} className="flex gap-2">
          <Input
            className="h-8 rounded-xl border-white/8 bg-black/12 text-xs focus-visible:ring-1"
            placeholder={t.tabPlaceholder}
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
          />
          <Button type="submit" size="icon" variant="outline" className="h-8 w-8 shrink-0 rounded-xl border-white/8 bg-black/12 hover:bg-white/8">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1 custom-scrollbar">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={cn(
              "group relative flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium transition-all",
              "hover:bg-white/8 hover:text-white",
              tab === activeTab
                ? "bg-[linear-gradient(90deg,rgba(189,80,255,0.24),rgba(89,31,159,0.22))] text-white shadow-[0_12px_34px_rgba(109,35,177,0.28)] ring-1 ring-primary/35"
                : "text-muted-foreground"
            )}
            onClick={() => onSelectTab(tab)}
          >
            <div className="flex items-center gap-2 truncate">
              <Hash className={cn("h-3.5 w-3.5 shrink-0", tab === activeTab ? "text-primary" : "text-muted-foreground/50")} />
              <span className="truncate">{tab}</span>
            </div>
            {tab !== "Default" && (
              <div className="flex items-center gap-0.5 opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground transition-colors hover:bg-white/10 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRenameTab(tab)
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground transition-colors hover:bg-white/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTab(tab)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            {tab === activeTab && (
              <ChevronRight className="h-3 w-3 ml-1 text-primary animate-in fade-in slide-in-from-left-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
