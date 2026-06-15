"""Attendance check-in/out with Windows Hello and records view."""

import customtkinter as ctk

from attendance.manager import AttendanceManager
from authentication.windows_hello import WindowsHelloAuth
from config import PRIMARY_COLOR
from services.attendance_service import AttendanceService
from services.user_service import UserService
from ui.components import show_message


class AttendanceFrame(ctk.CTkFrame):
    def __init__(self, master, admin):
        super().__init__(master, fg_color="transparent")
        self.admin = admin
        self._build()
        self.refresh_records()

    def _build(self):
        ctk.CTkLabel(
            self,
            text="Attendance",
            font=ctk.CTkFont(size=26, weight="bold"),
        ).pack(anchor="w", pady=(0, 16))

        # Windows Hello status
        available, msg = WindowsHelloAuth.check_availability()
        status_color = "#16a34a" if available else "#dc2626"
        ctk.CTkLabel(
            self,
            text=f"Windows Hello: {msg}",
            text_color=status_color,
            font=ctk.CTkFont(size=12),
        ).pack(anchor="w", pady=(0, 12))

        action_frame = ctk.CTkFrame(self, corner_radius=12)
        action_frame.pack(fill="x", pady=(0, 16))

        ctk.CTkLabel(
            action_frame,
            text="Record Attendance (Fingerprint / Face / PIN)",
            font=ctk.CTkFont(size=15, weight="bold"),
        ).pack(anchor="w", padx=16, pady=(16, 8))

        row = ctk.CTkFrame(action_frame, fg_color="transparent")
        row.pack(fill="x", padx=16, pady=(0, 16))

        ctk.CTkLabel(row, text="Employee ID:").pack(side="left", padx=(0, 8))
        self.employee_entry = ctk.CTkEntry(row, width=180, placeholder_text="EMP-2026-0001")
        self.employee_entry.pack(side="left", padx=4)

        # Quick-select dropdown
        users = UserService.get_all_users()
        self.user_map = {f"{u.employee_id} - {u.full_name}": u.employee_id for u in users}
        self.user_dropdown = ctk.CTkComboBox(
            row,
            values=list(self.user_map.keys()) or ["No users"],
            width=260,
            command=self._on_user_select,
        )
        self.user_dropdown.pack(side="left", padx=12)

        ctk.CTkButton(
            row,
            text="Check In",
            fg_color="#16a34a",
            width=110,
            command=lambda: self._do_attendance("in"),
        ).pack(side="left", padx=4)
        ctk.CTkButton(
            row,
            text="Check Out",
            fg_color=PRIMARY_COLOR,
            width=110,
            command=lambda: self._do_attendance("out"),
        ).pack(side="left", padx=4)

        records_frame = ctk.CTkFrame(self, corner_radius=12)
        records_frame.pack(fill="both", expand=True)

        header = ctk.CTkFrame(records_frame, fg_color="transparent")
        header.pack(fill="x", padx=16, pady=12)
        ctk.CTkLabel(header, text="Attendance Records", font=ctk.CTkFont(size=16, weight="bold")).pack(
            side="left"
        )
        ctk.CTkButton(header, text="Refresh", width=80, command=self.refresh_records).pack(side="right")

        self.records_list = ctk.CTkScrollableFrame(records_frame)
        self.records_list.pack(fill="both", expand=True, padx=12, pady=(0, 12))

    def _on_user_select(self, choice):
        if choice in self.user_map:
            self.employee_entry.delete(0, "end")
            self.employee_entry.insert(0, self.user_map[choice])

    def _do_attendance(self, action: str):
        employee_id = self.employee_entry.get().strip().upper()
        if not employee_id:
            show_message(self, "Error", "Enter or select an employee ID.", is_error=True)
            return

        if action == "in":
            success, msg = AttendanceManager.verify_and_check_in(employee_id, self.admin.id)
        else:
            success, msg = AttendanceManager.verify_and_check_out(employee_id, self.admin.id)

        show_message(self, "Attendance", msg, is_error=not success)
        if success:
            self.refresh_records()

    def refresh_records(self):
        for w in self.records_list.winfo_children():
            w.destroy()

        header = ctk.CTkLabel(
            self.records_list,
            text=f"{'Date':<12} {'Employee':<22} {'Check In':<18} {'Check Out':<18} {'Hours':<8}",
            font=ctk.CTkFont(size=11, weight="bold"),
            anchor="w",
        )
        header.pack(fill="x", pady=(0, 6))

        for rec in AttendanceService.get_all_records(100):
            ci = rec["check_in_time"].strftime("%H:%M:%S") if rec["check_in_time"] else "—"
            co = rec["check_out_time"].strftime("%H:%M:%S") if rec["check_out_time"] else "—"
            hrs = str(rec["work_hours"]) if rec["work_hours"] else "—"
            dt = str(rec["attendance_date"])
            line = f"{dt:<12} {rec['full_name'][:20]:<22} {ci:<18} {co:<18} {hrs:<8}"
            ctk.CTkLabel(
                self.records_list,
                text=line,
                font=ctk.CTkFont(family="Consolas", size=11),
                anchor="w",
            ).pack(fill="x", pady=1)
