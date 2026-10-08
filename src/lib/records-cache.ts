/**
 * Short-lived answers for the records screens, kept on the server.
 * The counts behind the sidebar, the stage chips and the year lists need a pass over thousands of
 * rows. They only change when a register is imported or a status is saved, so they are kept for a
 * minute and forgotten at once when either happens. Identical requests that arrive together share
 * one database query. A failed query is never kept.
 */
const KEEP_MS = 60_000;
const MAX_ENTRIES = 400;
const store = new Map<string, { at: number; value: Promise<unknown> }>();

export function cachedRecords<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < KEEP_MS) return hit.value as Promise<T>;
  const value: Promise<T> = load().catch((reason) => {
    if (store.get(key)?.value === value) store.delete(key);
    throw reason;
  });
  store.set(key, { at: Date.now(), value });
  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  return value;
}

/** Something in the records changed: forget every kept answer. */
export function forgetRecordCache() {
  store.clear();
}
