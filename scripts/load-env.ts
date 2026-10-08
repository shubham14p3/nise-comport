// Loads .env.local before any app module reads process.env. Import this first in local scripts.
import { existsSync } from "node:fs";
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
