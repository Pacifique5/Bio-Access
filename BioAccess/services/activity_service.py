"""Activity and authentication history logging."""

from typing import List, Optional

from psycopg2.extras import RealDictCursor

from database.connection import DatabaseConnection, get_connection


class ActivityService:
    """Persists audit trail entries."""

    @staticmethod
    def log(
        action: str,
        user_id: Optional[int] = None,
        admin_id: Optional[int] = None,
    ) -> None:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO activity_logs (user_id, admin_id, action)
                    VALUES (%s, %s, %s)
                    """,
                    (user_id, admin_id, action),
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def get_recent_logs(limit: int = 100) -> List[dict]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT al.*, u.full_name AS user_name, a.username AS admin_name
                    FROM activity_logs al
                    LEFT JOIN users u ON u.id = al.user_id
                    LEFT JOIN admins a ON a.id = al.admin_id
                    ORDER BY al.timestamp DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                return cur.fetchall()
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def get_auth_history(limit: int = 50) -> List[dict]:
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT al.*, u.full_name AS user_name, u.employee_id
                    FROM activity_logs al
                    LEFT JOIN users u ON u.id = al.user_id
                    WHERE al.action ILIKE '%%Windows Hello%%'
                       OR al.action ILIKE '%%check-in%%'
                       OR al.action ILIKE '%%check-out%%'
                    ORDER BY al.timestamp DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                return cur.fetchall()
        finally:
            DatabaseConnection.release_connection(conn)
