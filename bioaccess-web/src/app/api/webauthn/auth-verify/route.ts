import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const { userId, response } = await request.json();
    const result = await verifyAuthentication(Number(userId), response);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
