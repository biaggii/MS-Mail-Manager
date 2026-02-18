# MS-Mail-Manager

A professional, high-performance desktop mailbox manager for Outlook/Microsoft accounts. Refactored for extreme stability, modern aesthetics, and superior developer experience.

## 🚀 Key Technologies

- **Backend:** [Go](https://go.dev/) + [Wails v2](https://wails.io/) (Native Desktop bridge)
- **Frontend:** [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database:** [SQLite](https://www.sqlite.org/) (Robust local persistence)

## ✨ Core Features

- **Modernized Interface:** Sleek, responsive design with a collapsible sidebar and clean typography.
- **Advanced Account Management:** 
  - Bulk import via files or text (custom separators like `----`).
  - Account tagging and categorization.
  - Grouping via custom Tabs for organized workflows.
- **Graph API Integration:** Secure, direct connection to Microsoft services for mail fetching (Inbox/Junk).
- **Efficient Workflows:**
  - **Right-Click Context Menus:** Native-feel row actions (Copy Email, Manage Tags, Delete).
  - **Batch Operations:** Mass export, multi-delete, and bulk tab relocation.
  - **Tag Filter:** Multi-select tag filtering for precise account discovery.
- **Privacy Focused:** 100% local data storage in SQLite; tokens never leave your machine.

## 📁 Refactored Architecture

The application has been refactored from a monolithic structure into a modular, maintainable architecture:

- **Logic Layer:** Custom React hook `useMailManager` isolates state management and Go API bridges.
- **Component Layer:** Decoupled UI components (`Navbar`, `Sidebar`, `MailTable`, `MailToolbar`) for focused development.
- **Utility Layer:** Centralized `mail-utils` and TypeScript `types` for project-wide consistency.
- **Persistence Layer:** Structured SQLite schema with automated migrations.

## 🛠️ Getting Started

### Prerequisites
- **Go:** 1.21+
- **Node.js:** 18+
- **Wails CLI:** `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Development
```bash
# Start dev server with hot-reload
wails dev
```

### Build
```bash
# Generate production binary
wails build
```

## 🔒 Security
- Industry-standard OAuth2 refresh token handling.
- Local-only data persistence (`app.db`).
- No external dependencies for mail fetching (direct Graph API calls via Go).

## 📄 License
Internal / Private.
