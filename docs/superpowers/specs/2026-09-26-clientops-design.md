# ClientOps - Design Specification

**Date:** 2026-09-26  
**Status:** Approved  
**Topic:** Web Clients Dashboard Desktop Application (ClientOps)  
**SRS Reference:** [srs.md](../../../srs.md)  

---

## 1. System Overview

ClientOps is an Electron-based desktop application paired with a containerized FastAPI backend. It provides a centralized dashboard for system administrators and developers to monitor operational status, track software releases, and visualize billing health for a portfolio of web clients.

### Key Goals
- **FR-01 (Client Roster):** Query API to render a list of registered clients with project URLs and status badges.
- **FR-02 (Health Monitor):** Background polling (default 30s) to monitor client `online` / `offline` status without freezing the UI.
- **FR-03 (Billing Visualization):** Display balances and highlight overdue invoices/debts.
- **FR-04 (Version History):** View client software version and changelog history (`GET /api/v1/clients/{id}/releases`).
- **FR-05 (Native Notifications):** Trigger native OS notifications when a client transitions to `offline`.
- **FR-06 (Search & Filtering):** Real-time client name search, health filter (`All`, `Online`, `Offline`), and financial filter (`All`, `Debtors Only`).
- **NFR-01 to NFR-05:** Secure IPC (no direct HTTP in renderer), native `safeStorage` for credentials, non-blocking background polling, graceful offline/error states, and cross-platform packaging (including Linux AppImage).

---

## 2. Architecture & Tech Stack

### 2.1 Backend (Containerized)
- **Framework:** FastAPI (Python 3.12-slim) with Pydantic v2.
- **ORM / Database:** SQLAlchemy 2.0 (asyncio) with PostgreSQL 16 Alpine in Docker Compose. Support for fallback to local SQLite for zero-config offline runs.
- **Authentication:** `X-API-Key` header verification on protected endpoints.
- **Seed Service:** Auto-seeds database on startup with realistic client portfolios (varying online/offline states, overdue invoices, release histories).
- **Test & Toggle Endpoints:** `POST /api/v1/clients/{client_id}/toggle-status` to easily simulate server failure and trigger native OS notifications.

### 2.2 Frontend Desktop Client
- **Runtime:** Electron 33+ with Node.js 20 LTS.
- **UI Framework:** React 18, TypeScript, Tailwind CSS, Lucide React icons.
- **Bundler:** Vite with `@vitejs/plugin-react` and `vite-plugin-electron`.
- **Security:**
  - `contextIsolation: true`, `nodeIntegration: false`.
  - Renderer communicates exclusively via `window.api` over IPC.
  - Native `safeStorage` used to encrypt/decrypt API keys on disk.
- **Packaging:** `electron-builder` configured for Linux `.AppImage`, Windows `.exe`, and macOS `.dmg`.

### 2.3 Operational Scripts
- `start.sh`: Single script that starts Docker backend, launches the Electron frontend, traps `SIGINT` (Ctrl+C), and cleanly terminates all background processes and containers on exit.
- `package-appimage.sh` / `npm run dist`: Builds executable Linux AppImage.

---

## 3. Data Models & API Contracts

### 3.1 Client Model (`GET /api/v1/clients`)
Conforms to SRS Section 5:
```json
{
  "client_id": "c1f7b0f2-4e20-4a81-8b38-89c564c72d01",
  "name": "Acme Commerce",
  "project_url": "https://acme-shop.com",
  "status": {
    "is_online": true,
    "last_checked": "2026-09-26T22:30:00Z"
  },
  "billing": {
    "total_due": 250.00,
    "currency": "USD",
    "status": "overdue"
  },
  "software": {
    "current_version": "v2.4.1",
    "last_update": "2026-09-20"
  }
}
```

### 3.2 Releases Model (`GET /api/v1/clients/{client_id}/releases`)
```json
[
  {
    "version": "v2.4.1",
    "release_date": "2026-09-20",
    "changelog": [
      "Fixed checkout cart calculation bug",
      "Added Stripe webhook verification"
    ]
  }
]
```

### 3.3 Health & Settings Endpoints
- `GET /api/v1/health`: Returns API status `{ "status": "ok", "version": "1.0.0" }`.
- `POST /api/v1/clients/{client_id}/toggle-status`: Flips `is_online` status for testing.

---

## 4. Electron IPC Protocol

| Channel | Type | Payload | Description |
| :--- | :--- | :--- | :--- |
| `clients:get-all` | `invoke` | None | Returns cached or newly fetched client list. |
| `clients:get-releases` | `invoke` | `{ clientId: string }` | Fetches release history for client. |
| `clients:toggle-status` | `invoke` | `{ clientId: string }` | Invokes test toggle on backend. |
| `settings:get` | `invoke` | None | Retrieves decrypted settings (apiUrl, apiKey, interval). |
| `settings:save` | `invoke` | `{ apiUrl: string, apiKey: string, pollingInterval: number }` | Encrypts apiKey with safeStorage and persists settings. |
| `clients:updated` | `on` (push) | `Client[]` | Pushed to renderer when polling routine receives new data. |

---

## 5. Graceful Lifecycle & Signal Handling

The project includes `scripts/start.sh`:
1. Traps `SIGINT` and `SIGTERM`.
2. Checks docker daemon availability. If docker is accessible, runs `docker compose up -d`. If docker socket is unavailable, falls back to running the FastAPI backend via local virtualenv.
3. Launches the Electron desktop app.
4. On `Ctrl+C`, intercepts the signal, kills the desktop process, stops backend processes / docker containers (`docker compose down`), and exits cleanly with zero orphaned processes.
