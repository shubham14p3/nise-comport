/**
 * Runs a loader whose failure should never take a whole page down (database, Google, a cache).
 * The page renders with the fallback and the problem is written to the server log.
 */
export async function safely<T>(task: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try { return await task(); }
  catch (error) { console.error(`[page] ${label} unavailable, using fallback`, error instanceof Error ? error.message : error); return fallback; }
}
