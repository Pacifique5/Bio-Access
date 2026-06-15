"""Application configuration constants."""

import os

# PostgreSQL connection settings (password is empty per project spec)
DB_CONFIG = {
    "host": os.getenv("BIOACCESS_DB_HOST", "localhost"),
    "port": int(os.getenv("BIOACCESS_DB_PORT", "5432")),
    "database": os.getenv("BIOACCESS_DB_NAME", "bioaccess"),
    "user": os.getenv("BIOACCESS_DB_USER", "postgres"),
    "password": os.getenv("BIOACCESS_DB_PASSWORD", ""),
}

# UI theme
APP_TITLE = "BioAccess – Fingerprint Attendance System"
APP_VERSION = "1.0.0"
PRIMARY_COLOR = "#1a73e8"
SIDEBAR_COLOR = "#1e293b"
ACCENT_COLOR = "#0ea5e9"

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

os.makedirs(EXPORTS_DIR, exist_ok=True)
