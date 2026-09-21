import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { pool, query } from "../db.js";
import { normalizeEmail, normalizeMobile } from "../auth.js";

const schemaPath = path.resolve("server/schema.sql");
const schema = await fs.readFile(schemaPath, "utf8");
await pool.query(schema);

const email = normalizeEmail(process.env.SEED_OWNER_EMAIL);
const mobile = normalizeMobile(process.env.SEED_OWNER_MOBILE);
const password = process.env.SEED_OWNER_PASSWORD;
const name = process.env.SEED_OWNER_NAME || "NISE COMPORT Owner";

if ((email || mobile) && password) {
  if (password.length < 8) throw new Error("SEED_OWNER_PASSWORD must be at least 8 characters");
  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users(role,name,email,mobile,password_hash)
     VALUES('OWNER',$1,$2,$3,$4)
     ON CONFLICT(email) DO UPDATE SET role='OWNER',name=EXCLUDED.name,password_hash=EXCLUDED.password_hash`,
    [name, email, mobile, hash]
  );
  console.log("[NISE] Owner account seeded.");
} else {
  console.log("[NISE] Schema installed. Owner seed skipped because email/mobile or password is missing.");
}

await pool.end();
