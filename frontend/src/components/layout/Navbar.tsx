import { Email } from "../../types"
import { Lang, Translations } from "../../i18n/translations"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Settings, Globe, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavbarProps {
  t: Translations
  lang: Lang
  onLangChange: (lang: Lang) => void
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export function Navbar({ t, lang, onLangChange, onToggleSidebar, isSidebarOpen }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onToggleSidebar}
            >
              <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <a className="flex items-center space-x-2" href="/">
              <Mail className="h-6 w-6 text-primary" />
              <span className="font-bold">
                {t.mailboxManager}
              </span>
            </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2">
              <Globe className="h-4 w-4 text-muted-foreground mr-1" />
              <Select value={lang} onValueChange={(v) => onLangChange(v as Lang)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
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
