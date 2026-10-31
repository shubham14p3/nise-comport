/** Production dashboard module's referenced JavaScript, not a browser timing benchmark. */
import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
const dir = process.argv[2] || ".next";
const source = readFileSync(join(dir, "server/app/desk/page_client-reference-manifest.js"), "utf8");
const marker = '["/desk/page"]=';
if (!source.includes(marker)) throw new Error("Dashboard client manifest not found. Run the production build first.");
const manifest = JSON.parse(source.split(marker)[1].trim().replace(/;$/, ""));
const chunks = new Set(Object.entries(manifest.clientModules)
  .filter(([name]) => name.includes("/components/admin-dashboard"))
  .flatMap(([, module]) => module.chunks).filter(name => name.endsWith(".js")));
if (!chunks.size) throw new Error("Dashboard module not found in the client manifest.");
const files = [...chunks].sort().map(file => ({ file,
  bytes: statSync(join(dir, file)).size,
  gzipBytes: gzipSync(readFileSync(join(dir, file)), { level: 9 }).byteLength,
}));
console.log(JSON.stringify({ files, bytes: files.reduce((n, f) => n + f.bytes, 0),
  gzipBytes: files.reduce((n, f) => n + f.gzipBytes, 0) }, null, 2));
