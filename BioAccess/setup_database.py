"""
Create the PostgreSQL database and initialize BioAccess schema.

Run once before first launch:
    python setup_database.py
"""

import sys

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from config import DB_CONFIG


def create_database():
    """Create 'bioaccess' database if it does not exist."""
    conn = psycopg2.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        database="postgres",
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (DB_CONFIG["database"],),
            )
            if cur.fetchone():
                print(f"Database '{DB_CONFIG['database']}' already exists.")
            else:
                cur.execute(f"CREATE DATABASE {DB_CONFIG['database']}")
                print(f"Database '{DB_CONFIG['database']}' created successfully.")
    finally:
        conn.close()


def init_schema():
    from database.connection import DatabaseConnection
    from database.init_db import initialize_database

    DatabaseConnection.initialize()
    initialize_database()
    DatabaseConnection.close_all()
    print("Tables and sample data initialized.")


if __name__ == "__main__":
    try:
        create_database()
        init_schema()
        print("\nSetup complete! Run the app with: python main.py")
    except psycopg2.OperationalError as exc:
        print(f"PostgreSQL connection failed: {exc}")
        print("\nMake sure PostgreSQL is installed and running.")
        print("Default connection: localhost:5432, user=postgres, password=(empty)")
        sys.exit(1)
