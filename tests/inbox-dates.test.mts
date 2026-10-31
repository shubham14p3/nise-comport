import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inboxToday, inboxDay, inboxDateRange } from '../src/lib/inbox-dates.ts';
const now = new Date('2026-10-31T19:00:00Z');
test('India dates cross midnight independently of the viewer timezone', () => {
  assert.equal(inboxToday(now), '2026-11-01');
  assert.equal(inboxDay(-1, now), '2026-10-31');
  assert.equal(inboxDay(-2, now), '2026-10-30');
  const range = inboxDateRange('2026-10-30', '2026-10-31', now);
  assert.equal(range.from?.toISOString(), '2026-10-29T18:30:00.000Z');
  assert.equal(range.until?.toISOString(), '2026-10-31T18:30:00.000Z');
});
test('validates actual calendar dates, bounds, partial and reversed ranges', () => {
  assert.deepEqual(inboxDateRange('', '', now), {});
  assert.ok(inboxDateRange('2000-01-01', '2026-11-01', now).from);
  assert.ok(inboxDateRange('2024-02-29', '2024-02-29', now).from);
  for (const [from, to] of [['1999-12-31', '2000-01-01'], ['2026-11-02', '2026-11-02'], ['2026-02-30', '2026-03-01'], ['2026-10-31', '2026-10-30'], ['', '2026-10-31'], ['bad', 'bad']]) assert.throws(() => inboxDateRange(from, to, now));
});
