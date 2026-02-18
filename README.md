# MS-Mail-Manager

Desktop mailbox manager built with:
- Go + Wails v2
- React + TypeScript (Vite)

The app lets you import Outlook account rows, manage mailbox entries locally, and fetch/view inbox or junk mail directly from Microsoft services through the built-in Go layer.

## Features

- Bulk import accounts from file or paste text
- Custom row delimiter (default: `----`)
- Local account persistence
- Edit / delete / export account rows
- Inbox/Junk mail fetch and view
- Clear mailbox action
- i18n UI (`English` default, `中文` optional)
- ESC key closes dialogs in stack order

## Project Structure

- `app.go` - Wails-bound Go application logic
- `app_mail.go` - built-in Microsoft Graph mail fetch/clear implementation
- `api.go` - legacy external API action helpers (kept for compatibility)
- `storage.go` - local state persistence and normalization
- `import.go` - account row parser
- `frontend/` - React + TypeScript UI

## Requirements

- Go 1.21+ (or your configured Go toolchain)
- Node.js 18+ and npm
- Wails CLI v2

Install Wails CLI if needed:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## Run In Development

From project root:

```bash
wails dev
```

This starts the Go backend and the Vite dev server.

## Build

From project root:

```bash
wails build
```

Frontend-only build:

```bash
cd frontend
npm run build
```

## Mail Architecture

- No external backend server is required for mailbox fetch/clear.
- Frontend calls Wails-bound Go methods (`MailAll`, `ProcessMailbox`).
- Go obtains OAuth token via refresh token and reads/deletes mailbox messages through Microsoft Graph.
- This removes browser-side CORS/preflight issues from direct `fetch` calls.

## Data Format For Import

Default delimiter is `----`.

Each line:

```text
email----username_or_label----client_id----refresh_token
```

Example:

```text
JoshuaWalker1453@outlook.com----hG0C1LsGKJMDm3----9e5f94bc-e8a4-4e73-b8be-63364c29d753----M.C520_SN1.0.U....
```

## Quality Checks

Run Go tests:

```bash
go test ./...
```

Run frontend production build:

```bash
cd frontend
npm run build
```

## Security Notes

- Do not commit real refresh tokens.
- Use private repositories for real account data.
- Avoid sharing exported account files.

## License

Internal / private project unless you add a license file.
