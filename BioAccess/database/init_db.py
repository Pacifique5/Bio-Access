"""Database schema creation and sample data seeding."""

import bcrypt

from database.connection import get_connection, DatabaseConnection


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    work_hours NUMERIC(6, 2),
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
"""


def create_tables() -> None:
    """Apply schema DDL."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(SCHEMA_SQL)
        conn.commit()
    finally:
        DatabaseConnection.release_connection(conn)


def seed_sample_data() -> None:
    """Insert default admin and sample employees if tables are empty."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM admins")
            admin_count = cur.fetchone()[0]

            if admin_count == 0:
                password_hash = bcrypt.hashpw(
                    b"admin123", bcrypt.gensalt()
                ).decode("utf-8")
                cur.execute(
                    """
                    INSERT INTO admins (username, password_hash, role)
                    VALUES (%s, %s, %s)
                    """,
                    ("admin", password_hash, "admin"),
                )

            cur.execute("SELECT COUNT(*) FROM users")
            user_count = cur.fetchone()[0]

            if user_count == 0:
                sample_users = [
                    ("EMP-2026-0001", "Alice Johnson", "Engineering", "alice@bioaccess.com", "555-0101", "employee"),
                    ("EMP-2026-0002", "Bob Smith", "Human Resources", "bob@bioaccess.com", "555-0102", "employee"),
                    ("EMP-2026-0003", "Carol Williams", "Finance", "carol@bioaccess.com", "555-0103", "manager"),
                    ("EMP-2026-0004", "David Brown", "Engineering", "david@bioaccess.com", "555-0104", "employee"),
                    ("EMP-2026-0005", "Eva Martinez", "Operations", "eva@bioaccess.com", "555-0105", "employee"),
                ]
                cur.executemany(
                    """
                    INSERT INTO users (employee_id, full_name, department, email, phone, role)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    sample_users,
                )

        conn.commit()
    finally:
        DatabaseConnection.release_connection(conn)


def initialize_database() -> None:
    """Full database bootstrap."""
    create_tables()
    seed_sample_data()
