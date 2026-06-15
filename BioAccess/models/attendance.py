"""Attendance domain model."""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Optional


@dataclass
class Attendance:
    id: Optional[int]
    user_id: int
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    work_hours: Optional[Decimal]
    attendance_date: date

    @classmethod
    def from_row(cls, row: dict) -> "Attendance":
        return cls(
            id=row["id"],
            user_id=row["user_id"],
            check_in_time=row.get("check_in_time"),
            check_out_time=row.get("check_out_time"),
            work_hours=row.get("work_hours"),
            attendance_date=row["attendance_date"],
        )
