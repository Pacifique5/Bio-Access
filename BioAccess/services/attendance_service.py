"""Attendance check-in/out and working-hours logic."""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Tuple

from psycopg2.extras import RealDictCursor

from database.connection import DatabaseConnection, get_connection
from models.attendance import Attendance


class AttendanceService:
    """Records and queries attendance data."""

    @staticmethod
    def _calculate_work_hours(check_in: datetime, check_out: datetime) -> Decimal:
        delta = check_out - check_in
        hours = Decimal(str(round(delta.total_seconds() / 3600, 2)))
        return max(hours, Decimal("0"))

    @staticmethod
    def get_today_record(user_id: int) -> Optional[dict]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT * FROM attendance
                    WHERE user_id = %s AND attendance_date = CURRENT_DATE
                    """,
                    (user_id,),
                )
                return cur.fetchone()
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def check_in(user_id: int) -> Tuple[bool, str]:
        """Record check-in; prevent duplicate for the same day."""
        existing = AttendanceService.get_today_record(user_id)
        if existing and existing["check_in_time"]:
            return False, "Already checked in today."

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                if existing:
                    cur.execute(
                        """
                        UPDATE attendance
                        SET check_in_time = %s
                        WHERE id = %s
                        """,
                        (datetime.now(), existing["id"]),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO attendance (user_id, check_in_time, attendance_date)
                        VALUES (%s, %s, CURRENT_DATE)
                        """,
                        (user_id, datetime.now()),
                    )
            conn.commit()
            return True, "Check-in recorded successfully."
        except Exception as exc:
            conn.rollback()
            return False, str(exc)
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def check_out(user_id: int) -> Tuple[bool, str]:
        """Record check-out and compute work hours."""
        existing = AttendanceService.get_today_record(user_id)
        if not existing or not existing["check_in_time"]:
            return False, "You must check in before checking out."
        if existing["check_out_time"]:
            return False, "Already checked out today."

        check_out_time = datetime.now()
        work_hours = AttendanceService._calculate_work_hours(
            existing["check_in_time"], check_out_time
        )

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE attendance
                    SET check_out_time = %s, work_hours = %s
                    WHERE id = %s
                    """,
                    (check_out_time, work_hours, existing["id"]),
                )
            conn.commit()
            return True, f"Check-out recorded. Work hours: {work_hours}"
        except Exception as exc:
            conn.rollback()
            return False, str(exc)
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def get_all_records(limit: int = 500) -> List[dict]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT a.*, u.employee_id, u.full_name, u.department
                    FROM attendance a
                    JOIN users u ON u.id = a.user_id
                    ORDER BY a.attendance_date DESC, a.check_in_time DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                return cur.fetchall()
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def get_records_by_date_range(start: date, end: date) -> List[dict]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT a.*, u.employee_id, u.full_name, u.department
                    FROM attendance a
                    JOIN users u ON u.id = a.user_id
                    WHERE a.attendance_date BETWEEN %s AND %s
                    ORDER BY a.attendance_date, u.full_name
                    """,
                    (start, end),
                )
                return cur.fetchall()
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def count_checkins_today() -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT COUNT(*) FROM attendance
                    WHERE attendance_date = CURRENT_DATE AND check_in_time IS NOT NULL
                    """
                )
                return cur.fetchone()[0]
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def count_present_today() -> int:
        return AttendanceService.count_checkins_today()

    @staticmethod
    def count_absent_today(total_users: int) -> int:
        present = AttendanceService.count_present_today()
        return max(total_users - present, 0)

    @staticmethod
    def get_weekly_stats() -> List[dict]:
        """Attendance counts per day for the last 7 days."""
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT attendance_date, COUNT(*) AS present_count
                    FROM attendance
                    WHERE attendance_date >= CURRENT_DATE - INTERVAL '6 days'
                      AND check_in_time IS NOT NULL
                    GROUP BY attendance_date
                    ORDER BY attendance_date
                    """
                )
                return cur.fetchall()
        finally:
            DatabaseConnection.release_connection(conn)
