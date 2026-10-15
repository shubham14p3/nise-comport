#!/usr/bin/env node

import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import pg from "pg";
import { hash } from "@node-rs/argon2";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    try {
      loadEnvFile(file);
    } catch {
      // Ignore duplicate or already-loaded environment values.
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not configured in .env.local or .env");
  process.exit(1);
}

const NAME = "Shubham Test Admin";
const EMAIL = "shubham@test.com";
const PASSWORD = "NiseAdmin#Test2026!";
const PHONE = "+918092766575";

const ssl =
  process.env.DATABASE_SSL === "true"
    ? {
        rejectUnauthorized:
          process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
      }
    : false;

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl,
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 5000,
});

try {
  const existing = await pool.query(
    `
      SELECT id, disabled_at, deleted_at
      FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [EMAIL],
  );

  if (existing.rows[0]?.disabled_at || existing.rows[0]?.deleted_at) {
    throw new Error(
      "A disabled or deleted account already uses shubham@test.com. Refusing to silently reactivate it.",
    );
  }

  const passwordHash = await hash(PASSWORD);

  const result = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        email_verified_at,
        role,
        preferred_contact,
        password_changed_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        NOW(),
        'admin',
        'email',
        NOW(),
        NOW()
      )
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        email_verified_at = COALESCE(users.email_verified_at, NOW()),
        role = 'admin',
        password_changed_at = NOW(),
        updated_at = NOW()
      RETURNING
        id,
        name,
        email,
        phone,
        role,
        email_verified_at
    `,
    [NAME, EMAIL, PHONE, passwordHash],
  );

  const user = result.rows[0];

  console.log("");
  console.log("✓ Test admin is ready");
  console.log(`  Name:     ${user.name}`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Phone:    ${user.phone}`);
  console.log(`  Role:     ${user.role}`);
  console.log(`  Verified: ${Boolean(user.email_verified_at)}`);
  console.log("");
} catch (error) {
  console.error("");
  console.error("Could not create the test admin:");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");
  process.exitCode = 1;
} finally {
  await pool.end();
}