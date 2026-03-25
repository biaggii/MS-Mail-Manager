# MS-Mail-Manager

MS-Mail-Manager is a desktop mailbox operations tool for Microsoft / Outlook accounts. It combines local account storage, batch management tools, tagging, tab-based organization, and direct Microsoft Graph mail fetching inside a Wails desktop shell.

## What It Does

- Import large account lists from file or paste input
- Organize accounts with custom tabs and tags
- Filter, move, export, and delete accounts in bulk
- Fetch mail from both `Inbox` and `Junk`
- Manage tag actions directly from tag badges
- Keep account data local with SQLite-backed persistence

## UX Highlights

- Cyber-purple desktop theme with bundled background art and custom app icon
- Paste import flow with expected-format guidance and live validation stats
- Separate mailbox views for `Inbox` and `Junk`
- `Fetch New Mail` refresh behavior that updates both mailboxes in one action
- Custom tag filter UI instead of a native browser multi-select

## Tech Stack

- **Desktop runtime:** [Wails v2](https://wails.io/)
- **Backend:** [Go](https://go.dev/)
- **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **UI foundation:** [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Persistence:** [SQLite](https://www.sqlite.org/)

## Project Structure

```text
.
├─ app.go / app_mail.go        # Wails methods and Microsoft Graph mail flows
├─ storage.go                  # storage contracts
├─ sqlite_storage.go           # SQLite implementation and migrations
├─ frontend/
│  ├─ src/App.tsx              # app shell orchestration
│  ├─ src/hooks/useMailManager.ts
│  ├─ src/components/layout/   # navbar, sidebar, toolbar, table, modals
│  ├─ src/components/ui/       # shared shadcn/ui primitives
│  ├─ src/i18n/translations.ts # all UI strings
│  ├─ src/assets/              # bundled art assets
│  └─ src/style.css            # theme tokens and global styling
└─ build/                      # desktop build assets and binaries
```

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- Wails CLI

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Development

```bash
wails dev
```

For frontend-only iteration:

```bash
cd frontend && npm run dev
```

### Verification

```bash
cd frontend && npm run build
go test ./...
```

### Production Build

```bash
wails build
```

The Windows executable is generated under `build/bin/`.

## Security

- Refresh tokens and account payloads are sensitive and should never be logged.
- Application data stays local to the machine.
- Mail fetching is performed through Microsoft Graph integration in the Go backend.

## Contributing Notes

- Keep UI copy in `frontend/src/i18n/translations.ts`.
- Preserve strict TypeScript typing.
- Verify frontend changes with `cd frontend && npm run build`.
- Verify backend logic with `go test ./...`.

## License

Internal / Private.
