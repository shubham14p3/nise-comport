import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    // The header must still render when the database is briefly unavailable.
    console.error("[session] lookup failed", error);
    return NextResponse.json({ user: null, degraded: true }, { headers: { "Cache-Control": "private, no-store" } });
  }
}

export async function DELETE() {
  try { await destroySession(); return NextResponse.json({ ok: true }); }
  catch (error) { return apiError(error); }
}
