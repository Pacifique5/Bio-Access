import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const admin = await authenticateAdmin(username, password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getSession();
    session.adminId = admin.id;
    session.username = admin.username;
    session.role = admin.role;
    session.isLoggedIn = true;
    await session.save();

    await logActivity(`Admin login: ${admin.username}`, { adminId: admin.id });
    return NextResponse.json({ username: admin.username, role: admin.role });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
