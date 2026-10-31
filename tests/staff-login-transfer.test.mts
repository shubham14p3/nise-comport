import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { loadServerModule } from './helpers/load-server-module.mjs';
const dialect = new PgDialect();
const source = { id: 'staff', role: 'staff', email: 'old@example.test', phone: '+917061035476', permissions: ['requests', 'scope:insurance'], passwordHash: 'old-hash', loginPinHash: 'old-pin', disabledAt: null, deletedAt: null };
const target = { ...source, id: 'customer', role: 'customer', email: 'customer@example.test', permissions: [], passwordHash: 'customer-hash', loginPinHash: 'customer-pin' };
let rows = [structuredClone(source), structuredClone(target)];
let removed: unknown[] = []; let writes = 0; let failWrite = false;
const audits: unknown[] = [];
const db = {
 select() { let params: unknown[] = []; const q = { from() { return q; }, where(sql: Parameters<typeof dialect.sqlToQuery>[0]) { params = dialect.sqlToQuery(sql).params; return q; }, for() { return q; }, then(resolve: (value: unknown[]) => void) { return Promise.resolve(rows.filter(row => params.includes(row.id) || params.includes(row.email))).then(resolve); } }; return q; },
 update() { let set: Record<string, unknown> = {}; return { set(value: Record<string, unknown>) { set = value; return this; }, async where(sql: Parameters<typeof dialect.sqlToQuery>[0]) { writes++; if (failWrite && writes === 2) throw new Error('write failed'); const params = dialect.sqlToQuery(sql).params; const row = rows.find(row => params.includes(row.id)); assert.ok(row); Object.assign(row, set); } }; },
 delete() { return { async where(sql: Parameters<typeof dialect.sqlToQuery>[0]) { removed.push(...dialect.sqlToQuery(sql).params); } }; },
 insert(table: Parameters<typeof getTableName>[0]) { assert.equal(getTableName(table), 'activity_log'); return { async values(value: unknown) { audits.push(value); } }; },
 async transaction(work: (tx: unknown) => Promise<unknown>) { const saved = structuredClone(rows); try { return await work(db); } catch (error) { rows = saved; throw error; } },
};
(globalThis as unknown as { __niseTest: unknown }).__niseTest = { db };
const { transferStaffLogin } = await loadServerModule('src/lib/staff-login-transfer.ts');
const owner = { id: 'owner', role: 'admin', name: 'Owner' };
function reset() { rows = [structuredClone(source), structuredClone(target)]; removed = []; writes = 0; failWrite = false; audits.length = 0; }
test('explicit transfer retains customer credentials and historical IDs, disables old access and ends both sessions', async () => {
 reset(); assert.equal((await transferStaffLogin('staff', 'customer@example.test', owner)).id, 'customer');
 assert.equal(rows[0].role, 'customer'); assert.ok(rows[0].disabledAt); assert.deepEqual(rows[0].permissions, []);
 assert.equal(rows[1].role, 'staff'); assert.deepEqual(rows[1].permissions, source.permissions);
 assert.equal(rows[1].passwordHash, 'customer-hash'); assert.equal(rows[1].loginPinHash, 'customer-pin');
 assert.deepEqual(removed.sort(), ['customer', 'staff']); assert.equal(audits.length, 1);
});
test('rejects non-owner, self, owner source, disabled target and different phone before any write', async () => {
 for (const scenario of ['non-owner', 'self', 'owner-source', 'target-disabled', 'phone']) {
  reset(); const actor = { ...owner };
  if (scenario === 'non-owner') actor.role = 'staff';
  if (scenario === 'self') actor.id = 'staff';
  if (scenario === 'owner-source') rows[0].role = 'admin';
  if (scenario === 'target-disabled') rows[1].disabledAt = new Date() as never;
  if (scenario === 'phone') rows[1].phone = '+919876543210';
  await assert.rejects(() => transferStaffLogin('staff', 'customer@example.test', actor)); assert.equal(writes, 0);
 }
});
test('a failed second write rolls back granted access', async () => {
 reset(); failWrite = true; await assert.rejects(() => transferStaffLogin('staff', 'customer@example.test', owner));
 assert.equal(rows[0].role, 'staff'); assert.equal(rows[1].role, 'customer'); assert.equal(audits.length, 0); assert.equal(removed.length, 0);
});
