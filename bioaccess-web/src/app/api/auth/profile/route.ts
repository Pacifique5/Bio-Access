import { NextResponse } from "next/server";
import { authenticateAdmin, hashPassword } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireAdmin();
    return NextResponse.json({
      username: session.username ?? "",
      role: session.role ?? "admin",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAdmin();
    const { username, currentPassword, newPassword } = await request.json();

    const nextUsername = String(username ?? "").trim();
    if (!nextUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const admin = await queryOne<{ id: number }>("SELECT id FROM admins WHERE id = $1", [
      session.adminId,
    ]);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (!currentPassword || String(currentPassword).length < 1) {
      return NextResponse.json(
        { error: "Current password is required to save profile changes" },
        { status: 400 }
      );
    }

    const verified = await authenticateAdmin(session.username || "", String(currentPassword));
    if (!verified) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    if (newPassword && String(newPassword).length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (newPassword) {
      const passwordHash = await hashPassword(String(newPassword));
      await queryOne(
        "UPDATE admins SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id",
        [nextUsername, passwordHash, session.adminId]
      );
    } else {
      await queryOne("UPDATE admins SET username = $1 WHERE id = $2 RETURNING id", [
        nextUsername,
        session.adminId,
      ]);
    }

    session.username = nextUsername;
    await session.save();

    return NextResponse.json({ message: "Profile updated successfully", username: nextUsername });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
