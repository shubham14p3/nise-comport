import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { activityLog, siteSettings } from "@/db/schema";
import { db } from "@/lib/db";
import { loaderSettings, type LoaderSettings } from "@/lib/loader-config";
import { privateStoragePath } from "@/lib/storage";

const KEY = "api-loader";
const load = unstable_cache(async () => {
  const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, KEY)).limit(1);
  return loaderSettings(row?.value);
}, ["site-loader"], { revalidate: 300, tags: ["site-loader"] });

/** Passed through the root layout: no browser settings request per route or API call. */
export async function getLoaderSettings(): Promise<LoaderSettings> {
  try { return await load(); } catch { return { src: null }; }
}
async function save(settings: LoaderSettings, actorId: string) {
  await db.transaction(async tx => {
    await tx.insert(siteSettings).values({ key: KEY, value: settings, updatedBy: actorId, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: settings, updatedBy: actorId, updatedAt: new Date() } });
    await tx.insert(activityLog).values({ kind: "staff", permission: "content", category: "content",
      title: settings.src ? "Updated API loader image" : "Restored default API loader", detail: settings.src,
      refType: "site-setting", refId: KEY, actorId });
  });
  revalidateTag("site-loader", { expire: 0 });
  revalidatePath("/", "layout");
  return settings;
}
export async function resetLoader(actorId: string) { return save({ src: null }, actorId); }
export async function uploadLoader(file: File, actorId: string) {
  const { loaderImage } = await import("@/lib/loader-image");
  const bytes = await loaderImage(file);
  const id = randomUUID();
  const path = privateStoragePath(`branding/loader-${id}.webp`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { mode: 0o600 });
  try { return await save({ src: `/branding/loader/${id}.webp` }, actorId); }
  catch (error) { await rm(path, { force: true }); throw error; }
}
