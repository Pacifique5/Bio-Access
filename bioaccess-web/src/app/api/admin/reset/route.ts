import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { RESET_SQL, SCHEMA_SQL } from "@/lib/schema";
import { hashPassword } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST() {
  try {
    const session = await requireAdmin();
    await pool.query(SCHEMA_SQL);
    await pool.query(RESET_SQL);

    const hash = await hashPassword("admin123");
    await pool.query(
      "INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)",
      ["admin", hash, "admin"]
    );

    return NextResponse.json({
      message: "All data cleared — users, fingerprints, attendance, and logs.",
      clearedBy: session.username,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
