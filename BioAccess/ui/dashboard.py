"""Dashboard with statistics and weekly chart."""

import customtkinter as ctk
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure

from config import PRIMARY_COLOR
from services.report_service import ReportService
from services.attendance_service import AttendanceService
from services.activity_service import ActivityService


class DashboardFrame(ctk.CTkFrame):
    """Overview page with KPI cards and attendance chart."""

    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self._build_layout()

    def _build_layout(self):
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=24, pady=(24, 12))
        ctk.CTkLabel(
            header,
            text="Dashboard",
            font=ctk.CTkFont(size=28, weight="bold"),
        ).pack(side="left")

        ctk.CTkButton(
            header,
            text="Refresh",
            width=100,
            fg_color=PRIMARY_COLOR,
            command=self.refresh,
        ).pack(side="right")

        self.cards_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.cards_frame.pack(fill="x", padx=24, pady=12)

        content = ctk.CTkFrame(self, fg_color="transparent")
        content.pack(fill="both", expand=True, padx=24, pady=12)

        self.chart_frame = ctk.CTkFrame(content, corner_radius=12)
        self.chart_frame.pack(side="left", fill="both", expand=True, padx=(0, 8))

        ctk.CTkLabel(
            self.chart_frame,
            text="Weekly Attendance",
            font=ctk.CTkFont(size=16, weight="bold"),
        ).pack(anchor="w", padx=16, pady=(16, 8))

        self.canvas_container = ctk.CTkFrame(self.chart_frame, fg_color="transparent")
        self.canvas_container.pack(fill="both", expand=True, padx=8, pady=8)

        self.log_frame = ctk.CTkFrame(content, corner_radius=12, width=320)
        self.log_frame.pack(side="right", fill="y", padx=(8, 0))
        self.log_frame.pack_propagate(False)

        ctk.CTkLabel(
            self.log_frame,
            text="Recent Activity",
            font=ctk.CTkFont(size=16, weight="bold"),
        ).pack(anchor="w", padx=16, pady=(16, 8))

        self.activity_box = ctk.CTkTextbox(self.log_frame, width=300)
        self.activity_box.pack(fill="both", expand=True, padx=12, pady=(0, 12))

        self.refresh()

    def _create_stat_card(self, parent, title: str, value: str, color: str):
        card = ctk.CTkFrame(parent, corner_radius=12, height=100)
        card.pack(side="left", fill="x", expand=True, padx=6)
        ctk.CTkLabel(card, text=title, font=ctk.CTkFont(size=13), text_color="gray").pack(
            anchor="w", padx=16, pady=(16, 0)
        )
        ctk.CTkLabel(
            card,
            text=value,
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=color,
        ).pack(anchor="w", padx=16, pady=(4, 16))

    def refresh(self):
        stats = ReportService.summary_stats()

        for widget in self.cards_frame.winfo_children():
            widget.destroy()

        self._create_stat_card(
            self.cards_frame, "Total Users", str(stats["total_users"]), PRIMARY_COLOR
        )
        self._create_stat_card(
            self.cards_frame, "Present Today", str(stats["present_today"]), "#22c55e"
        )
        self._create_stat_card(
            self.cards_frame, "Absent Today", str(stats["absent_today"]), "#ef4444"
        )
        self._create_stat_card(
            self.cards_frame, "Check-ins Today", str(stats["checkins_today"]), "#8b5cf6"
        )

        for widget in self.canvas_container.winfo_children():
            widget.destroy()

        weekly = AttendanceService.get_weekly_stats()
        dates = [str(r["attendance_date"]) for r in weekly] or ["No data"]
        counts = [r["present_count"] for r in weekly] or [0]

        fig = Figure(figsize=(5, 3), dpi=100)
        fig.patch.set_facecolor("#2b2b2b" if ctk.get_appearance_mode() == "Dark" else "#f8fafc")
        ax = fig.add_subplot(111)
        ax.bar(dates, counts, color=PRIMARY_COLOR)
        ax.set_ylabel("Present")
        ax.tick_params(axis="x", rotation=45, labelsize=8)
        fig.tight_layout()

        canvas = FigureCanvasTkAgg(fig, master=self.canvas_container)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

        self.activity_box.configure(state="normal")
        self.activity_box.delete("1.0", "end")
        logs = ActivityService.get_recent_logs(15)
        for log in logs:
            ts = log["timestamp"].strftime("%m/%d %H:%M") if log["timestamp"] else ""
            self.activity_box.insert("end", f"[{ts}] {log['action']}\n")
        self.activity_box.configure(state="disabled")
