import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { query, queryOne } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const user = await queryOne(
      `UPDATE users SET full_name=$1, department=$2, email=$3, phone=$4, role=$5
       WHERE id=$6 RETURNING *`,
      [body.full_name, body.department, body.email, body.phone, body.role, id]
    );

    await logActivity(`Updated user id=${id}`, { userId: Number(id), adminId: session.adminId });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    await query("DELETE FROM users WHERE id = $1", [id]);
    await logActivity(`Deleted user id=${id}`, { adminId: session.adminId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 400 });
  }
}
