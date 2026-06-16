import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getRegistrationOptions } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const options = await getRegistrationOptions(Number(userId));
    return NextResponse.json(options);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    const status = msg === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
