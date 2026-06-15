# BioAccess – Installation Guide

Fingerprint-based employee attendance system using **Windows Hello** (fingerprint, face, or PIN) and **PostgreSQL**.

## Requirements

- Windows 10/11 with Windows Hello configured (fingerprint recommended)
- Python 3.10+
- PostgreSQL (password: empty, per project config)

## Quick Start

### 1. Install dependencies

```bash
cd BioAccess
pip install -r requirements.txt
```

### 2. Set up PostgreSQL

Ensure PostgreSQL is running. Default settings in `config.py`:

| Setting  | Value      |
|----------|------------|
| Host     | localhost  |
| Port     | 5432       |
| Database | bioaccess  |
| User     | postgres   |
| Password | *(empty)*  |

Create the database and tables:

```bash
python setup_database.py
```

### 3. Run the application

```bash
python main.py
```

### 4. Login

| Field    | Value     |
|----------|-----------|
| Username | `admin`   |
| Password | `admin123`|

## Testing fingerprint on your PC

1. Open **Settings → Accounts → Sign-in options** and enroll **Windows Hello** (fingerprint).
2. In BioAccess, go to **Attendance**.
3. Confirm the green “Windows Hello is available” status.
4. Click **Test Windows Hello** to verify your fingerprint works.
5. Select an employee (sample data included), then **Check In (Fingerprint)**.
6. When the Windows Hello prompt appears, scan your fingerprint.

## Features

- User management (register, edit, delete, search)
- Check-in / check-out with Windows Hello verification
- Dashboard with live statistics and weekly chart
- Daily, weekly, monthly reports
- Export to Excel and PDF
- Admin login with bcrypt password hashing
- Activity logs and authentication history

## Project Structure

```
BioAccess/
├── main.py              # Application entry point
├── setup_database.py    # One-time DB setup
├── config.py            # Configuration
├── database/            # Connection and schema
├── models/              # Domain models
├── services/            # Business logic
├── authentication/      # bcrypt + Windows Hello
├── attendance/          # Biometric attendance flow
├── reports/             # Excel and PDF export
├── ui/                  # CustomTkinter interface
├── exports/             # Generated reports
└── requirements.txt
```

## Troubleshooting

**PostgreSQL connection failed**  
Start the PostgreSQL service and run `python setup_database.py` again.

**Windows Hello not available**  
Enroll a fingerprint, face, or PIN under Windows Sign-in options.

**Hello prompt behind the app window**  
Click the app title bar, then retry, or use Alt+Tab to find the prompt.

**Duplicate check-in**  
Each employee can only check in once per day.

## Sample Employees

| Employee ID   | Name            | Department   |
|---------------|-----------------|--------------|
| EMP-2026-0001 | Alice Johnson   | Engineering  |
| EMP-2026-0002 | Bob Smith       | HR           |
| EMP-2026-0003 | Carol Williams  | Finance      |
| EMP-2026-0004 | David Brown     | Engineering  |
| EMP-2026-0005 | Eva Martinez    | Operations   |
