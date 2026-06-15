"""Main application window with sidebar navigation."""

import customtkinter as ctk

from config import APP_TITLE, SIDEBAR_COLOR, PRIMARY_COLOR
from ui.login import LoginFrame
from ui.dashboard import DashboardFrame
from ui.users import UsersFrame
from ui.attendance_ui import AttendanceFrame
from ui.reports import ReportsFrame
from ui.settings import SettingsFrame


class BioAccessApp(ctk.CTk):
    """Root window – login then main shell with pages."""

    NAV_ITEMS = [
        ("Dashboard", "dashboard"),
        ("Users", "users"),
        ("Attendance", "attendance"),
        ("Reports", "reports"),
        ("Settings", "settings"),
    ]

    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1200x720")
        self.minsize(1000, 600)
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.admin = None
        self.pages = {}
        self.current_page = None

        self._show_login()

    def _show_login(self):
        self._clear_window()
        self.login_frame = LoginFrame(self, on_login_success=self._on_login)
        self.login_frame.pack(fill="both", expand=True)

    def _on_login(self, admin):
        self.admin = admin
        self._build_main_shell()

    def _clear_window(self):
        for child in self.winfo_children():
            child.destroy()

    def _build_main_shell(self):
        self._clear_window()

        self.sidebar = ctk.CTkFrame(self, width=220, corner_radius=0, fg_color=SIDEBAR_COLOR)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        ctk.CTkLabel(
            self.sidebar,
            text="BioAccess",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color="white",
        ).pack(pady=(28, 4), padx=20, anchor="w")

        ctk.CTkLabel(
            self.sidebar,
            text=f"Signed in: {self.admin.username}",
            font=ctk.CTkFont(size=11),
            text_color="#94a3b8",
        ).pack(padx=20, anchor="w")

        self.nav_buttons = {}
        for label, key in self.NAV_ITEMS:
            btn = ctk.CTkButton(
                self.sidebar,
                text=label,
                anchor="w",
                fg_color="transparent",
                text_color="white",
                hover_color="#334155",
                command=lambda k=key: self.show_page(k),
            )
            btn.pack(fill="x", padx=12, pady=4)
            self.nav_buttons[key] = btn

        ctk.CTkButton(
            self.sidebar,
            text="Logout",
            fg_color="#ef4444",
            hover_color="#dc2626",
            command=self._logout,
        ).pack(side="bottom", fill="x", padx=12, pady=20)

        self.content = ctk.CTkFrame(self, corner_radius=0, fg_color=("gray95", "gray10"))
        self.content.pack(side="right", fill="both", expand=True)

        self.pages["dashboard"] = DashboardFrame(self.content)
        self.pages["users"] = UsersFrame(self.content, admin=self.admin)
        self.pages["attendance"] = AttendanceFrame(self.content, admin=self.admin)
        self.pages["reports"] = ReportsFrame(self.content)
        self.pages["settings"] = SettingsFrame(self.content, admin=self.admin)

        self.show_page("dashboard")

    def show_page(self, key: str):
        if self.current_page:
            self.current_page.pack_forget()

        for k, btn in self.nav_buttons.items():
            btn.configure(fg_color=PRIMARY_COLOR if k == key else "transparent")

        self.current_page = self.pages[key]
        self.current_page.pack(fill="both", expand=True)

        if hasattr(self.current_page, "refresh"):
            self.current_page.refresh()
        if key == "settings" and hasattr(self.current_page, "refresh_logs"):
            self.current_page.refresh_logs()

    def _logout(self):
        self.admin = None
        self._show_login()
