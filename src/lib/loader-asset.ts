import { readFile } from "node:fs/promises";
import { loaderAssetId } from "@/lib/loader-config";
import { privateStoragePath } from "@/lib/storage";
/** Public image reads do not initialize database or image-processing clients. */
export async function readLoader(file: string) {
  const id = loaderAssetId(file);
  if (!id) return null;
  try { return await readFile(privateStoragePath(`branding/loader-${id}.webp`)); } catch { return null; }
}
