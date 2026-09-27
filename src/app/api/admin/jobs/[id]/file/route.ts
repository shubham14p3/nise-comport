import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { printJobs, storedFiles } from "@/db/schema";
import { privateStoragePath } from "@/lib/storage";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentUser();
  if (!staff || !["admin", "staff"].includes(staff.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  const { id } = await params;
  const [job] = await db.select({ fileId: printJobs.fileId }).from(printJobs).where(eq(printJobs.id, id)).limit(1);
  if (!job?.fileId) return NextResponse.json({ error: "The print file is no longer available." }, { status: 404 });
  const [file] = await db.select().from(storedFiles).where(eq(storedFiles.id, job.fileId)).limit(1);
  if (!file) return NextResponse.json({ error: "The print file is no longer available." }, { status: 404 });
  try {
    const bytes = await readFile(privateStoragePath(file.objectKey));
    return new NextResponse(bytes, { headers: { "Content-Type": file.mimeType, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "The print file is no longer available." }, { status: 404 }); }
}
