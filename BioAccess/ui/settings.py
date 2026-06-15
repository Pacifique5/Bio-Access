"""Settings, activity logs, and password change."""

import customtkinter as ctk
from tkinter import messagebox

from authentication.windows_hello import WindowsHelloAuth
from config import PRIMARY_COLOR, APP_VERSION
from services.activity_service import ActivityService
from services.auth_service import AuthService


class SettingsFrame(ctk.CTkFrame):
    """App settings, Windows Hello status, and security."""

    def __init__(self, master, admin=None, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.admin = admin
        self._build_layout()

    def _build_layout(self):
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=24, pady=(24, 12))
        ctk.CTkLabel(header, text="Settings", font=ctk.CTkFont(size=28, weight="bold")).pack(
            side="left"
        )

        content = ctk.CTkFrame(self, fg_color="transparent")
        content.pack(fill="both", expand=True, padx=24, pady=12)

        left = ctk.CTkFrame(content, corner_radius=12, width=360)
        left.pack(side="left", fill="y", padx=(0, 12))
        left.pack_propagate(False)

        ctk.CTkLabel(left, text="Windows Hello", font=ctk.CTkFont(size=16, weight="bold")).pack(
            anchor="w", padx=16, pady=(16, 8)
        )
        ok, msg = WindowsHelloAuth.check_availability()
        ctk.CTkLabel(
            left,
            text=msg,
            text_color="#22c55e" if ok else "#ef4444",
            wraplength=300,
            justify="left",
        ).pack(anchor="w", padx=16, pady=4)

        ctk.CTkButton(
            left,
            text="Test Biometric",
            fg_color=PRIMARY_COLOR,
            command=self._test_biometric,
        ).pack(padx=16, pady=12, anchor="w")

        ctk.CTkLabel(left, text=f"Version {APP_VERSION}", text_color="gray").pack(
            anchor="w", padx=16, pady=8
        )

        ctk.CTkLabel(left, text="Change Password", font=ctk.CTkFont(size=16, weight="bold")).pack(
            anchor="w", padx=16, pady=(24, 8)
        )
        self.old_pw = ctk.CTkEntry(left, placeholder_text="Current password", show="*", width=280)
        self.old_pw.pack(padx=16, pady=4)
        self.new_pw = ctk.CTkEntry(left, placeholder_text="New password", show="*", width=280)
        self.new_pw.pack(padx=16, pady=4)
        ctk.CTkButton(left, text="Update Password", command=self._change_password).pack(
            padx=16, pady=12, anchor="w"
        )

        right = ctk.CTkFrame(content, corner_radius=12)
        right.pack(side="right", fill="both", expand=True)

        tabs = ctk.CTkTabview(right)
        tabs.pack(fill="both", expand=True, padx=12, pady=12)

        activity_tab = tabs.add("Activity Logs")
        auth_tab = tabs.add("Auth History")

        self.activity_log = ctk.CTkTextbox(activity_tab)
        self.activity_log.pack(fill="both", expand=True, padx=8, pady=8)

        self.auth_log = ctk.CTkTextbox(auth_tab)
        self.auth_log.pack(fill="both", expand=True, padx=8, pady=8)

        self.refresh_logs()

    def _test_biometric(self):
        ok, msg = WindowsHelloAuth.verify_user("Settings – verify Windows Hello")
        messagebox.showinfo("Result", msg)

    def _change_password(self):
        if not self.admin:
            messagebox.showwarning("Warning", "Not logged in.")
            return
        if AuthService.change_password(
            self.admin.id, self.old_pw.get(), self.new_pw.get()
        ):
            ActivityService.log("Password changed", admin_id=self.admin.id)
            messagebox.showinfo("Success", "Password updated.")
            self.old_pw.delete(0, "end")
            self.new_pw.delete(0, "end")
        else:
            messagebox.showerror("Error", "Current password is incorrect.")

    def refresh_logs(self):
        for box, fetcher in (
            (self.activity_log, ActivityService.get_recent_logs),
            (self.auth_log, ActivityService.get_auth_history),
        ):
            box.configure(state="normal")
            box.delete("1.0", "end")
            for row in fetcher(80):
                ts = row["timestamp"].strftime("%Y-%m-%d %H:%M") if row["timestamp"] else ""
                box.insert("end", f"[{ts}] {row['action']}\n")
            box.configure(state="disabled")
