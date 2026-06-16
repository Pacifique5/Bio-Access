import { query } from "./db";

export async function logActivity(
  action: string,
  opts?: { userId?: number; adminId?: number }
) {
  await query(
    "INSERT INTO activity_logs (user_id, admin_id, action) VALUES ($1, $2, $3)",
    [opts?.userId ?? null, opts?.adminId ?? null, action]
  );
}
