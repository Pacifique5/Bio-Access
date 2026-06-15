"""Activity log domain model."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ActivityLog:
    id: Optional[int]
    user_id: Optional[int]
    admin_id: Optional[int]
    action: str
    timestamp: Optional[datetime] = None

    @classmethod
    def from_row(cls, row: dict) -> "ActivityLog":
        return cls(
            id=row["id"],
            user_id=row.get("user_id"),
            admin_id=row.get("admin_id"),
            action=row["action"],
            timestamp=row.get("timestamp"),
        )
