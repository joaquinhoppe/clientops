# ClientOps - Web Clients Operations Dashboard

Centralized desktop monitoring dashboard built with Electron, React, TypeScript, Tailwind CSS, and a containerized FastAPI backend.

---

## ⚡ Quick Start

### 1. Wake up the program
To start both the backend API and the desktop application:

```bash
./scripts/start.sh
# or
npm start
```

* **Docker Mode:** If Docker is running and accessible, it will automatically spin up PostgreSQL and the FastAPI backend using `docker compose up -d`.
* **Local Fallback:** If Docker is not available or permissions are pending, it automatically falls back to the local Python virtualenv on `http://localhost:8000`.

### 2. Kill the program completely with `Ctrl+C`
Press **`Ctrl+C`** in the terminal where `start.sh` is running. The script intercepts the signal, immediately terminates the desktop app, stops the backend server, brings down any active Docker containers (`docker compose down`), and ensures zero orphaned processes remain.

---

## 📦 Creating the Linux AppImage

To package the standalone Linux AppImage executable:

```bash
./scripts/build-appimage.sh
# or
npm run package:appimage
```

The compiled executable will be generated at:
```
frontend/release/ClientOps-1.0.0.AppImage
```

You can execute it directly on any Linux distribution:
```bash
chmod +x frontend/release/ClientOps-1.0.0.AppImage
./frontend/release/ClientOps-1.0.0.AppImage
```

---

## 🧪 Running Tests & Verifying Compilation

Run all backend and frontend tests with a single command:

```bash
npm test
```

Or individually:
```bash
# Backend pytest suite (8 integration & schema tests)
npm run test:backend

# Frontend vitest suite (7 unit & filter tests)
npm run test:frontend

# Production bundle compilation
npm run build:frontend
```

---

## 🏗 Architecture & Features

- **FR-01 (Client Roster):** Live list of all managed client web apps with project URLs and status badges.
- **FR-02 (Health Monitor):** Non-blocking background polling engine running in Electron main process.
- **FR-03 (Billing Visualization):** Financial balances with visual badges highlighting overdue invoices and outstanding debts.
- **FR-04 (Version History):** Release notes and changelog viewer modal (`GET /api/v1/clients/{id}/releases`).
- **FR-05 (Native OS Notifications):** Triggers native desktop notifications when a monitored server transitions to `offline`. Includes a **"Test Offline"** button on each client card to immediately simulate outages.
- **FR-06 (Search & Filtering):** Real-time client name search, health status filter (`All`, `Online`, `Offline`), and billing filter (`All`, `Debtors Only`, `Paid Only`).
- **NFR-01 (Secure IPC):** Renderer never executes direct HTTP requests; all data access passes through typed `ipcMain` channels.
- **NFR-02 (Encrypted Auth):** API credentials are encrypted at rest using Electron's native `safeStorage` module.
- **NFR-04 (Fault Tolerant):** Graceful offline banners and cached states without app crashes during network disconnections.
