import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import type { User } from "@/lib/types";

function generateEmployeeId(): Promise<string> {
  const year = new Date().getFullYear();
  return queryOne<{ count: string }>(
    "SELECT COUNT(*) FROM users WHERE employee_id LIKE $1",
    [`EMP-${year}-%`]
  ).then((row) => {
    const count = Number(row?.count ?? 0) + 1;
    return `EMP-${year}-${String(count).padStart(4, "0")}`;
  });
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const userSelect = `
      SELECT u.id, u.employee_id, u.full_name, u.department, u.email, u.phone, u.role, u.created_at,
        EXISTS(SELECT 1 FROM webauthn_credentials w WHERE w.user_id = u.id) AS fingerprint_registered
      FROM users u`;

    let rows: User[];
    if (q) {
      const pattern = `%${q}%`;
      rows = await query<User>(
        `${userSelect}
         WHERE full_name ILIKE $1 OR employee_id ILIKE $1 OR department ILIKE $1 OR email ILIKE $1
         ORDER BY full_name`,
        [pattern]
      );
    } else {
      rows = await query<User>(`${userSelect} ORDER BY full_name`);
    }

    // Keep stored flag in sync when credentials exist
    await query(
      `UPDATE users u SET fingerprint_registered = TRUE
       WHERE fingerprint_registered = FALSE
       AND EXISTS (SELECT 1 FROM webauthn_credentials w WHERE w.user_id = u.id)`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { full_name, department, email, phone, role } = body;

    if (!full_name?.trim() || !department?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name, department, and email are required" }, { status: 400 });
    }

    const employee_id = await generateEmployeeId();
    const user = await queryOne<User>(
      `INSERT INTO users (employee_id, full_name, department, email, phone, role, fingerprint_registered)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING *`,
      [employee_id, full_name.trim(), department.trim(), email.trim().toLowerCase(), phone?.trim() || null, role || "employee"]
    );

    await logActivity(`Registered user ${employee_id} (fingerprint pending)`, {
      userId: user!.id,
      adminId: session.adminId,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: "Email may already exist" }, { status: 400 });
  }
}
