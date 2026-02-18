# Repository Guidelines & Standards

## 🏗️ Technical Architecture

### Backend (Go)
- **main.go:** Application entry and Wails configuration.
- **app.go:** Core lifecycle management and frontend-bound methods.
- **app_mail.go:** Implementation of Microsoft Graph API logic.
- **storage.go / sqlite_storage.go:** SQLite-based persistence layer with migration support.

### Frontend (React + TypeScript)
- **Framework:** Refactored into a modular component-based architecture.
- **Hooks:** All business logic resides in `src/hooks/useMailManager.ts`.
- **Components:** 
  - `src/components/layout/`: Functional layout parts (Navbar, Sidebar, etc.).
  - `src/components/ui/`: Standardized, accessible shadcn/ui components.
- **Styling:** Utility-first CSS using Tailwind CSS 4.

## 🚀 Development Workflow

1. **Local Dev:** Use `wails dev` for full-stack feedback.
2. **UI Iteration:** Use `cd frontend && npm run dev` for rapid styling.
3. **Verification:** Always run `cd frontend && npm run build` before committing to ensure TypeScript safety.
4. **Backend Testing:** Run `go test ./...` to verify storage and parsing logic.

## ✍️ Coding Standards

- **Clarity:** Prefer descriptive variable names over brevity.
- **Modularity:** Keep components under 200 lines. Extract complex logic into hooks or utils.
- **Typing:** Strict TypeScript usage. Avoid `any` at all costs.
- **Styling:** Follow shadcn/ui patterns for consistency and accessibility.
- **I18n:** All UI strings must be added to `src/i18n/translations.ts`.

## 🔐 Security & Data Handling

- **Tokens:** Refresh tokens and account data are sensitive. Never include them in logs or commits.
- **Transport:** Use `POST` payloads for any sensitive data passing between the Go backend and React frontend.
- **Persistence:** Ensure `app.db` and other local state files are correctly ignored by Git.

## 🧪 Commit Standards

- Use descriptive, scoped commit messages (e.g., `feat(ui): implement collapsible sidebar`).
- Ensure all dependencies are updated and `go mod tidy` has been run.
