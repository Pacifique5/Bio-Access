"""
BioAccess – Fingerprint-Based Employee Attendance System
Entry point for the desktop application.
"""

import sys
import os

# Ensure project root is on the path when running as script
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import DatabaseConnection
from database.init_db import initialize_database
from ui.app import BioAccessApp


def main():
    try:
        DatabaseConnection.initialize()
        initialize_database()
        app = BioAccessApp()
        app.mainloop()
    except Exception as exc:
        import tkinter as tk
        from tkinter import messagebox

        root = tk.Tk()
        root.withdraw()
        messagebox.showerror(
            "BioAccess Startup Error",
            f"Could not start the application.\n\n{exc}\n\n"
            "Ensure PostgreSQL is running and the 'bioaccess' database exists.\n"
            "Run: python setup_database.py",
        )
        sys.exit(1)
    finally:
        DatabaseConnection.close_all()


if __name__ == "__main__":
    main()
