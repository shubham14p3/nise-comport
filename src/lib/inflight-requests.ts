/**
 * Coalesce identical in-flight client requests. Repeated taps must not turn a
 * single user intent into multiple encrypted POSTs or payments.
 * Only concurrent work is shared; a settled request is immediately retryable.
 */
export function coalesceInFlight<T>(
  pending: Map<string, Promise<unknown>>,
  key: string,
  execute: () => Promise<T>,
): Promise<T> {
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;

  // Register the promise synchronously, before encryption / fetch can begin.
  const task = Promise.resolve().then(execute);
  pending.set(key, task);
  const clear = () => {
    if (pending.get(key) === task) pending.delete(key);
  };
  void task.then(clear, clear);
  return task;
}

/** Keys are scoped by operation and exact input, so separate requests stay independent. */
export function requestFlightKey(operation: string, input: unknown): string {
  return JSON.stringify([operation, input]);
}
