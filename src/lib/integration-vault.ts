import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Pool } from "pg";

export const PROVIDERS = ["instagram", "facebook", "whatsapp", "email"] as const;
export type Provider = (typeof PROVIDERS)[number];

const globalPool = globalThis as unknown as { integrationPool?: Pool };
const pool = globalPool.integrationPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 2, ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false } });
if (process.env.NODE_ENV !== "production") globalPool.integrationPool = pool;

function key() {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  if (!raw || !/^[a-f0-9]{64}$/i.test(raw)) throw new Error("INTEGRATIONS_ENCRYPTION_KEY must be 32 random bytes encoded as 64 hex characters");
  return Buffer.from(raw, "hex");
}
function encrypt(value: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}
function decrypt(value: string): Record<string, string> {
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"));
}
async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS integration_credentials (
    provider text PRIMARY KEY, ciphertext text NOT NULL,
    updated_by text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
  )`);
}
export async function integrationStatuses() {
  await ensureTable();
  const { rows } = await pool.query<{ provider: string; updated_at: Date }>("SELECT provider, updated_at FROM integration_credentials");
  return PROVIDERS.map(provider => ({ provider, configured: rows.some(row => row.provider === provider), updatedAt: rows.find(row => row.provider === provider)?.updated_at ?? null }));
}
export async function saveIntegration(provider: Provider, credentials: Record<string, string>, actor: string) {
  await ensureTable();
  const previous = await getIntegration(provider);
  const merged = { ...previous, ...Object.fromEntries(Object.entries(credentials).filter(([, value]) => value.trim().length > 0)) };
  await pool.query(`INSERT INTO integration_credentials(provider,ciphertext,updated_by) VALUES ($1,$2,$3)
    ON CONFLICT(provider) DO UPDATE SET ciphertext=excluded.ciphertext, updated_by=excluded.updated_by, updated_at=now()`, [provider, encrypt(merged), actor]);
}
export async function getIntegration(provider: Provider): Promise<Record<string, string> | null> {
  await ensureTable();
  const { rows } = await pool.query<{ ciphertext: string }>("SELECT ciphertext FROM integration_credentials WHERE provider=$1", [provider]);
  return rows[0] ? decrypt(rows[0].ciphertext) : null;
}
export async function resolveIntegration(provider: Provider) {
  return (await getIntegration(provider)) ?? {};
}
export async function deleteIntegration(provider: Provider) {
  await ensureTable();
  await pool.query("DELETE FROM integration_credentials WHERE provider=$1", [provider]);
}
