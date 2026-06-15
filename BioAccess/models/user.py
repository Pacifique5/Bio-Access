"""User domain model."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    id: Optional[int]
    employee_id: str
    full_name: str
    department: str
    email: str
    phone: str
    role: str
    created_at: Optional[datetime] = None

    @classmethod
    def from_row(cls, row: dict) -> "User":
        return cls(
            id=row["id"],
            employee_id=row["employee_id"],
            full_name=row["full_name"],
            department=row["department"],
            email=row["email"],
            phone=row.get("phone") or "",
            role=row["role"],
            created_at=row.get("created_at"),
        )
