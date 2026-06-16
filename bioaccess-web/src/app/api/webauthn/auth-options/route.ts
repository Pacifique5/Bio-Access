import { NextResponse } from "next/server";
import { getAuthenticationOptions } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json();
    if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });
    const result = await getAuthenticationOptions(employeeId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
