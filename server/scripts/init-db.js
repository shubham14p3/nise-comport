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
  const existing = await query(
    "SELECT id FROM users WHERE ($1::text IS NOT NULL AND lower(email)=lower($1)) OR ($2::text IS NOT NULL AND mobile=$2) LIMIT 1",
    [email, mobile]
  );
  if (existing.rows[0]) {
    await query(
      "UPDATE users SET role='OWNER',name=$2,email=COALESCE($3,email),mobile=COALESCE($4,mobile),password_hash=$5,updated_at=NOW() WHERE id=$1",
      [existing.rows[0].id, name, email, mobile, hash]
    );
  } else {
    await query(
      "INSERT INTO users(role,name,email,mobile,password_hash) VALUES('OWNER',$1,$2,$3,$4)",
      [name, email, mobile, hash]
    );
  }
  console.log("[NISE] Owner account seeded.");
} else {
  console.log("[NISE] Schema installed. Owner seed skipped because email/mobile or password is missing.");
}

await pool.end();
