"""User CRUD and search operations."""

import re
from datetime import datetime
from typing import List, Optional

from psycopg2.extras import RealDictCursor

from database.connection import DatabaseConnection, get_connection
from models.user import User


class UserService:
    """Employee / student management."""

    EMAIL_PATTERN = re.compile(r"^[\w.\-]+@[\w.\-]+\.\w+$")

    @staticmethod
    def generate_employee_id() -> str:
        """Create a unique ID like EMP-2026-0007."""
        year = datetime.now().year
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT COUNT(*) FROM users
                    WHERE employee_id LIKE %s
                    """,
                    (f"EMP-{year}-%",),
                )
                count = cur.fetchone()[0] + 1
            return f"EMP-{year}-{count:04d}"
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def validate_user_data(
        full_name: str,
        department: str,
        email: str,
        phone: str,
        role: str,
    ) -> Optional[str]:
        """Return an error message or None if valid."""
        if not full_name.strip():
            return "Full name is required."
        if not department.strip():
            return "Department is required."
        if not UserService.EMAIL_PATTERN.match(email.strip()):
            return "Invalid email address."
        if not role.strip():
            return "Role is required."
        return None

    @staticmethod
    def create_user(
        full_name: str,
        department: str,
        email: str,
        phone: str,
        role: str,
    ) -> User:
        error = UserService.validate_user_data(full_name, department, email, phone, role)
        if error:
            raise ValueError(error)

        employee_id = UserService.generate_employee_id()
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO users (employee_id, full_name, department, email, phone, role)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        employee_id,
                        full_name.strip(),
                        department.strip(),
                        email.strip().lower(),
                        phone.strip(),
                        role.strip(),
                    ),
                )
                row = cur.fetchone()
            conn.commit()
            return User.from_row(row)
        except Exception:
            conn.rollback()
            raise
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def get_all_users() -> List[User]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM users ORDER BY full_name")
                return [User.from_row(r) for r in cur.fetchall()]
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def search_users(query: str) -> List[User]:
        conn = get_connection()
        try:
            pattern = f"%{query.strip()}%"
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT * FROM users
                    WHERE full_name ILIKE %s
                       OR employee_id ILIKE %s
                       OR department ILIKE %s
                       OR email ILIKE %s
                    ORDER BY full_name
                    """,
                    (pattern, pattern, pattern, pattern),
                )
                return [User.from_row(r) for r in cur.fetchall()]
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                row = cur.fetchone()
            return User.from_row(row) if row else None
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def get_user_by_employee_id(employee_id: str) -> Optional[User]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT * FROM users WHERE employee_id = %s",
                    (employee_id.strip().upper(),),
                )
                row = cur.fetchone()
            return User.from_row(row) if row else None
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def update_user(
        user_id: int,
        full_name: str,
        department: str,
        email: str,
        phone: str,
        role: str,
    ) -> User:
        error = UserService.validate_user_data(full_name, department, email, phone, role)
        if error:
            raise ValueError(error)

        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    UPDATE users
                    SET full_name = %s, department = %s, email = %s, phone = %s, role = %s
                    WHERE id = %s
                    RETURNING *
                    """,
                    (
                        full_name.strip(),
                        department.strip(),
                        email.strip().lower(),
                        phone.strip(),
                        role.strip(),
                        user_id,
                    ),
                )
                row = cur.fetchone()
                if not row:
                    raise ValueError("User not found.")
            conn.commit()
            return User.from_row(row)
        except Exception:
            conn.rollback()
            raise
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def delete_user(user_id: int) -> bool:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
                deleted = cur.rowcount > 0
            conn.commit()
            return deleted
        except Exception:
            conn.rollback()
            raise
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def count_users() -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM users")
                return cur.fetchone()[0]
        finally:
            DatabaseConnection.release_connection(conn)
