# MS-Mail-Manager Agent Guide

This repository is a Wails desktop app for managing Microsoft / Outlook accounts, importing account lists, organizing tags and tabs, and fetching `Inbox` plus `Junk` mail through Microsoft Graph.

## Product Snapshot

- **Desktop shell:** Wails v2
- **Backend:** Go
- **Frontend:** React + TypeScript
- **State & storage:** SQLite-backed local persistence
- **Design direction:** dark cyber-purple glass UI with bundled background art and custom app icon

## Repo Map

### Backend

- `main.go`: Wails bootstrap and application wiring
- `app.go`: lifecycle hooks and frontend-bound methods
- `app_mail.go`: Microsoft Graph mail fetch and mailbox handling
- `storage.go`, `sqlite_storage.go`: persistence and migrations

### Frontend

- `frontend/src/App.tsx`: top-level orchestration for dialogs, mailbox flows, and page layout
- `frontend/src/hooks/useMailManager.ts`: core state management and backend bridge
- `frontend/src/components/layout/`: shell components such as navbar, sidebar, toolbar, table, and modals
- `frontend/src/components/ui/`: shared shadcn/ui building blocks
- `frontend/src/i18n/translations.ts`: all user-facing copy
- `frontend/src/assets/`: bundled art assets such as `BG.jpg` and `icon.jpg`
- `frontend/src/style.css`: theme tokens, neon borders, and global styling overrides

## Current UX Behaviors

- `Fetch New Mail` refreshes both `Inbox` and `Junk` while preserving separate mailbox views.
- Tag badges open per-tag actions such as add, rename, and remove.
- Paste import supports richer guidance and validation before import.
- The tag filter is a custom UI, not a native browser multi-select.

## Working Rules

- Keep business logic in hooks, utilities, or backend methods. Do not let layout components become state blobs.
- Keep TypeScript strict. Do not introduce `any`.
- Add every new UI string to `frontend/src/i18n/translations.ts`.
- Preserve the existing visual language unless the task explicitly asks for a redesign.
- Treat refresh tokens, account rows, and imported payloads as sensitive data. Do not log them.
- Prefer small targeted edits over broad rewrites in shared files.

## Development Commands

```bash
# Full desktop development
wails dev

# Frontend-only iteration
cd frontend && npm run dev

# TypeScript / production bundle verification
cd frontend && npm run build

# Backend verification
go test ./...

# Desktop production build
wails build
```

## Verification Standard

Before closing work:

1. Run `cd frontend && npm run build` for frontend-affecting changes.
2. Run `go test ./...` for backend or shared logic changes.
3. Run `wails build` when changing desktop packaging, icons, or bundled assets.
4. Do not claim a fix without command evidence.

## Documentation Standard

- `README.md` is the external entry point. Keep it product-facing and accurate.
- `AGENTS.md` is the collaborator contract. Keep it operational and concise.
- If features, commands, or architecture change, update the relevant doc in the same branch.

## Commit Standard

- Use scoped commit messages such as `feat(ui): improve paste import modal`.
- Do not commit secrets, local databases, or transient caches.
- If you generate build assets intentionally, make sure they are reproducible and relevant to the shipped app.
