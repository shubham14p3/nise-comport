import { readFile, rm } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { z } from "zod";
import { storedFiles } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { importRecords, listPeople, personRecords, recentImports } from "@/lib/records";
import type { SheetInput } from "@/lib/record-import";
import { privateStoragePath } from "@/lib/storage";
import { vaultReady } from "@/lib/vault";

export const runtime = "nodejs";
export const maxDuration = 120;

/** People list, one person's records (?key=), or recent imports (?imports=1). */
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    if (!vaultReady()) throw new PublicError("Customer records need RECORDS_ENCRYPTION_KEY (or PAN_ENCRYPTION_KEY) in the server settings.", 503);
    const params = request.nextUrl.searchParams;
    const key = params.get("key");
    if (key) return NextResponse.json(await personRecords(key, user));
    if (params.get("imports")) return NextResponse.json({ imports: await recentImports() });
    const sort = params.get("sort");
    return NextResponse.json(await listPeople({ q: params.get("q") ?? "", service: params.get("service") ?? "", sort: sort === "recent" || sort === "renewal" ? sort : "repeat", page: Number(params.get("page") ?? 0) || 0 }));
  } catch (error) { return apiError(error); }
}

function sheetsFrom(workbook: InstanceType<typeof ExcelJS.Workbook>): SheetInput[] {
  return workbook.worksheets.map((sheet) => {
    const rows: unknown[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(values.map((value) => value ?? null));
    });
    return { name: sheet.name, rows };
  });
}

/** Imports an uploaded register (all sheets). */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    if (!vaultReady()) throw new PublicError("Customer records need RECORDS_ENCRYPTION_KEY (or PAN_ENCRYPTION_KEY) in the server settings.", 503);
    const input = z.object({ fileId: z.uuid(), addContacts: z.boolean().optional() }).parse(await request.json());
    const [file] = await db.select().from(storedFiles).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id))).limit(1);
    if (!file || !["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(file.mimeType)) throw new PublicError("Choose an Excel (.xlsx) or CSV file.", 400);
    const workbook = new ExcelJS.Workbook();
    try {
      if (file.mimeType === "text/csv") await workbook.csv.readFile(privateStoragePath(file.objectKey));
      else await workbook.xlsx.load(await readFile(privateStoragePath(file.objectKey)) as never);
    } catch {
      throw new PublicError("This workbook couldn't be read. Open it in Excel, use File → Save As → Excel Workbook (.xlsx), and upload the new copy.", 400);
    }
    const result = await importRecords(file.originalName, sheetsFrom(workbook), user, { addContacts: input.addContacts !== false });
    // The raw workbook may hold portal passwords and full ID numbers: once imported, delete it.
    await rm(privateStoragePath(file.objectKey), { force: true }).catch(() => undefined);
    await db.delete(storedFiles).where(eq(storedFiles.id, file.id));
    return NextResponse.json({ ok: true, import: result }, { status: 201 });
  } catch (error) { return apiError(error); }
}
