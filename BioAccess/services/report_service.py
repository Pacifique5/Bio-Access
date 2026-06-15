"""Report data aggregation for daily, weekly, and monthly views."""

from datetime import date, timedelta
from typing import List

import pandas as pd

from services.attendance_service import AttendanceService
from services.user_service import UserService


class ReportService:
    """Builds report datasets consumed by export modules."""

    @staticmethod
    def daily_report(report_date: date = None) -> pd.DataFrame:
        report_date = report_date or date.today()
        records = AttendanceService.get_records_by_date_range(report_date, report_date)
        return ReportService._to_dataframe(records)

    @staticmethod
    def weekly_report(end_date: date = None) -> pd.DataFrame:
        end_date = end_date or date.today()
        start_date = end_date - timedelta(days=6)
        records = AttendanceService.get_records_by_date_range(start_date, end_date)
        return ReportService._to_dataframe(records)

    @staticmethod
    def monthly_report(year: int = None, month: int = None) -> pd.DataFrame:
        today = date.today()
        year = year or today.year
        month = month or today.month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        records = AttendanceService.get_records_by_date_range(start_date, end_date)
        return ReportService._to_dataframe(records)

    @staticmethod
    def _to_dataframe(records: List[dict]) -> pd.DataFrame:
        if not records:
            return pd.DataFrame(
                columns=[
                    "Employee ID",
                    "Full Name",
                    "Department",
                    "Date",
                    "Check In",
                    "Check Out",
                    "Work Hours",
                ]
            )

        rows = []
        for r in records:
            rows.append(
                {
                    "Employee ID": r["employee_id"],
                    "Full Name": r["full_name"],
                    "Department": r["department"],
                    "Date": r["attendance_date"],
                    "Check In": r["check_in_time"],
                    "Check Out": r["check_out_time"],
                    "Work Hours": float(r["work_hours"]) if r["work_hours"] else None,
                }
            )
        return pd.DataFrame(rows)

    @staticmethod
    def summary_stats() -> dict:
        total_users = UserService.count_users()
        present = AttendanceService.count_present_today()
        return {
            "total_users": total_users,
            "present_today": present,
            "absent_today": max(total_users - present, 0),
            "checkins_today": AttendanceService.count_checkins_today(),
        }
