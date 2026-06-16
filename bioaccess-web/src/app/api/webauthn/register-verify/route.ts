import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { verifyRegistration } from "@/lib/webauthn";
import { logActivity } from "@/lib/activity";
import { queryOne } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const { userId, response } = await request.json();
    const result = await verifyRegistration(Number(userId), response);

    const user = await queryOne<{ employee_id: string; full_name: string }>(
      "SELECT employee_id, full_name FROM users WHERE id = $1",
      [userId]
    );

    await logActivity(
      `Fingerprint registered for ${user?.full_name} (${user?.employee_id})`,
      { userId: Number(userId), adminId: session.adminId }
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    const status = msg === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
