import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import type { DashboardStats } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireAdmin();
    const total = await queryOne<{ count: string }>("SELECT COUNT(*) FROM users");
    const enrolled = await queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT u.id) FROM users u
       WHERE EXISTS (SELECT 1 FROM webauthn_credentials w WHERE w.user_id = u.id)`
    );
    const present = await queryOne<{ count: string }>(
      "SELECT COUNT(*) FROM attendance WHERE attendance_date = CURRENT_DATE AND check_in_time IS NOT NULL"
    );
    const totalUsers = Number(total?.count ?? 0);
    const presentToday = Number(present?.count ?? 0);
    const enrolledCount = Number(enrolled?.count ?? 0);

    const stats: DashboardStats = {
      total_users: totalUsers,
      present_today: presentToday,
      absent_today: Math.max(totalUsers - presentToday, 0),
      checkins_today: presentToday,
      enrolled_fingerprints: enrolledCount,
      attendance_rate: totalUsers > 0 ? Math.round((presentToday / totalUsers) * 100) : 0,
    };

    const weekly = await query<{ date: string; count: number }>(
      `SELECT attendance_date::text AS date, COUNT(*)::int AS count
       FROM attendance WHERE attendance_date >= CURRENT_DATE - INTERVAL '6 days'
       AND check_in_time IS NOT NULL GROUP BY attendance_date ORDER BY attendance_date`
    );

    const logs = await query(
      `SELECT al.id, al.action, al.timestamp::text,
              u.full_name AS user_name, a.username AS admin_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       LEFT JOIN admins a ON a.id = al.admin_id
       ORDER BY al.timestamp DESC LIMIT 15`
    );

    const todayRecords = await query(
      `SELECT u.full_name, u.employee_id, u.department,
              a.check_in_time::text, a.check_out_time::text, a.work_hours
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE a.attendance_date = CURRENT_DATE
       ORDER BY a.check_in_time DESC NULLS LAST
       LIMIT 10`
    );

    const pendingEnrollment = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM users u
       WHERE NOT EXISTS (SELECT 1 FROM webauthn_credentials w WHERE w.user_id = u.id)`
    );

    return NextResponse.json({
      stats,
      weekly,
      logs,
      todayRecords,
      pendingEnrollment: Number(pendingEnrollment?.count ?? 0),
      adminName: session.username,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
