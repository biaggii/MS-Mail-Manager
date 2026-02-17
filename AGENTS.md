# Repository Guidelines

## Project Structure & Module Organization
- Root Go app files: `main.go`, `app.go`, `api.go`, `import.go`, `storage.go`, `models.go`.
- Go tests live beside source as `*_test.go` (for example `api_test.go`, `storage_test.go`).
- Frontend app lives in `frontend/`:
  - UI source: `frontend/src/`
  - Styles: `frontend/src/App.css`, `frontend/src/style.css`
  - Wails JS bindings: `frontend/wailsjs/`
- Build packaging assets live under `build/` (Windows/Darwin metadata and installer templates).

## Build, Test, and Development Commands
- `wails dev` (repo root): run desktop app in development with live frontend reload.
- `wails build` (repo root): produce distributable desktop build.
- `go test ./...` (repo root): run all Go unit tests.
- `cd frontend && npm run build`: type-check and build frontend production bundle.
- `cd frontend && npm run dev`: run frontend-only Vite server for isolated UI iteration.

## Coding Style & Naming Conventions
- Go: keep code `gofmt`-formatted; exported names use `PascalCase`, internal helpers use `camelCase`.
- TypeScript/React: use functional components + hooks; keep state/handler names explicit (`handleExportAll`, `setDialogEditVisible`).
- Prefer small, focused functions and early-return validation for input and API actions.
- Keep user-facing strings in translation maps (`en` / `zh`) when editing UI text.

## Testing Guidelines
- Primary test framework is Go’s built-in `testing` package.
- Add tests for behavior changes, especially API request construction, parsing, and state normalization.
- Test file naming: `<unit>_test.go`; test names should describe behavior (`TestRunActionUsesPostJSONBody`).
- Before PR: run `go test ./...` and `npm run build`.

## Commit & Pull Request Guidelines
- Follow Conventional-style commit messages already used in history:
  - Example: `feat: add tab management and email-only export`
- Keep commits scoped (UI/layout, backend behavior, docs) and avoid mixing unrelated edits.
- PRs should include:
  - what changed and why
  - screenshots/GIFs for UI changes
  - verification steps and command output summary
  - linked issue/task when available

## Security & Configuration Tips
- Never commit real refresh tokens, mailbox exports, or personal account credentials.
- Use `VITE_API_BASE_URL` for environment-specific API host configuration.
- Validate that sensitive token data is sent in request body (not query string) when touching API code.
