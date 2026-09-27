# ClientOps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and package the ClientOps desktop dashboard application (Electron + React/TypeScript) with a containerized FastAPI backend (PostgreSQL + Docker Compose), featuring background polling, native OS notifications, secure IPC credential storage, search/filtering, and an AppImage build pipeline.

**Architecture:** A containerized backend REST API written in FastAPI + SQLAlchemy with PostgreSQL serving the SRS specification data contracts, paired with an Electron desktop application powered by Vite, React, and Tailwind CSS. The desktop app uses native IPC channels for secure communication, Electron `safeStorage` for encrypted API credentials, a non-blocking background polling engine for status monitoring, and OS-native notifications for server outages.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, PostgreSQL 16, Docker & Docker Compose, Node.js 20, Electron 33, Vite, React 18, TypeScript, Tailwind CSS, electron-builder.

**Spec:** [docs/superpowers/specs/2026-09-26-clientops-design.md](../../superpowers/specs/2026-09-26-clientops-design.md)

## Global Constraints
- Renderer must never execute direct external HTTP calls; all requests route via Electron `ipcMain` (NFR-01).
- API credentials must be encrypted at rest using Electron `safeStorage` (NFR-02).
- Background polling must not block UI rendering (60 FPS target) (NFR-03).
- Network errors must fail gracefully to an "Offline" badge without crashing (NFR-04).
- Cross-platform packaging must produce a functional Linux AppImage (NFR-05).
- A unified runner script must start all services and cleanly tear down Docker containers and processes on Ctrl+C (SIGINT/SIGTERM).

---

### Task 1: Docker Compose & Backend Container Scaffolding

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/.dockerignore`
- Create: `.env.example`

**Interfaces:**
- Produces: `docker-compose.yml` running `db` (Postgres 16 Alpine on port 5432) and `backend` (FastAPI on port 8000).

- [x] **Step 1: Write requirements.txt with pinned dependencies**
- [x] **Step 2: Create Dockerfile for the backend service using python:3.12-slim**
- [x] **Step 3: Create docker-compose.yml defining db (PostgreSQL) and backend (FastAPI)**
- [x] **Step 4: Verify Dockerfile builds cleanly or config syntax is valid**
- [x] **Step 5: Commit scaffolding**

```bash
git add docker-compose.yml backend/Dockerfile backend/requirements.txt backend/.dockerignore .env.example
git commit -m "feat(backend): add docker-compose and backend container scaffolding"
```

---

### Task 2: Backend Models, Database Connection & Pydantic Schemas

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`
- Create: `backend/app/schemas.py`
- Test: `backend/tests/test_schemas.py`

**Interfaces:**
- Consumes: Environment variables (`DATABASE_URL`, `API_KEY`).
- Produces: SQLAlchemy async engine, `ClientModel`, `ReleaseModel`, `ClientSchema`, `ReleaseSchema` exactly matching the SRS Section 5 JSON contract.

- [x] **Step 1: Write unit tests for Pydantic schemas validating SRS data structures**
- [x] **Step 2: Run pytest to verify schema tests fail**
- [x] **Step 3: Implement database connection with async SQLAlchemy and SQLite/PostgreSQL URL parsing**
- [x] **Step 4: Implement models.py with Client and Release tables**
- [x] **Step 5: Implement schemas.py matching SRS contract**
- [x] **Step 6: Run pytest to verify tests pass**
- [x] **Step 7: Commit database and model layer**

```bash
git add backend/app/ backend/tests/test_schemas.py
git commit -m "feat(backend): implement models, database connection, and schemas"
```

---

### Task 3: Backend REST Endpoints, Seed Data & API Tests

**Files:**
- Create: `backend/app/seed.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/clients.py`
- Create: `backend/app/routers/releases.py`
- Create: `backend/app/routers/health.py`
- Create: `backend/app/main.py`
- Test: `backend/tests/test_api.py`

**Interfaces:**
- Produces:
  - `GET /api/v1/health` -> `{ "status": "ok" }`
  - `GET /api/v1/clients` -> `List[ClientSchema]` (protected by `X-API-Key`)
  - `GET /api/v1/clients/{id}` -> `ClientSchema`
  - `GET /api/v1/clients/{id}/releases` -> `List[ReleaseSchema]`
  - `POST /api/v1/clients/{id}/toggle-status` -> `{ "client_id": str, "is_online": bool }`

- [x] **Step 1: Write integration tests for API endpoints in backend/tests/test_api.py**
- [x] **Step 2: Run pytest to verify endpoint tests fail**
- [x] **Step 3: Implement routers for clients, releases, health, and toggle-status**
- [x] **Step 4: Implement seed data generator in backend/app/seed.py with realistic mock clients**
- [x] **Step 5: Implement main.py with lifespan hook to auto-create tables and seed data**
- [x] **Step 6: Run pytest to verify all backend API tests pass**
- [x] **Step 7: Commit backend endpoints and seed system**

```bash
git add backend/app/ backend/tests/
git commit -m "feat(backend): add rest api routers, seed data, and tests"
```

---

### Task 4: Frontend Desktop Scaffolding (Vite + Electron + React + Tailwind)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.tsx`

**Interfaces:**
- Produces: Working React + Vite + Tailwind compilation and packaging scripts.

- [x] **Step 1: Create package.json with React, Vite, Tailwind, Electron, electron-builder**
- [x] **Step 2: Configure Vite and Tailwind for Electron and React**
- [x] **Step 3: Create index.html, index.css, and basic main.tsx**
- [x] **Step 4: Run `npm install` and verify `npm run build` succeeds**
- [x] **Step 5: Commit frontend scaffolding**

