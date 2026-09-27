# Software Requirements Specification (SRS)

**Project:** Web Clients Dashboard (ClientOps)
**Platform:** Desktop Application (Electron + React/TypeScript)
**Version:** 1.0 (MVP Phase)

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the creation of an Electron-based desktop application. The system will allow the user to manage and monitor the operational, financial, and software status of a portfolio of web clients from a single centralized dashboard.

### 1.2 Scope
The system encompasses the development of a native desktop client (frontend) and defines the communication contracts with an external API (backend). It does not include the development of the clients' actual software, but solely the management and monitoring tool for them.

---

## 2. Overall Description

### 2.1 Product Perspective
The system follows a **Client-Server** architecture.
*   **Client (Frontend):** Desktop application packaged with Electron, built with React and Tailwind CSS, operating as the visual interface and background data collection engine (polling).
*   **Server (Backend):** A custom RESTful API (developed in Node.js, Python, Go, etc.) that acts as the single source of truth for the clients' information.

### 2.2 User Profile
**System Administrator / Developer:** A single user with technical knowledge who needs to quickly view the status of their deployments, identify clients with overdue payments, and track the software version each project is currently running.

---

## 3. Functional Requirements (FR)

Functional requirements describe what the system must do explicitly.

| ID | Name | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | Client Roster | The system must query the API to render a complete list of all registered clients, including their name and project URL. | High |
| **FR-02** | Health Monitor | The system must execute periodic background queries (*polling*) to the API to determine if a client's server is `online` or `offline`. | High |
| **FR-03** | Billing Visualization | The system must display the current financial balance of each client, visually highlighting if there are overdue invoices or outstanding debts. | High |
| **FR-04** | Version History | The user must be able to select a client to view their current software version and a list of the latest changelogs or release notes. | Medium |
| **FR-05** | Native Notifications | If the background polling detects that a client's system status has changed to `offline`, the app must trigger a native OS notification. | High |
| **FR-06** | Search & Filtering | The user must be able to filter the main view by client name, health status (e.g., offline only), and financial status (e.g., debtors only). | Medium |

---

## 4. Non-Functional Requirements (NFR)

Non-functional requirements define the system's quality, performance, and security attributes.

| ID | Category | Description |
| :--- | :--- | :--- |
| **NFR-01** | Security (IPC) | The *Renderer* process (UI) must not make direct HTTP calls. All requests to the external API must pass through Electron's secure `ipcMain` channel. |
| **NFR-02** | Security (Auth) | Custom API credentials (API Keys or JWTs) must be stored securely using native OS modules (e.g., `keytar` or Electron's safe storage). |
| **NFR-03** | Performance | Background polling routines for system health must run in a non-blocking thread to ensure the user interface maintains 60 FPS without freezing. |
| **NFR-04** | Availability | The system must handle network errors gracefully (timeouts or API connection failures) by displaying an "Offline" status without crashing the application. |
| **NFR-05** | Portability | The final build must support cross-platform compilation for at least Windows (.exe) and macOS (.dmg). |

---

## 5. Interface Design (API Contract)

The desktop system will require the Custom API to implement and respond with the following JSON data structures:

### Main Data Model (Client)
```json
{
  "client_id": "uuid-v4",
  "name": "Commercial Name",
  "project_url": "https://client-site.com",
  "status": {
    "is_online": true,
    "last_checked": "2026-09-26T10:00:00Z"
  },
  "billing": {
    "total_due": 150.00,
    "currency": "USD",
    "status": "overdue"
  },
  "software": {
    "current_version": "v2.4.1",
    "last_update": "2026-09-20"
  }
}
```