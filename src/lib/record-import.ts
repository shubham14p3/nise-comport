/**
 * Turns the shop's Excel registers (PAN, insurance, certificates, Aadhaar, Ayushman…) into
 * customer records. Every sheet of a workbook is read; the header row is found automatically,
 * the service is worked out from the file and sheet names, and rows without a name plus a
 * mobile, PAN or Aadhaar number are skipped.
 *
 * Portal passwords, PINs and user IDs are never imported: those columns are dropped.
 * Personal-accounts sheets (expenses, trading, rates…) are skipped.
 *
 * Plain module (no imports) so it runs in tests and in the browser.
 */

export type SheetInput = { name: string; rows: unknown[][] };
export type ParsedRecord = {
  service: string; source: string; name: string;
  mobile: string | null; pan: string | null; aadhaar: string | null;
  recordDate: string | null; renewalOn: string | null;
  fields: Record<string, string>;
  /** Stable text for duplicate detection (hashed before storage). */
  dedupeKey: string;
};
export type SheetReport = { sheet: string; service: string | null; rows: number; records: number; skipped: number; reason?: string; droppedColumns?: string[] };

export const RECORD_SERVICES: Record<string, string> = {
  pan: "PAN card", insurance: "Vehicle insurance", passport: "Passport", itr: "Income tax (ITR)", "driving-licence": "Driving licence",
  "aadhaar-update": "Aadhaar update", ayushman: "Ayushman card", "voter-id": "Voter ID", "bank-account": "Bank account (BC)",
  "caste-certificate": "Caste certificate", "income-certificate": "Income certificate", "residence-certificate": "Residence certificate",
  "birth-certificate": "Birth certificate", "death-certificate": "Death certificate", "ews-certificate": "EWS certificate",
  "life-certificate": "Life certificate", "pm-sym-pension": "PM-SYM pension", "mutual-fund": "Mutual fund / SIP", other: "Other",
};

/** Sheets that hold the shop's own accounts or price lists, not customers. */
const SKIP_SHEETS = /^(rates?|comm|calculator|monexp|monthlyexp|marriageexp|trading|nps|sf|daily|misc|servicereg.*|crdr|csc_?rail|post)$/;
const normal = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function serviceFor(fileName: string, sheetName: string, headers: string[]): string | null {
  const sheet = normal(sheetName);
  const file = normal(fileName);
  if (SKIP_SHEETS.test(sheet) || sheetName.toLowerCase().includes("csc_rail")) return null;
  if (file.includes("student")) return null;
  if (headers.some((header) => header.startsWith("voterno"))) return "voter-id";
  const bySheet: [RegExp, string][] = [
    [/pandetail|^pan$/, "pan"], [/passport/, "passport"], [/^itr/, "itr"], [/^dl$|driving/, "driving-licence"],
    [/digit|bajaj|^others$|insurance|hdfc|icici|tata/, "insurance"], [/caste/, "caste-certificate"], [/income/, "income-certificate"],
    [/^local|residen/, "residence-certificate"], [/birth/, "birth-certificate"], [/death/, "death-certificate"], [/^ew[cs]/, "ews-certificate"],
    [/life/, "life-certificate"], [/psym|pmsym/, "pm-sym-pension"], [/ayushman/, "ayushman"], [/^mf$|mutual/, "mutual-fund"],
  ];
  for (const [pattern, service] of bySheet) if (pattern.test(sheet)) return service;
  const byFile: [RegExp, string][] = [
    [/aadhaar|aadhar/, "aadhaar-update"], [/ayushman/, "ayushman"], [/insurance/, "insurance"], [/pancard|^pan/, "pan"],
    [/mutual/, "mutual-fund"], [/^bc\d|bcagent|banking/, "bank-account"], [/certificate/, "other"],
  ];
  for (const [pattern, service] of byFile) if (pattern.test(file)) return service;
  if (sheet === "master") return "bank-account";
  return "other";
}

