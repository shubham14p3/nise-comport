import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { serviceRequests, storedFiles } from "@/db/schema";
import { privateStoragePath } from "@/lib/storage";
import { apiError } from "@/lib/http";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getCurrentUser();
    if (!hasPermission(staff, "requests")) return NextResponse.json({ error: "Staff access to requests is required." }, { status: 403 });
    const { id } = await params;
    const fileId=new URL(request.url).searchParams.get("fileId");
    if(fileId&&!/^[a-f0-9-]{36}$/i.test(fileId))return NextResponse.json({error:"File not found."},{status:404});
    const [file] = await db.select({ objectKey: storedFiles.objectKey, mimeType: storedFiles.mimeType }).from(storedFiles).innerJoin(serviceRequests, eq(storedFiles.requestId, serviceRequests.id)).where(and(eq(serviceRequests.id,id),...(fileId?[eq(storedFiles.id,fileId)]:[]))).limit(1);
    if (!file) return NextResponse.json({ error: "No supporting document is attached to this request." }, { status: 404 });
    try {
      const bytes = await readFile(privateStoragePath(file.objectKey));
      return new NextResponse(bytes, { headers: { "Content-Type": file.mimeType, "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    } catch { return NextResponse.json({ error: "The supporting document is no longer available." }, { status: 404 }); }
  } catch (error) { return apiError(error); }
}
