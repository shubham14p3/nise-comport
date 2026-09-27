import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";

export async function GET() { const user = await getCurrentUser(); return NextResponse.json({ user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } : null }); }
export async function DELETE() { await destroySession(); return NextResponse.json({ ok: true }); }
