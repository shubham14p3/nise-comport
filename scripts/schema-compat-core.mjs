/**
 * Conservative, additive PostgreSQL migration planner.
 * Recognizes only CREATE TABLE, ALTER TABLE ADD COLUMN, and CREATE INDEX,
 * plus the narrowly scoped ADD CONSTRAINT statements used for brand-new tables.
 * Never executes INSERT/UPDATE/DELETE, DROP, TRUNCATE, or ledger modifications.
 */
export function migrationSteps(files) {
  const steps = [];
  for (const { name, content } of files) {
    for (let raw of content.split("--> statement-breakpoint")) {
      raw = raw.replace(/^(?:\s|--[^\r\n]*(?:\r?\n|$))+/g, "").trim();
      if (!raw) continue;
      const tableMatch = raw.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.)?"([^"]+)"\s*\(/i);
      if (tableMatch) {
        const body = raw.slice(raw.indexOf("(", tableMatch[0].length - 1) + 1, raw.lastIndexOf(")"));
        const columns = [...body.matchAll(/(?:^|[,\n])\s*"([^"]+)"\s+[a-z]/gim)].map((m) => m[1]);
        steps.push({ name, kind: "table", table: tableMatch[1], columns, sql: raw.replace(/^CREATE\s+TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ").replace(/^CREATE TABLE IF NOT EXISTS IF NOT EXISTS /i, "CREATE TABLE IF NOT EXISTS ") });
        continue;
      }
      const columnMatch = raw.match(/^ALTER\s+TABLE\s+(?:"public"\.)?"([^"]+)"\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"([^"]+)"\s+([\s\S]+)$/i);
      if (columnMatch) {
        steps.push({ name, kind: "column", table: columnMatch[1], column: columnMatch[2], sql: raw.replace(/\bADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS\s+)/i, "ADD COLUMN IF NOT EXISTS ") });
        continue;
      }
      const indexMatch = raw.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"([^"]+)"\s+ON\s+(?:"public"\.)?"([^"]+)"/i);
      if (indexMatch) {
        steps.push({ name, kind: "index", table: indexMatch[2], index: indexMatch[1], sql: raw.replace(/\bINDEX\s+(?!IF\s+NOT\s+EXISTS\s+)/i, "INDEX IF NOT EXISTS ") });
        continue;
      }
      const constraintMatch = raw.match(/^ALTER\s+TABLE\s+(?:"public"\.)?"([^"]+)"\s+ADD\s+CONSTRAINT\s+"([^"]+)"\s+FOREIGN\s+KEY\b/i);
      if (constraintMatch) {
        steps.push({ name, kind: "fk", table: constraintMatch[1], constraint: constraintMatch[2], sql: raw });
        continue;
      }
      // DO blocks in the mailbox migration only add named FK constraints.
      const guardedFk = raw.match(/^DO\s+\$\$\s+BEGIN\s+ALTER\s+TABLE\s+"([^"]+)"\s+ADD\s+CONSTRAINT\s+"([^"]+)"\s+FOREIGN\s+KEY\b/i);
      if (guardedFk && /EXCEPTION\s+WHEN\s+duplicate_object/i.test(raw)) {
        steps.push({ name, kind: "fk", table: guardedFk[1], constraint: guardedFk[2], sql: raw });
      }
    }
  }
  return steps;
}

/**
 * Builds a plan using a pure model of the actual database.
 * Existing tables only get explicitly authored ADD COLUMN statements.
 * If a missing column has no matching migration, fail closed.
 */
export function planRepair(expected, existing, steps, existingIndexes = new Set()) {
  const have = new Map([...existing].map(([name, cols]) => [name, new Set(cols)]));
  const pending = [];
  const created = new Set();
  const indexCandidates = [];
  const fkCandidates = [];
  const documentedIndexes = [];

  for (const step of steps) {
    const required = expected.get(step.table);
    if (!required) continue;
    if (step.kind === "table") {
      if (have.has(step.table)) continue;
      have.set(step.table, new Set(step.columns));
      created.add(step.table);
      pending.push(step);
    } else if (step.kind === "column") {
      if (!required.has(step.column) || !have.has(step.table) || have.get(step.table).has(step.column)) continue;
      have.get(step.table).add(step.column);
      pending.push(step);
    } else if (step.kind === "index") {
      documentedIndexes.push(step);
      if (!existingIndexes.has(step.index)) indexCandidates.push(step);
    } else if (step.kind === "fk") {
      fkCandidates.push(step);
    }
  }

  // Indexes and FKs on new, empty tables are safe to add after all tables and
  // columns exist. Indexes on populated existing tables are review-only.
  for (const step of fkCandidates) if (created.has(step.table)) pending.push(step);
  for (const step of indexCandidates) if (created.has(step.table)) pending.push(step);

  const blockers = [];
  for (const [table, cols] of expected) {
    if (!have.has(table)) { blockers.push(`No CREATE TABLE migration for ${table}`); continue; }
    for (const col of cols) if (!have.get(table).has(col)) blockers.push(`No additive migration for ${table}.${col}`);
  }

  const deferredIndexes = indexCandidates.filter((item) => !created.has(item.table));
  return { pending, blockers, deferredIndexes, documentedIndexes, createdTables: [...created] };
}
