"""Admin domain model."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Admin:
    id: Optional[int]
    username: str
    password_hash: str
    role: str

    @classmethod
    def from_row(cls, row: dict) -> "Admin":
        return cls(
            id=row["id"],
            username=row["username"],
            password_hash=row["password_hash"],
            role=row["role"],
        )
