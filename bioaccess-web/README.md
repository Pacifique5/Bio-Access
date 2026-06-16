# BioAccess Web

Next.js fingerprint attendance system with **per-user** Windows Hello registration via WebAuthn.

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