```bash
git add frontend/
git commit -m "feat(frontend): scaffold vite, react, tailwind, and electron structure"
```

---

### Task 5: Electron Main Process, Secure Preload & SafeStorage (NFR-01, NFR-02)

**Files:**
- Create: `frontend/electron/preload.ts`
- Create: `frontend/electron/safeStorage.ts`
- Create: `frontend/electron/main.ts`
- Create: `frontend/src/types/electron.d.ts`

**Interfaces:**
- Produces: Secure contextBridge `window.api` exposing typed IPC methods (`getClients`, `getReleases`, `toggleStatus`, `getSettings`, `saveSettings`, `onClientsUpdated`).
- Guarantees: NFR-01 (Renderer makes zero HTTP calls), NFR-02 (API Key encrypted with `safeStorage`).

- [x] **Step 1: Write safeStorage wrapper with fallback for environments where OS keychain is unavailable**
- [x] **Step 2: Write typed preload script exposing `window.api`**
- [x] **Step 3: Implement electron/main.ts with IPC listeners (`clients:get-all`, `settings:save`, etc.)**
- [x] **Step 4: Verify TypeScript compilation passes**
- [x] **Step 5: Commit Electron IPC and safeStorage layers**

```bash
git add frontend/electron/ frontend/src/types/
git commit -m "feat(frontend): implement secure ipc main process and safe storage"
```

---

### Task 6: Background Polling Engine & Native OS Notifications (FR-02, FR-05, NFR-03)

**Files:**
- Create: `frontend/electron/poller.ts`
- Modify: `frontend/electron/main.ts`
- Test: `frontend/tests/poller.test.ts`

**Interfaces:**
- Consumes: Backend HTTP endpoints via Node `fetch` in the main process.
- Produces: Non-blocking background polling routine with state diffing. Triggers `Notification` on status transition `is_online: true -> false`. Emits `clients:updated` event to the renderer.

- [x] **Step 1: Write unit tests for polling diff logic and notification triggers**
- [x] **Step 2: Run tests to verify they fail**
- [x] **Step 3: Implement Poller class with start/stop, configurable interval, error resilience (NFR-04), and state tracking**
- [x] **Step 4: Wire Poller into electron/main.ts lifecycle**
- [x] **Step 5: Run tests to verify poller diffing passes**
- [x] **Step 6: Commit polling engine and notification integration**

```bash
git add frontend/electron/poller.ts frontend/tests/poller.test.ts
git commit -m "feat(frontend): implement background polling and native notifications"
```

---

### Task 7: Frontend UI Dashboard, Roster, Filters & Modals (FR-01, FR-03, FR-04, FR-06)

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/FilterBar.tsx`
- Create: `frontend/src/components/ClientCard.tsx`
- Create: `frontend/src/components/ClientDetailModal.tsx`
- Create: `frontend/src/components/SettingsModal.tsx`
- Create: `frontend/src/App.tsx`
- Test: `frontend/tests/filterLogic.test.ts`

**Interfaces:**
- Consumes: `window.api` IPC methods.
- Produces:
  - Roster view of clients with live health status, project URLs, and software version.
  - Overdue debt visual highlights with formatted currency.
  - Search by client name and filters (Health: All/Online/Offline; Billing: All/Debtors Only).
  - Release history modal displaying changelogs.
  - Settings modal for configuring backend URL, API key, and polling interval.

- [x] **Step 1: Create TypeScript models matching the SRS Section 5 JSON contract**
- [x] **Step 2: Create UI components: Navbar, FilterBar, ClientCard, ClientDetailModal, SettingsModal**
- [x] **Step 3: Implement App.tsx connecting components with real-time IPC updates and graceful error states**
- [x] **Step 4: Write tests for filtering logic**
- [x] **Step 5: Run frontend test suite to ensure all tests pass**
- [x] **Step 6: Verify TypeScript and Vite production build (`npm run build`)**
- [x] **Step 7: Commit UI dashboard and components**

```bash
git add frontend/src/ frontend/tests/
git commit -m "feat(frontend): implement dashboard ui, roster, filters, and modals"
```

---

### Task 8: Unified Lifecycle Script (Ctrl+C Cleanup) & Linux AppImage Packaging

**Files:**
- Create: `scripts/start.sh`
- Create: `scripts/build-appimage.sh`
- Modify: `frontend/package.json` (add electron-builder AppImage config)
- Modify: `package.json` (root convenience scripts)

**Interfaces:**
- Produces:
  - `./scripts/start.sh` (or `npm start`): starts backend & desktop app, intercepts Ctrl+C (SIGINT/SIGTERM), cleanly kills background processes and containers.
  - `./scripts/build-appimage.sh` (or `npm run package:appimage`): builds production Linux AppImage executable in `release/`.

- [x] **Step 1: Implement scripts/start.sh with signal traps for SIGINT and SIGTERM**
- [x] **Step 2: Configure electron-builder in frontend for Linux AppImage output**
- [x] **Step 3: Implement scripts/build-appimage.sh**
- [x] **Step 4: Make scripts executable (`chmod +x scripts/*.sh`)**
- [x] **Step 5: Test start script and AppImage build configuration**
- [x] **Step 6: Commit lifecycle scripts and packaging config**

```bash
git add scripts/ package.json frontend/package.json
git commit -m "feat(ops): add clean start/stop script and AppImage build pipeline"
```

---

### Task 9: Full System Verification & Health Check

- [x] **Step 1: Run backend test suite**
- [x] **Step 2: Run frontend test suite & production bundle build**
- [x] **Step 3: Verify compilation across the entire stack**
- [x] **Step 4: Verify AppImage packaging generates or verifies correctly**
- [x] **Step 5: Final git commit and branch wrap-up**
