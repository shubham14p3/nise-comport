"use client";

import type { DetailedIntake } from "@/lib/detailed-intake";

/**
 * Short-lived, same-tab browser hand-off for voters who finish a form before
 * authenticating. Nothing is written to cookies, URLs or plaintext localStorage.
 * The AES-GCM key exists only in sessionStorage; encrypted answers and encrypted
 * file bytes are stored in IndexedDB. Drafts are inaccessible without that tab's key.
 * This is not a substitute for device security against malicious same-origin scripts.
 */
export type VoterDraftKind = "voter-form6" | "voter-form8";
export type VoterDraft = { intake: DetailedIntake; photo: File | null; proof: File | null };
const DB_NAME = "nise-voter-auth-handoff-v1";
const STORE = "drafts";
const MAX_AGE_MS = 30 * 60 * 1000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PROOF_BYTES = 20 * 1024 * 1024;

type Cipher = { iv: Uint8Array<ArrayBuffer>; bytes: ArrayBuffer };
type EncryptedFile = Cipher & { name: string; type: string; lastModified: number };
type Saved = {
  kind: VoterDraftKind;
  expiresAt: number;
  answers: Cipher;
  photo: EncryptedFile | null;
  proof: EncryptedFile | null;
};
type SessionKey = { expiresAt: number; key: string };
const sessionKey = (kind: VoterDraftKind) => "nise-voter-auth-handoff-" + kind;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new Error("Browser draft storage is unavailable."));
  });
}

async function put(kind: string, value: Saved): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(value, kind);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Browser could not safely save the draft."));
      transaction.onabort = () => reject(new Error("Browser could not safely save the draft."));
    });
  } finally { db.close(); }
}
async function get(kind: string): Promise<Saved | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(kind);
      req.onsuccess = () => resolve((req.result as Saved | undefined) ?? null);
      req.onerror = () => reject(new Error("The temporary draft could not be read."));
    });
  } finally { db.close(); }
}
async function drop(kind: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).delete(kind);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Temporary draft cleanup failed."));
    });
  } finally { db.close(); }
}
const encode = (bytes: Uint8Array): string => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));
const decode = (base64: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(base64), byte => byte.charCodeAt(0));

async function encrypt(key: CryptoKey, data: BufferSource): Promise<Cipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, data);
  return { iv, bytes };
}
async function decrypt(key: CryptoKey, data: Cipher): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name:"AES-GCM", iv:data.iv }, key, data.bytes);
}
async function encryptFile(key: CryptoKey, file: File | null, limit: number): Promise<EncryptedFile | null> {
  if (!file) return null;
  if (!file.size || file.size > limit) throw new Error("One of the attachments exceeds the allowed size.");
  const ciphertext = await encrypt(key, await file.arrayBuffer());
  return { ...ciphertext, name:file.name, type:file.type, lastModified:file.lastModified };
}
async function decryptFile(key: CryptoKey, encrypted: EncryptedFile | null): Promise<File | null> {
  if (!encrypted) return null;
  const bytes = await decrypt(key, encrypted);
  return new File([bytes], encrypted.name, { type:encrypted.type, lastModified:encrypted.lastModified });
}

/** Save only after successful full-form validation, immediately before login. */
export async function saveTemporaryVoterDraft(kind: VoterDraftKind, draft: VoterDraft): Promise<void> {
  if (draft.intake.kind !== kind) throw new Error("The draft type does not match the requested form.");
  if (!crypto?.subtle || !("indexedDB" in window)) throw new Error("This browser cannot protect a temporary draft. Please sign in before filling the form.");
  const key = await crypto.subtle.generateKey({ name:"AES-GCM", length:256 }, true, ["encrypt","decrypt"]);
  const expiresAt = Date.now() + MAX_AGE_MS;
  const answers = await encrypt(key, new TextEncoder().encode(JSON.stringify(draft.intake)));
  const photo = await encryptFile(key, draft.photo, MAX_PHOTO_BYTES);
  const proof = await encryptFile(key, draft.proof, MAX_PROOF_BYTES);
  const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  // The browser tab holds the only decryption key; IndexedDB holds ciphertext.
  try {
    await put(kind, { kind, expiresAt, answers, photo, proof });
    sessionStorage.setItem(sessionKey(kind), JSON.stringify({ expiresAt, key:encode(rawKey) } satisfies SessionKey));
  } catch(error) {
    await clearTemporaryVoterDraft(kind).catch(() => undefined);
    throw error instanceof Error ? error : new Error("Unable to save this temporary form.");
  }
}

/** Read without consuming: refreshes during the login flow can still recover the same draft. */
export async function readTemporaryVoterDraft(kind: VoterDraftKind): Promise<VoterDraft | null> {
  const stored = sessionStorage.getItem(sessionKey(kind));
  if (!stored) return null;
  try {
    const session = JSON.parse(stored) as SessionKey;
    if (!session.key || session.expiresAt < Date.now()) throw new Error("Draft expired.");
    const data = await get(kind);
    if (!data || data.kind !== kind || data.expiresAt !== session.expiresAt) throw new Error("Draft unavailable.");
    const key = await crypto.subtle.importKey("raw", decode(session.key), { name:"AES-GCM" }, false, ["decrypt"]);
    const raw = await decrypt(key, data.answers);
    const intake = JSON.parse(new TextDecoder().decode(raw)) as DetailedIntake;
    if (!intake || intake.kind !== kind || !intake.answers || typeof intake.answers !== "object") throw new Error("Invalid draft.");
    const [photo, proof] = await Promise.all([decryptFile(key,data.photo),decryptFile(key,data.proof)]);
    return { intake, photo, proof };
  } catch {
    await clearTemporaryVoterDraft(kind).catch(() => undefined);
    return null;
  }
}

/** Remove the only decryption key first, then best-effort delete encrypted bytes. */
export async function clearTemporaryVoterDraft(kind: VoterDraftKind): Promise<void> {
  sessionStorage.removeItem(sessionKey(kind));
  await drop(kind);
}
