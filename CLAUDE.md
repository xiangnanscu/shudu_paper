# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development & Dev Servers
- `npm run dev`: Start Vite frontend development server (runs on `http://localhost:5173`, proxies `/api` requests to port `8787`).
- `npm run dev:worker`: Start local Cloudflare Worker & D1 database runtime via Wrangler (`http://localhost:8787`).

### Build & Deploy
- `npm run build`: Generate PWA icons and build frontend production assets into `public/`.
- `npm run build:frontend`: Run `scripts/generate-icons.js` and build with Vite.
- `npm run generate-icons`: Run icon generation script using Sharp.
- `npm run deploy`: Build production bundle and deploy to Cloudflare Workers + D1 (`npm run build && wrangler deploy`).

### Type Checking
This repository does not use a test runner. Use TypeScript compiler tools to check for type errors:
- Frontend type check: `npx vue-tsc --noEmit -p frontend/tsconfig.json`
- Backend Worker type check: `npx tsc --noEmit`

---

## Architecture

The project is a full-stack 4x4 Sudoku practice sheet generator and interactive exam system. It supports high-fidelity A4 printing, online quiz taking with 100-point auto-grading, PWA offline usage, and cloud score persistence.

### Full-Stack Overview
- **Frontend SPA / PWA**: Built with Vue 3 (Composition API) + TypeScript + Vite, located under `frontend/`. Production output compiles into `public/`.
- **Backend / Serverless**: Single Cloudflare Worker in `src/index.ts` connecting to Cloudflare D1 (`shudu_paper_db` SQLite database defined in `schema.sql`).
- **Static Asset Serving & Routing**: Managed by Cloudflare Workers Assets configured in `wrangler.jsonc`:
  - `run_worker_first: ["/api/*"]`: All API calls route directly to the Worker.
  - `not_found_handling: "single-page-application"`: All non-API routes fallback to `public/index.html`.

### Backend API Design (`src/index.ts`)
- `POST /api/records`: Persists exam submissions (score, time spent, difficulty, symbol set, total/correct holes, and JSON payload of puzzle snapshots and user answers).
- `GET /api/records?clientUuid=...`: Returns user aggregated statistics (total exams, high score, average score, total time) and history list.
- `GET /api/records/:id`: Retrieves full record details including question and answer breakdown.
- `DELETE /api/records/:id`: Forbidden (returns HTTP 403) to ensure score history integrity.

### Frontend Layers (`frontend/src/`)
- **`core/` (Pure TypeScript Algorithm Layer)**:
  - `engine.ts`: 4x4 Sudoku backtracking generator, unique solution verification (`countSolutions`), digging holes, and two-cell hypothesis analysis (`analyzeHypothesisFeatures`).
  - `difficulty.ts`: Known-number/clue allocation strategies for difficulty levels (`starter`, `easy`, `medium`, `hard`, `mixed_page`, `random`) and hypothesis training (`medium_hypo_*`).
  - `symbols.ts`: Symbol mapping sets (Numbers `1-4`, Letters `A-D`, Shapes `●▲■★`, Fruits, Animals).
  - `client-uuid.ts`: Persistent anonymous client ID stored in `localStorage` for multi-device data segregation without login credentials.
- **`composables/` (State & Business Logic)**:
  - `useSudoku.ts`: Multi-page puzzle generation, grid geometry, font sizing, and page slice calculations.
  - `useExam.ts`: State machine (`ready` -> `doing` -> `submitted`), answer collection, and 100-point grading logic.
  - `useCloudRecords.ts`: Syncs records with `/api/records`, groups entries into timeline buckets (Today, Yesterday, Last 7 Days, Earlier), and handles offline queuing (`shudu_offline_records_queue`) with automatic background sync when reconnected.
  - `useKeypad.ts` & `useKeyboard.ts`: Popover positioning and physical keyboard interaction (1-4, A-D, Backspace, arrows).
  - `useResponsiveScale.ts`: Dynamically calculates scale ratio (`paper-scale-container`) to fit the fixed A4 aspect ratio seamlessly onto mobile/tablet viewports without horizontal scrolling.
  - `usePWAInstall.ts`: Manages PWA installation prompts and iOS Safari installation guide.
- **`components/` (UI Presentation)**:
  - `paper/`: A4 paper layouts, headers/footers, and grid cells. All interactive UI elements are hidden during print via `@media print`.
  - `sidebar/`: Configuration panel for layout, difficulty, symbol type, and print triggers (collapses into a drawer on mobile/tablets).
  - `drawer/`: WeChat-mini-program style sliding history drawer and learning stat dashboard.
  - `exam/`: Top sticky exam status bar (`ExamTopBar.vue`), floating input popover (`KeypadPopover.vue`), and score award modal (`ScoreModal.vue`).
