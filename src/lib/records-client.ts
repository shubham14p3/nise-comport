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

const cache = new Map<string, unknown>();
const running = new Map<string, Promise<unknown>>();

/** Labels go to the shared loader (api-loading), so the screen shows what is being fetched. */
function call<T>(label: string, op: string, params: Record<string, unknown>, cacheKey?: string): Promise<T> {
  if (cacheKey) {
    if (cache.has(cacheKey)) return Promise.resolve(cache.get(cacheKey) as T);
    const sharing = running.get(cacheKey);
    if (sharing) return sharing as Promise<T>;
  }
  const request = secureApi<T>(op, params, label)
    .then((value) => { if (cacheKey) cache.set(cacheKey, value); return value; })
    .finally(() => { if (cacheKey) running.delete(cacheKey); });
  if (cacheKey) running.set(cacheKey, request);
  return request;
}

function dropCache(prefix: string) {
  for (const key of [...cache.keys()]) if (key.startsWith(prefix)) cache.delete(key);
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
  async setStatus<T = unknown>(recordId: string, status: string, note?: string) {
    const value = await call<T>("Saving status…", STATUS_OP, { recordId, status, note });
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
