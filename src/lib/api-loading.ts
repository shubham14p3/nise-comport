"use client";

/**
 * Every call to the server is listed here while it runs, so the screen can show a loading line.
 * Nothing is shown when no call is running.
 */
type Running = { id: number; label: string };
let running: Running[] = [];
let snapshot: string[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function publish() {
  snapshot = running.map((item) => item.label);
  listeners.forEach((listener) => listener());
}

/** Runs `work` and lists `label` as loading until it settles. */
export async function trackApi<T>(label: string, work: Promise<T>): Promise<T> {
  const id = nextId++;
  running = [...running, { id, label }];
  publish();
  try {
    return await work;
  } finally {
    running = running.filter((item) => item.id !== id);
    publish();
  }
}

/** For useSyncExternalStore: the labels of calls in flight, in the order they started. */
export function subscribeApiLoading(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getApiLoading(): string[] {
  return snapshot;
}
