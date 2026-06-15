"""Login screen for admin authentication."""

import customtkinter as ctk

from config import APP_TITLE, PRIMARY_COLOR
from services.auth_service import AuthService
from services.activity_service import ActivityService


class LoginFrame(ctk.CTkFrame):
    """Admin login with username and password."""

    def __init__(self, master, on_login_success, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.on_login_success = on_login_success

        container = ctk.CTkFrame(self, corner_radius=16, width=420, height=480)
        container.place(relx=0.5, rely=0.5, anchor="center")
        container.pack_propagate(False)

        ctk.CTkLabel(
            container,
            text="BioAccess",
            font=ctk.CTkFont(size=32, weight="bold"),
            text_color=PRIMARY_COLOR,
        ).pack(pady=(40, 4))

        ctk.CTkLabel(
            container,
            text="Fingerprint Attendance System",
            font=ctk.CTkFont(size=14),
            text_color="gray",
        ).pack(pady=(0, 30))

        self.username_entry = ctk.CTkEntry(
            container, placeholder_text="Username", width=300, height=42
        )
        self.username_entry.pack(pady=8)
        self.username_entry.insert(0, "admin")

        self.password_entry = ctk.CTkEntry(
            container, placeholder_text="Password", show="*", width=300, height=42
        )
        self.password_entry.pack(pady=8)
        self.password_entry.insert(0, "admin123")

        self.error_label = ctk.CTkLabel(container, text="", text_color="#ef4444")
        self.error_label.pack(pady=(4, 0))

        ctk.CTkButton(
            container,
            text="Sign In",
            width=300,
            height=42,
            fg_color=PRIMARY_COLOR,
            command=self._attempt_login,
        ).pack(pady=20)

        ctk.CTkLabel(
            container,
            text="Default: admin / admin123",
            font=ctk.CTkFont(size=11),
            text_color="gray",
        ).pack()

        self.password_entry.bind("<Return>", lambda e: self._attempt_login())

    def _attempt_login(self):
        username = self.username_entry.get().strip()
        password = self.password_entry.get()

        if not username or not password:
            self.error_label.configure(text="Please enter username and password.")
            return

        admin = AuthService.authenticate(username, password)
        if admin:
            ActivityService.log(f"Admin login: {admin.username}", admin_id=admin.id)
            self.error_label.configure(text="")
            self.on_login_success(admin)
        else:
            self.error_label.configure(text="Invalid username or password.")
