"use client";

import { useState, useSyncExternalStore } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { RECORD_SERVICES } from "@/lib/record-import";

/**
 * The only place the records screens talk to the server.
 * - Every read is cached: opening a service, a year or a page again shows the stored answer (not a person's
 *   records: each opening of those is logged by the server, so it always asks).
 * - The cache is cleared only when something changes (a status is saved, a register is imported).
 *   Screens that are open then load once more, through useRecordsVersion().
 * - Identical reads that are already running share one request.
 */
const RECORDS_OP = "W8r2T5yN1cF6";
const STATUS_OP = "S8t3Ra5vM1pY";

const cache = new Map<string, unknown>();
const running = new Map<string, Promise<unknown>>();
let version = 0;
const versionListeners = new Set<() => void>();

/** Something changed: forget every stored answer and tell the open screens. */
function changed() {
  cache.clear();
  version += 1;
  versionListeners.forEach((listener) => listener());
}

/** Changes each time the records change (status saved, import). */
export function subscribeRecordsVersion(listener: () => void) {
  versionListeners.add(listener);
  return () => { versionListeners.delete(listener); };
}
export function getRecordsVersion(): number {
  return version;
}
/** Open screens use this to load again after a change, and not otherwise. */
export function useRecordsVersion(): number {
  return useSyncExternalStore(subscribeRecordsVersion, getRecordsVersion, () => 0);
}

/**
 * Like useRecordsVersion, but a screen that is hidden keeps the version it last showed.
 * It then loads again only when it is on screen, not once for every hidden screen.
 */
export function useRecordsVersionWhile(visible: boolean): number {
  const live = useRecordsVersion();
  const [shown, setShown] = useState(live);
  if (visible && shown !== live) setShown(live);
  return shown;
}

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

const filterKey = (filters: Record<string, string>) => JSON.stringify(filters);

export const recordsClient = {
  services<T>() {
    return call<T>("Loading the service list…", RECORDS_OP, { view: "services" }, "services");
  },
  stages<T>(service: string) {
    return call<T>(`Loading ${RECORD_SERVICES[service] ?? service} stages…`, RECORDS_OP, { view: "stages", service }, `stages:${service}`);
  },
  /** Year counts for one service, after the filters (text, status, dates). */
  years<T>(service: string, label: string, filters: Record<string, string>) {
    return call<T>(`Loading ${label}…`, RECORDS_OP, { view: "years", service, ...filters }, `years:${service}:${filterKey(filters)}`);
  },
  /** One page of records in a year (or undated) for one service. */
  rows<T>(service: string, label: string, filters: Record<string, string>, year: string | null, page: number) {
    const params = { view: "records", service, ...filters, year: year ?? undefined, undated: year === null ? true : undefined, page };
    return call<T>(`Loading ${label} records…`, RECORDS_OP, params, `rows:${service}:${filterKey(filters)}:${year ?? "undated"}:${page}`);
  },
  /** Never kept: every time someone opens a customer's records the server writes it to the activity log. */
  person<T>(key: string) {
    return call<T>("Opening customer records…", RECORDS_OP, { key });
  },
  /** Saves a status. Everything stored is then out of date, so screens load again. */
  async setStatus<T = unknown>(recordId: string, status: string, note?: string) {
    const value = await call<T>("Saving status…", STATUS_OP, { recordId, status, note });
    changed();
    return value;
  },
  /** The Refresh button: the server forgets what it kept, then every screen reads again from the database. */
  async refresh() {
    await secureApi(RECORDS_OP, { view: "refresh" }, "Refreshing…");
    changed();
  },
  /** After an import: everything stored is out of date, so screens load again. */
  clearAll() {
    changed();
  },
};
