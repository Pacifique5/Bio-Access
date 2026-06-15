"""Attendance check-in/out with Windows Hello and records view."""

import customtkinter as ctk
from tkinter import messagebox

from attendance.manager import AttendanceManager
from authentication.windows_hello import WindowsHelloAuth
from config import PRIMARY_COLOR
from services.attendance_service import AttendanceService
from services.user_service import UserService


class AttendanceFrame(ctk.CTkFrame):
    """Biometric attendance and history."""

    def __init__(self, master, admin=None, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.admin = admin
        self._build_layout()
        self.refresh_records()
        self._check_hello_status()

    def _build_layout(self):
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=24, pady=(24, 12))
        ctk.CTkLabel(
            header, text="Attendance", font=ctk.CTkFont(size=28, weight="bold")
        ).pack(side="left")

        body = ctk.CTkFrame(self, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=24, pady=12)

        action_panel = ctk.CTkFrame(body, corner_radius=12, width=360)
        action_panel.pack(side="left", fill="y", padx=(0, 12))
        action_panel.pack_propagate(False)

        ctk.CTkLabel(
            action_panel,
            text="Windows Hello Check-in / Out",
            font=ctk.CTkFont(size=16, weight="bold"),
        ).pack(anchor="w", padx=16, pady=(16, 8))

        self.hello_status = ctk.CTkLabel(
            action_panel, text="Checking Windows Hello...", text_color="gray", wraplength=300
        )
        self.hello_status.pack(anchor="w", padx=16, pady=4)

        ctk.CTkLabel(action_panel, text="Select Employee").pack(anchor="w", padx=16, pady=(12, 0))
        users = UserService.get_all_users()
        self.user_options = {f"{u.employee_id} – {u.full_name}": u.employee_id for u in users}
        self.user_menu = ctk.CTkOptionMenu(
            action_panel,
            values=list(self.user_options.keys()) or ["No users registered"],
            width=300,
        )
        self.user_menu.pack(padx=16, pady=8)

        ctk.CTkButton(
            action_panel,
            text="Check In (Fingerprint)",
            height=44,
            fg_color="#22c55e",
            command=self._check_in,
        ).pack(fill="x", padx=16, pady=6)

        ctk.CTkButton(
            action_panel,
            text="Check Out (Fingerprint)",
            height=44,
            fg_color="#f59e0b",
            command=self._check_out,
        ).pack(fill="x", padx=16, pady=6)

        ctk.CTkButton(
            action_panel,
            text="Test Windows Hello",
            height=36,
            fg_color=PRIMARY_COLOR,
            command=self._test_hello,
        ).pack(fill="x", padx=16, pady=6)

        ctk.CTkLabel(
            action_panel,
            text="Place your finger on the scanner\nwhen Windows Hello prompts you.",
            text_color="gray",
            justify="left",
        ).pack(anchor="w", padx=16, pady=16)

        records_panel = ctk.CTkFrame(body, corner_radius=12)
        records_panel.pack(side="right", fill="both", expand=True)

        top = ctk.CTkFrame(records_panel, fg_color="transparent")
        top.pack(fill="x", padx=12, pady=12)
        ctk.CTkLabel(top, text="Attendance Records", font=ctk.CTkFont(size=16, weight="bold")).pack(
            side="left"
        )
        ctk.CTkButton(top, text="Refresh", command=self.refresh_records).pack(side="right")

        self.records_table = ctk.CTkTextbox(records_panel)
        self.records_table.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        self.records_table.configure(state="disabled")

    def _get_selected_employee_id(self) -> str:
        selection = self.user_menu.get()
        return self.user_options.get(selection, "")

    def _check_hello_status(self):
        ok, msg = WindowsHelloAuth.check_availability()
        color = "#22c55e" if ok else "#ef4444"
        self.hello_status.configure(text=msg, text_color=color)

    def _test_hello(self):
        ok, msg = WindowsHelloAuth.verify_user("Test Windows Hello – scan your fingerprint")
        if ok:
            messagebox.showinfo("Windows Hello", msg)
        else:
            messagebox.showwarning("Windows Hello", msg)

    def _check_in(self):
        emp_id = self._get_selected_employee_id()
        if not emp_id:
            messagebox.showwarning("Warning", "Select an employee first.")
            return
        admin_id = self.admin.id if self.admin else None
        ok, msg = AttendanceManager.verify_and_check_in(emp_id, admin_id)
        if ok:
            messagebox.showinfo("Check-in", msg)
            self.refresh_records()
        else:
            messagebox.showerror("Check-in Failed", msg)

    def _check_out(self):
        emp_id = self._get_selected_employee_id()
        if not emp_id:
            messagebox.showwarning("Warning", "Select an employee first.")
            return
        admin_id = self.admin.id if self.admin else None
        ok, msg = AttendanceManager.verify_and_check_out(emp_id, admin_id)
        if ok:
            messagebox.showinfo("Check-out", msg)
            self.refresh_records()
        else:
            messagebox.showerror("Check-out Failed", msg)

    def refresh_records(self):
        records = AttendanceService.get_all_records(200)
        self.records_table.configure(state="normal")
        self.records_table.delete("1.0", "end")
        header = f"{'Date':<12} {'Employee':<14} {'Name':<20} {'In':<18} {'Out':<18} {'Hours'}\n"
        self.records_table.insert("end", header)
        self.records_table.insert("end", "-" * 95 + "\n")
        for r in records:
            cin = r["check_in_time"].strftime("%H:%M:%S") if r["check_in_time"] else "-"
            cout = r["check_out_time"].strftime("%H:%M:%S") if r["check_out_time"] else "-"
            hours = str(r["work_hours"]) if r["work_hours"] else "-"
            line = (
                f"{str(r['attendance_date']):<12} {r['employee_id']:<14} "
                f"{r['full_name'][:18]:<20} {cin:<18} {cout:<18} {hours}\n"
            )
            self.records_table.insert("end", line)
        self.records_table.configure(state="disabled")

        users = UserService.get_all_users()
        self.user_options = {f"{u.employee_id} – {u.full_name}": u.employee_id for u in users}
        if self.user_options:
            self.user_menu.configure(values=list(self.user_options.keys()))