type Role = "name" | "mobile" | "pan" | "aadhaar" | "dob" | "date" | "renewal" | "secret";
function roleOf(header: string): Role | null {
  const h = normal(header);
  if (!h) return null;
  if (h.includes("pass") || h === "pin" || h === "userid" || h === "password" || h === "mpin") return "secret";
  if (["mob", "mobile", "mobileno", "mobilenumber", "phone", "phoneno", "lmob", "contact", "contactno", "whatsapp"].includes(h)) return "mobile";
  if (["pan", "panno", "pannumber", "pancard"].includes(h)) return "pan";
  if (h.startsWith("aadhaar") || h.startsWith("aadhar") || h === "uid" || h.startsWith("studentsaadhaar")) return "aadhaar";
  if (["dob", "dateofbirth", "birthdate"].includes(h)) return "dob";
  if (["renewdate", "renewaldate", "expiry", "expirydate", "duedate", "renewal"].includes(h)) return "renewal";
  if (["date", "pdate", "appldt", "opendt", "bookingdate", "dos", "doa", "issueddt", "issuedate", "policydate"].includes(h)) return "date";
  if (["name", "customername", "holdername", "applicantname", "studentname", "fullname", "nameofapplicant"].includes(h) || h.startsWith("name")) return "name";
  return null;
}

/** Excel cell → trimmed text. Handles dates, numbers stored as floats, rich text and formula results. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    if ("result" in object) return cellText(object.result);
    if (typeof object.text === "string") return object.text.trim();
    if (Array.isArray(object.richText)) return object.richText.map((part) => (part as { text?: string }).text ?? "").join("").trim();
    if ("error" in object) return "";
    return "";
  }
  const text = String(value).replace(/\s+/g, " ").trim();
  return /^#(VALUE|REF|N\/A|DIV\/0|NAME)!?/i.test(text) ? "" : text;
}

/** First valid Indian mobile in a cell ("98765 43210", "+91-98765…", "9876543210/9123…"). */
export function mobileFrom(text: string): string | null {
  for (const chunk of text.split(/[/,;|&]| or /i)) {
    let digits = chunk.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  }
  return null;
}
export function panFrom(text: string) { const match = text.toUpperCase().replace(/\s/g, "").match(/[A-Z]{5}\d{4}[A-Z]/); return match ? match[0] : null; }
export function aadhaarFrom(text: string) { const digits = text.replace(/[\s-]/g, ""); return /^[2-9]\d{11}$/.test(digits) ? digits : null; }

/** Dates as text: ISO, dd-mm-yyyy, dd/mm/yy, or Excel serial numbers. */
export function dateFrom(text: string): string | null {
  if (!text) return null;
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return valid(+match[1], +match[2], +match[3]);
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (match) { const year = +match[3] < 100 ? 2000 + +match[3] : +match[3]; return valid(year, +match[2], +match[1]); }
  if (/^\d{5}$/.test(text)) { const serial = +text; if (serial > 20000 && serial < 60000) return new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000).toISOString().slice(0, 10); }
  return null;
}
function valid(year: number, month: number, day: number) {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 ? date.toISOString().slice(0, 10) : null;
}
function addYear(iso: string) { const [year, month, day] = iso.split("-").map(Number); return valid(year + 1, month, day) ?? valid(year + 1, month, day - 1); }

