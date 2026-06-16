import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import type { DashboardStats } from "@/lib/types";

export async function GET() {
  try {
    await requireAdmin();
    const total = await queryOne<{ count: string }>("SELECT COUNT(*) FROM users");
    const present = await queryOne<{ count: string }>(
      "SELECT COUNT(*) FROM attendance WHERE attendance_date = CURRENT_DATE AND check_in_time IS NOT NULL"
    );
    const totalUsers = Number(total?.count ?? 0);
    const presentToday = Number(present?.count ?? 0);

    const stats: DashboardStats = {
      total_users: totalUsers,
      present_today: presentToday,
      absent_today: Math.max(totalUsers - presentToday, 0),
      checkins_today: presentToday,
    };

    const weekly = await query(
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
       ORDER BY al.timestamp DESC LIMIT 20`
    );

    return NextResponse.json({ stats, weekly, logs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
