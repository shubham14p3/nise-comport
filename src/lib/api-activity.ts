/** Shared browser-only activity store for encrypted API operations.
 * In-flight requests are counted once (coalesced callers share one request).
 * Subscribed UI gets a global loading indicator without per-page wiring.
 */
let pending = 0;
const subscribers = new Set<() => void>();
function notify() { for (const fn of subscribers) fn(); }
export function subscribeApiActivity(fn: () => void) {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}
export function getApiActivity() { return pending; }
export function getServerApiActivity() { return 0; }

export function trackApiActivity<T>(promise: Promise<T>): Promise<T> {
  pending++;
  notify();
  const release = () => {
    pending = Math.max(0, pending - 1);
    notify();
  };
  // Attach both handlers without altering the promise or creating an unhandled rejection.
  void promise.then(release, release);
  return promise;
}
