import { resolve } from "node:path";

export function privateStorageRoot() {
  return resolve(/*turbopackIgnore: true*/ process.env.PRIVATE_UPLOAD_DIR ?? ".private-uploads");
}

export function privateStoragePath(objectKey: string) {
  const root = privateStorageRoot();
  const target = resolve(root, objectKey);
  if (target !== root && !target.startsWith(`${root}/`)) throw new Error("Invalid private file key.");
  return target;
}
