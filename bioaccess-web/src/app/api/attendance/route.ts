import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { verifyAuthentication } from "@/lib/webauthn";
import type { AttendanceRecord } from "@/lib/types";

export async function GET() {
  try {
    await requireAdmin();
    const records = await query<AttendanceRecord>(
      `SELECT a.*, u.employee_id, u.full_name, u.department
       FROM attendance a JOIN users u ON u.id = a.user_id
       ORDER BY a.attendance_date DESC, a.check_in_time DESC LIMIT 200`
    );
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, employeeId, userId, authResponse } = body;

    // Verify fingerprint belongs to this specific employee
    await verifyAuthentication(Number(userId), authResponse);

    const user = await queryOne<{ id: number; full_name: string; employee_id: string }>(
      "SELECT id, full_name, employee_id FROM users WHERE id = $1 AND employee_id = $2",
      [userId, employeeId.trim().toUpperCase()]
    );
    if (!user) {
      return NextResponse.json({ error: "Employee mismatch" }, { status: 403 });
    }

    if (action === "check-in") {
      const existing = await queryOne(
        "SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = CURRENT_DATE",
        [user.id]
      );
      if (existing?.check_in_time) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
      }

      if (existing) {
        await query(
          "UPDATE attendance SET check_in_time = NOW() WHERE id = $1",
          [existing.id]
        );
      } else {
        await query(
          "INSERT INTO attendance (user_id, check_in_time, attendance_date) VALUES ($1, NOW(), CURRENT_DATE)",
          [user.id]
        );
      }

      await logActivity(`Check-in verified: ${user.full_name} (${user.employee_id})`, {
        userId: user.id,
      });
      return NextResponse.json({ message: "Check-in recorded successfully" });
    }

    if (action === "check-out") {
      const existing = await queryOne<{
        id: number;
        check_in_time: string;
        check_out_time: string | null;
      }>(
        "SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = CURRENT_DATE",
        [user.id]
      );

      if (!existing?.check_in_time) {
        return NextResponse.json({ error: "Must check in first" }, { status: 400 });
      }
      if (existing.check_out_time) {
        return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
      }

      await query(
        `UPDATE attendance SET check_out_time = NOW(),
         work_hours = ROUND(EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 3600, 2)
         WHERE id = $1`,
        [existing.id]
      );

      await logActivity(`Check-out verified: ${user.full_name} (${user.employee_id})`, {
        userId: user.id,
      });
      return NextResponse.json({ message: "Check-out recorded successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Attendance failed";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
