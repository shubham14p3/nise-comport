"use client";

import { secureApi } from "@/lib/secure-api-client";
import { RECORD_SERVICES } from "@/lib/record-import";

/**
 * The only place the records screens talk to the server.
 * - Reads are cached until something changes them (a status change, an import), so opening the same
 *   service or person again does not call the server again.
 * - Identical reads that are already running share one request.
 * - Every request in flight is listed, so the screen can say what is loading.
 */
const RECORDS_OP = "W8r2T5yN1cF6";
const STATUS_OP = "S8t3Ra5vM1pY";

type InFlight = { id: number; label: string };
let inFlight: InFlight[] = [];
let snapshot: string[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const cache = new Map<string, unknown>();
const running = new Map<string, Promise<unknown>>();

function publish() {
  snapshot = inFlight.map((item) => item.label);
  listeners.forEach((listener) => listener());
}

async function call<T>(label: string, op: string, params: Record<string, unknown>, cacheKey?: string): Promise<T> {
  if (cacheKey) {
    if (cache.has(cacheKey)) return cache.get(cacheKey) as T;
    const sharing = running.get(cacheKey);
    if (sharing) return sharing as Promise<T>;
  }
  const id = nextId++;
  inFlight = [...inFlight, { id, label }];
  publish();
  const request = secureApi<T>(op, params)
    .then((value) => { if (cacheKey) cache.set(cacheKey, value); return value; })
    .finally(() => {
      inFlight = inFlight.filter((item) => item.id !== id);
      if (cacheKey) running.delete(cacheKey);
      publish();
    });
  if (cacheKey) running.set(cacheKey, request);
  return request;
}

function dropCache(prefix: string) {
  for (const key of [...cache.keys()]) if (key.startsWith(prefix)) cache.delete(key);
}

/** For useSyncExternalStore: the labels of requests in flight, in the order they started. */
export function subscribeRecordsLoading(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getRecordsLoading(): string[] {
  return snapshot;
}

export const recordsClient = {
  services<T>() {
    return call<T>("Loading the service list…", RECORDS_OP, { view: "services" }, "services");
  },
  stages<T>(service: string) {
    return call<T>(`Loading ${RECORD_SERVICES[service] ?? service} stages…`, RECORDS_OP, { view: "stages", service }, `stages:${service}`);
  },
  person<T>(key: string) {
    return call<T>("Opening customer records…", RECORDS_OP, { key }, `person:${key}`);
  },
  /** Saves a status and clears the cached counts and person records it changes. */
  async setStatus<T = unknown>(recordId: string, status: string) {
    const value = await call<T>("Saving status…", STATUS_OP, { recordId, status });
    dropCache("stages:");
    dropCache("person:");
    dropCache("services");
    return value;
  },
  /** After an import: everything cached may be out of date. */
  clearAll() {
    cache.clear();
  },
};
