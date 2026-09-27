import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { serviceRequests, storedFiles } from "@/db/schema";
import { privateStoragePath } from "@/lib/storage";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentUser();
  if (!staff || !["admin", "staff"].includes(staff.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  const { id } = await params;
  const [file] = await db.select({ objectKey: storedFiles.objectKey, mimeType: storedFiles.mimeType }).from(storedFiles).innerJoin(serviceRequests, eq(storedFiles.requestId, serviceRequests.id)).where(eq(serviceRequests.id, id)).limit(1);
  if (!file) return NextResponse.json({ error: "No supporting document is attached to this request." }, { status: 404 });
  try {
    const bytes = await readFile(privateStoragePath(file.objectKey));
    return new NextResponse(bytes, { headers: { "Content-Type": file.mimeType, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "The supporting document is no longer available." }, { status: 404 }); }
}
