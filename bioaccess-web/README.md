# BioAccess Web

Next.js fingerprint attendance system with **per-user** Windows Hello registration via WebAuthn.

## How to start (important)

BioAccess is a **full-stack Next.js app** — one command starts **both** the website and the API. There is no separate backend server.

You only need **two things running**:

| What | How |
|------|-----|
| **PostgreSQL** | Must be running (Windows service or pgAdmin) |
| **BioAccess app** | `npm run dev` in `bioaccess-web/` |

```powershell
cd bioaccess-web
npm install          # first time only
npm run db:reset     # first time or to wipe all data
npm run dev          # starts frontend + API at http://localhost:3000
```

Open **http://localhost:3000** in Chrome or Edge.

Login: `admin` / `admin123`

> Use `localhost` — WebAuthn fingerprint requires it (or HTTPS in production).

## Features

- Register each employee with their own fingerprint (WebAuthn / Windows Hello)
- Check-in/out only succeeds when the registered employee scans their finger
- Admin dashboard, users, attendance, reports
- Clear all data (users, fingerprints, logs, attendance) from Settings

## Requirements

- Node.js 18+
- PostgreSQL (password empty: `postgresql://postgres@localhost:5432/bioaccess`)
- Chrome or Edge on Windows (for Windows Hello fingerprint)
- **Use `localhost`** — WebAuthn requires HTTPS or localhost

## Setup

```bash
cd bioaccess-web
npm install
npm run db:reset    # Clears old Python app data and starts fresh
npm run dev
```

Open **http://localhost:3000**

Login: `admin` / `admin123`

## Workflow

1. **Users** → Register employee → Windows Hello prompts for **their** fingerprint
2. **Attendance** → Select employee → Check In → only **that person's** finger works
3. **Settings** → Clear Everything to wipe all data including logs

## Clear old Python data

```bash
npm run db:reset
```

This truncates users, fingerprints, attendance, activity logs, and recreates admin.
