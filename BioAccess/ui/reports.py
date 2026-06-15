"""Reports generation and export."""

import customtkinter as ctk
from datetime import date
from tkinter import messagebox
import os

from config import PRIMARY_COLOR, EXPORTS_DIR
from reports.excel_export import export_to_excel
from reports.pdf_export import export_to_pdf
from services.report_service import ReportService


class ReportsFrame(ctk.CTkFrame):
    """Daily, weekly, monthly reports with Excel/PDF export."""

    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.current_df = None
        self.current_report_name = "report"
        self._build_layout()

    def _build_layout(self):
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=24, pady=(24, 12))
        ctk.CTkLabel(header, text="Reports", font=ctk.CTkFont(size=28, weight="bold")).pack(
            side="left"
        )

        controls = ctk.CTkFrame(self, corner_radius=12)
        controls.pack(fill="x", padx=24, pady=12)

        ctk.CTkLabel(controls, text="Report Type").grid(row=0, column=0, padx=12, pady=12)
        self.report_type = ctk.CTkOptionMenu(
            controls, values=["Daily", "Weekly", "Monthly"], width=160
        )
        self.report_type.grid(row=0, column=1, padx=8, pady=12)

        ctk.CTkButton(
            controls, text="Generate", fg_color=PRIMARY_COLOR, command=self._generate
        ).grid(row=0, column=2, padx=8, pady=12)

        ctk.CTkButton(controls, text="Export Excel", command=self._export_excel).grid(
            row=0, column=3, padx=8, pady=12
        )
        ctk.CTkButton(controls, text="Export PDF", command=self._export_pdf).grid(
            row=0, column=4, padx=8, pady=12
        )

        ctk.CTkButton(
            controls, text="Open Exports Folder", command=self._open_exports
        ).grid(row=0, column=5, padx=8, pady=12)

        self.preview = ctk.CTkTextbox(self)
        self.preview.pack(fill="both", expand=True, padx=24, pady=12)
        self.preview.configure(state="disabled")

    def _generate(self):
        rtype = self.report_type.get()
        if rtype == "Daily":
            self.current_df = ReportService.daily_report()
            self.current_report_name = "daily_report"
        elif rtype == "Weekly":
            self.current_df = ReportService.weekly_report()
            self.current_report_name = "weekly_report"
        else:
            self.current_df = ReportService.monthly_report()
            self.current_report_name = "monthly_report"

        self.preview.configure(state="normal")
        self.preview.delete("1.0", "end")
        if self.current_df.empty:
            self.preview.insert("end", "No records for the selected period.\n")
        else:
            self.preview.insert("end", self.current_df.to_string(index=False))
        self.preview.configure(state="disabled")

    def _export_excel(self):
        if self.current_df is None:
            messagebox.showwarning("Warning", "Generate a report first.")
            return
        path = export_to_excel(self.current_df, self.current_report_name)
        messagebox.showinfo("Exported", f"Saved to:\n{path}")

    def _export_pdf(self):
        if self.current_df is None:
            messagebox.showwarning("Warning", "Generate a report first.")
            return
        path = export_to_pdf(self.current_df, self.current_report_name)
        messagebox.showinfo("Exported", f"Saved to:\n{path}")

    def _open_exports(self):
        os.startfile(EXPORTS_DIR)