function cleanName(text: string) {
  const name = text.replace(/[^\p{L}\p{M}\s.'-]/gu, " ").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 100 || !/\p{L}{2}/u.test(name)) return null;
  return name.replace(/\S+/g, (word) => word.length > 2 && word === word.toUpperCase() ? word[0] + word.slice(1).toLowerCase() : word);
}

/** Finds the header row: the row in the first eight with the most recognised column names. */
function findHeader(rows: string[][]) {
  let best = -1; let bestScore = 0;
  rows.slice(0, 8).forEach((row, index) => {
    const roles = row.map(roleOf);
    const score = roles.filter((role) => role && role !== "secret").length + (roles.includes("name") ? 2 : 0);
    const usable = roles.includes("mobile") || roles.includes("pan") || roles.includes("aadhaar");
    if (usable && score > bestScore) { best = index; bestScore = score; }
  });
  return best;
}

const NOT_NAMES = /^(delivered|done|pending|paid|unpaid|yes|no|ok|old|new|kiosk|web|tp|od|comp|cash|online|download|received|rejected|approved|issued|charge|male|female)$/i;
/** Registers sometimes have the name column unlabelled: pick the column that mostly holds people's names. */
function guessNameColumn(rows: string[][], taken: Set<number>) {
  const sample = rows.slice(0, 60);
  let best = -1; let bestCount = 0;
  const width = Math.max(0, ...sample.map((row) => row.length));
  for (let column = 0; column < width; column++) {
    if (taken.has(column)) continue;
    const values = sample.map((row) => row[column] ?? "").filter(Boolean);
    const names = values.filter((value) => /^[\p{L}][\p{L}\p{M}.' ]{2,60}$/u.test(value) && /\s/.test(value) && !NOT_NAMES.test(value));
    if (names.length >= Math.max(3, values.length * 0.6) && new Set(names).size > names.length * 0.5 && names.length > bestCount) { best = column; bestCount = names.length; }
  }
  return best;
}

export function parseWorkbook(fileName: string, sheets: SheetInput[]): { records: ParsedRecord[]; sheets: SheetReport[] } {
  const records: ParsedRecord[] = [];
  const reports: SheetReport[] = [];
  const seen = new Set<string>();
  for (const sheet of sheets) {
    const rows = sheet.rows.map((row) => (row ?? []).map(cellText)).filter((row) => row.some(Boolean));
    if (!rows.length) continue;
    const headerIndex = findHeader(rows);
    const headers = headerIndex >= 0 ? [...rows[headerIndex]] : [];
    const service = serviceFor(fileName, sheet.name, headers.map(normal));
    const report: SheetReport = { sheet: sheet.name.trim(), service, rows: Math.max(0, rows.length - headerIndex - 1), records: 0, skipped: 0 };
    reports.push(report);
    if (!service) { report.reason = "Not a customer list (accounts, rates or a register without names)."; report.rows = rows.length; continue; }
    if (headerIndex < 0) { report.reason = "No mobile, PAN or Aadhaar column, so these people can't be contacted."; report.rows = rows.length; continue; }
    const roles = headers.map(roleOf);
    if (!roles.includes("name")) {
      const guessed = guessNameColumn(rows.slice(headerIndex + 1), new Set(roles.flatMap((role, index) => role ? [index] : [])));
      if (guessed < 0) { report.reason = "No column with customer names."; continue; }
      roles[guessed] = "name";
      headers[guessed] = headers[guessed]?.trim() && roleOf(headers[guessed]) === null && !/\p{L}{2,}\s\p{L}/u.test(headers[guessed]) ? headers[guessed] : "Name";
    }
    report.droppedColumns = headers.filter((_, index) => roles[index] === "secret");
    const column = (role: Role) => roles.indexOf(role);
    for (const row of rows.slice(headerIndex + 1)) {
      const at = (role: Role) => { const index = column(role); return index >= 0 ? row[index] ?? "" : ""; };
      const name = cleanName(at("name"));
      // A mobile may sit in any column when the header is missing; only look at the mobile column.
      const mobile = mobileFrom(at("mobile"));
      const pan = panFrom(at("pan"));
      const aadhaar = aadhaarFrom(at("aadhaar"));
      if (!name || (!mobile && !pan && !aadhaar)) { report.skipped++; continue; }
      const fields: Record<string, string> = {};
      headers.forEach((header, index) => {
        const label = header.trim() && !/\d{5,}/.test(header) ? header.trim() : `Column ${index + 1}`;
        if (roles[index] === "secret" || !row[index] || Object.keys(fields).length >= 40) return;
        fields[label in fields ? `${label} (${index + 1})` : label] = row[index].slice(0, 300);
      });
      const recordDate = dateFrom(at("date"));
      const renewalOn = dateFrom(at("renewal")) ?? (service === "insurance" && recordDate ? addYear(recordDate) : null);
      const dedupeKey = [service, name.toLowerCase(), mobile, pan, aadhaar, recordDate, JSON.stringify(Object.entries(fields).sort())].join("|");
      if (seen.has(dedupeKey)) { report.skipped++; continue; }
      seen.add(dedupeKey);
      records.push({ service, source: `${fileName} › ${sheet.name.trim()}`, name, mobile, pan, aadhaar, recordDate, renewalOn, fields, dedupeKey });
      report.records++;
    }
  }
  return { records, sheets: reports };
}

export function maskPan(pan: string | null) { return pan ? `${pan.slice(0, 2)}XXXXX${pan.slice(-3)}` : null; }
export function maskAadhaar(aadhaar: string | null) { return aadhaar ? `XXXX XXXX ${aadhaar.slice(-4)}` : null; }
