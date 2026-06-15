"""PostgreSQL database connection manager."""

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

from config import DB_CONFIG


class DatabaseConnection:
    """Thread-safe connection pool for PostgreSQL."""

    _pool = None

    @classmethod
    def initialize(cls, min_conn: int = 1, max_conn: int = 10) -> None:
        """Create the connection pool if it does not exist."""
        if cls._pool is None:
            cls._pool = pool.ThreadedConnectionPool(
                min_conn,
                max_conn,
                host=DB_CONFIG["host"],
                port=DB_CONFIG["port"],
                database=DB_CONFIG["database"],
                user=DB_CONFIG["user"],
                password=DB_CONFIG["password"],
            )

    @classmethod
    def get_connection(cls):
        """Borrow a connection from the pool."""
        if cls._pool is None:
            cls.initialize()
        return cls._pool.getconn()

    @classmethod
    def release_connection(cls, conn) -> None:
        """Return a connection to the pool."""
        if cls._pool is not None and conn is not None:
            cls._pool.putconn(conn)

    @classmethod
    def close_all(cls) -> None:
        """Close every connection in the pool."""
        if cls._pool is not None:
            cls._pool.closeall()
            cls._pool = None


def get_connection():
    """Convenience wrapper that returns a dict-cursor connection."""
    conn = DatabaseConnection.get_connection()
    conn.autocommit = False
    return conn


def execute_query(query: str, params=None, fetch: str = "all"):
    """
    Run a query and return results.

    fetch: 'all' | 'one' | 'none'
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch == "all":
                result = cur.fetchall()
            elif fetch == "one":
                result = cur.fetchone()
            else:
                result = None
        conn.commit()
        return result
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            DatabaseConnection.release_connection(conn)
