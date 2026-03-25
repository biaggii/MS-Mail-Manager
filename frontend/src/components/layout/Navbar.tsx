import { Lang, Translations } from "../../i18n/translations"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import appIcon from "../../assets/icon.jpg"

interface NavbarProps {
  t: Translations
  lang: Lang
  onLangChange: (lang: Lang) => void
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export function Navbar({ t, lang, onLangChange, onToggleSidebar, isSidebarOpen }: NavbarProps) {
  return (
    <header className="neon-divider sticky top-0 z-50 w-full border-b bg-[linear-gradient(180deg,rgba(31,14,53,0.18),rgba(12,6,25,0.08))]">
      <div className="flex h-18 items-center px-6">
        <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              onClick={onToggleSidebar}
            >
              <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <a className="flex items-center gap-3" href="/">
              <div className="relative">
                <img src={appIcon} alt="MS-Mail-Manager icon" className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/20 shadow-[0_0_28px_rgba(183,72,255,0.45)]" />
                <div className="absolute -inset-1 -z-10 rounded-[20px] bg-[radial-gradient(circle,rgba(190,79,255,0.5),transparent_70%)] blur-md" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
                  Mail Control
                </span>
                <span className="bg-[linear-gradient(90deg,#fff,#f2c4ff_60%,#c774ff)] bg-clip-text text-lg font-black tracking-tight text-transparent">
                  {t.mailboxManager}
                </span>
              </div>
            </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Globe className="h-4 w-4 text-primary" />
              <Select value={lang} onValueChange={(v) => onLangChange(v as Lang)}>
                <SelectTrigger className="h-9 w-[132px] border-white/10 bg-white/5 text-xs text-white shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eng">{t.english}</SelectItem>
                  <SelectItem value="cht">{t.chinese}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
