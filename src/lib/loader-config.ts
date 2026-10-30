/** Public loader settings contain an asset path only, never credentials or customer data. */
export const DEFAULT_LOADER_SRC = "/images/logo/logo-footer.png";
export const LOADER_CHANGED = "nise:loader-changed";
export type LoaderSettings = { src: string | null };
const asset = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.webp$/;
export function loaderAssetId(file: string): string | null { return asset.exec(file)?.[1] ?? null; }
export function loaderSettings(value: unknown): LoaderSettings {
  const src = value && typeof value === "object" && "src" in value ? value.src : null;
  return { src: typeof src === "string" && src.startsWith("/branding/loader/") && loaderAssetId(src.slice("/branding/loader/".length)) ? src : null };
}
