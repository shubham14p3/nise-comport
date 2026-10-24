/** A short-lived, in-memory single-flight cache for shared reads.
 * Errors are never cached and invalidation prevents stale in-flight results
 * from repopulating the cache after login/logout.
 */
export function createSingleFlightCache<T>(load: () => Promise<T>, ttlMs = 45_000, now: () => number = Date.now) {
  let value: { data: T; until: number } | null = null;
  let pending: Promise<T> | null = null;
  let generation = 0;

  return {
    get(): Promise<T> {
      if (value && value.until > now()) return Promise.resolve(value.data);
      if (pending) return pending;

      const epoch = generation;
      const task = Promise.resolve().then(load).then((data) => {
        if (generation === epoch) value = { data, until: now() + ttlMs };
        return data;
      });
      pending = task;
      void task.then(
        () => { if (pending === task) pending = null; },
        () => { if (pending === task) pending = null; },
      );
      return task;
    },
    invalidate() {
      generation += 1;
      value = null;
      pending = null;
    },
  };
}
