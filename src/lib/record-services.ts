/**
 * One rule per service: which fields a CUSTOMER sees and where to find them.
 * Staff always see every column; this file only decides what the customer sees.
 * Plain module, so the browser and the server use the same rules.
 *
 * from:  name | mobile | email | address | pan | status | note | reference | insurer | vehicleType | column
 * match: a regex or an exact column header (for "column"), used to find the value in the imported sheet
 * prefixes: reference numbers that start with one of these belong to the service (J for certificates, A/Q/N for PAN)
 */
type From = "name" | "mobile" | "email" | "address" | "pan" | "status" | "note" | "reference" | "insurer" | "vehicleType" | "column";
export type FieldRule = { label: string; from: From; match?: RegExp | string };
export type ServiceRule = { prefixes?: string[]; fields: FieldRule[] };

const STATUS: FieldRule = { label: "Status", from: "status" };
const NOTE: FieldRule = { label: "Comment", from: "note" };
const NAME: FieldRule = { label: "Name", from: "name" };
const MOBILE: FieldRule = { label: "Mobile number", from: "mobile" };
const EMAIL: FieldRule = { label: "Email", from: "email" };
const ADDRESS: FieldRule = { label: "Address", from: "address" };

export const SERVICE_RULES: Record<string, ServiceRule> = {
  pan: { prefixes: ["A", "Q", "N"], fields: [
    NAME, MOBILE, EMAIL,
    { label: "Date of birth", from: "column", match: /dob|birth/i },
    { label: "Applied on", from: "column", match: /appl/i },
    { label: "Uploaded on", from: "column", match: /upload/i },
    { label: "PAN number", from: "pan" },
    { label: "Reference number", from: "reference" },
    STATUS, NOTE,
  ] },
  "income-certificate": { prefixes: ["JHIC"], fields: [
    MOBILE,
    { label: "Submitted on", from: "column", match: /submi|doas/i },
    NAME,
    { label: "Reference number", from: "reference" },
    STATUS, NOTE,
  ] },
  "residence-certificate": { prefixes: ["GHRCO"], fields: [
    NAME, ADDRESS, MOBILE, EMAIL,
    { label: "Submitted on", from: "column", match: /submi|doas/i },
    { label: "Reference number", from: "reference" },
    STATUS, NOTE,
  ] },
  ayushman: { fields: [
    MOBILE, NAME,
    { label: "Ration card number", from: "column", match: /ration/i },
    STATUS, NOTE,
  ] },
  insurance: { fields: [
    MOBILE, NAME,
    { label: "Date of birth", from: "column", match: /dob|birth/i },
    { label: "Vehicle", from: "vehicleType", match: /type/i },
    { label: "Insurer", from: "insurer", match: "Column 3" },
    { label: "Policy date", from: "column", match: /policy/i },
    { label: "Vehicle number", from: "column", match: /reg|vehicle no|vehicle number/i },
    STATUS, NOTE,
  ] },
  itr: { fields: [
    { label: "PAN number", from: "pan" }, MOBILE,
    { label: "Refund", from: "column", match: /refund/i },
    STATUS, NOTE,
  ] },
};

/** Everything not listed yet: the customer sees only name, mobile and status. */
const DEFAULT_RULE: ServiceRule = { fields: [NAME, MOBILE, STATUS, NOTE] };

export type CustomerInput = {
  name: string; mobile: string | null; whatsapp: string | null; email: string | null; address: string | null;
  pan: string | null; statusLabel: string; statusNote: string | null; fields: Record<string, string>;
};

const pretty = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

function findColumn(fields: Record<string, string>, match?: RegExp | string): string {
  if (!match) return "";
  for (const [label, value] of Object.entries(fields)) {
    if (!value) continue;
    const hit = typeof match === "string" ? label.trim().toLowerCase() === match.toLowerCase() : match.test(label);
    if (hit) return value;
  }
  return "";
}

function valueOf(rule: ServiceRule, field: FieldRule, input: CustomerInput): string {
  switch (field.from) {
    case "name": return input.name;
    case "mobile": return input.mobile ? pretty(input.mobile) : input.whatsapp ? pretty(input.whatsapp) : "";
    case "email": return input.email ?? "";
    case "address": return input.address ?? "";
    case "pan": return input.pan ?? "";
    case "status": return input.statusLabel;
    case "note": return input.statusNote ?? "";
    case "reference": {
      for (const value of Object.values(input.fields)) {
        if (value && rule.prefixes?.some((prefix) => value.trim().toUpperCase().startsWith(prefix))) return value.trim();
      }
      return "";
    }
    case "insurer": return /^D/i.test(findColumn(input.fields, field.match)) ? "Go Digit" : "";
    case "vehicleType": {
      const code = findColumn(input.fields, field.match).trim();
      return code === "2" ? "Two-wheeler" : code === "4" ? "Four-wheeler" : code;
    }
    case "column": return findColumn(input.fields, field.match);
  }
}

/** The fields a customer may see for one record, in order. Empty values are left out. */
export function customerFields(service: string, input: CustomerInput): { label: string; value: string }[] {
  const rule = SERVICE_RULES[service] ?? DEFAULT_RULE;
  const out: { label: string; value: string }[] = [];
  for (const field of rule.fields) {
    const value = valueOf(rule, field, input);
    if (value) out.push({ label: field.label, value });
  }
  return out;
}
