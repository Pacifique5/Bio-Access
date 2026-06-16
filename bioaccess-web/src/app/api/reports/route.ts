import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "daily";

    let sql = "";
    const dateCol = "to_char(a.attendance_date, 'YYYY-MM-DD')";
    const hoursCol = "a.work_hours::float";
    if (type === "weekly") {
      sql = `SELECT u.employee_id, u.full_name, u.department, ${dateCol} AS attendance_date,
             a.check_in_time::text, a.check_out_time::text, ${hoursCol} AS work_hours
             FROM attendance a JOIN users u ON u.id = a.user_id
             WHERE a.attendance_date >= CURRENT_DATE - INTERVAL '6 days'
             ORDER BY a.attendance_date DESC, u.full_name`;
    } else if (type === "monthly") {
      sql = `SELECT u.employee_id, u.full_name, u.department, ${dateCol} AS attendance_date,
             a.check_in_time::text, a.check_out_time::text, ${hoursCol} AS work_hours
             FROM attendance a JOIN users u ON u.id = a.user_id
             WHERE date_trunc('month', a.attendance_date) = date_trunc('month', CURRENT_DATE)
             ORDER BY a.attendance_date DESC, u.full_name`;
    } else {
      sql = `SELECT u.employee_id, u.full_name, u.department, ${dateCol} AS attendance_date,
             a.check_in_time::text, a.check_out_time::text, ${hoursCol} AS work_hours
             FROM attendance a JOIN users u ON u.id = a.user_id
             WHERE a.attendance_date = CURRENT_DATE
             ORDER BY u.full_name`;
    }

    const rows = await query(sql);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
