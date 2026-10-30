/** Pure encrypted operation routing; authorization remains in the gateway and endpoints. */
const OPS = {
  "I2t7V4mC9nK5": { method: "POST", path: "/api/admin/integrations/test" },
  "S9p2C6mV4tK8": { method: "POST", path: "/api/admin/social-publish" },
  "I8n3T5gR2sV7": { method: "GET", path: "/api/admin/integrations" },
  "S1y4H8nP6vC3": { method: "GET", path: "/api/admin/system-health" },
  "I4n9S6vC1pT8": { method: "POST", path: "/api/admin/integrations" },
  "Q7m4kP2vL9sD": { method: "POST", path: "/api/auth/password" },
  "N5c8R1xT6bW3": { method: "POST", path: "/api/auth/request-otp" },
  "H9d2M7qK4zF8": { method: "POST", path: "/api/auth/verify-otp" },
  "V3p6J0nS8yC1": { method: "POST", path: "/api/auth/password-reset/request" },
  "L8t1B5rX9mQ4": { method: "POST", path: "/api/auth/password-reset/confirm" },
  "F3m8J6pQ1vT9": { method: "POST", path: "/api/auth/mobile-reset" },
  "C4w7G2hN6kP9": { method: "GET", path: "/api/auth/session" },
  "M5q9B2nT7wR3": { method: "GET", path: "/api/auth/birthday" },
  "R6y0D3sJ8vM2": { method: "DELETE", path: "/api/auth/session" },
  "T2f9K4pW7cL1": { method: "PATCH", path: "/api/profile" },
  "B7n3Q8xH5rV0": { method: "POST", path: "/api/account/password" },
  "P9x4Q2wM7dK6": { method: "POST", path: "/api/account/pin" },
  "M1z6P9dS4kJ7": { method: "POST", path: "/api/account/email" },
  "F8c2L5vN0qR3": { method: "POST", path: "/api/account/email/confirm" },
  "Y4h7T1mK6pD9": { method: "DELETE", path: "/api/account/sessions" },
  "J9r5W2bC8nX1": { method: "POST", path: "/api/account/delete" },
  "P3v8F1qL6sM4": { method: "GET", path: "/api/addresses" },
  "D6k0N9yR2tH5": { method: "POST", path: "/api/addresses" },
  "K2p9D5xN1hW7": { method: "POST", path: "/api/coupons/validate" },
  "S5w2J9nF3kL7": { method: "POST", path: "/api/requests" },
  "A4x8L1rN5vK3": { method: "POST", path: "/api/print-jobs" },
  "Z6m2C9pT4hQ7": { method: "POST", path: "/api/pan/requests" },
  "Q4s8N2kV6wLc": { method: "POST", path: "/api/pan/quick-start" },
  "C6d1L8wN4vXs": { method: "POST", path: "/api/admin/counter" },
  "F8k3Q2mW9xLz": { method: "POST", path: "/api/admin/customer-finder" },
  "G3r7M1pX5vKd": { method: "POST", path: "/api/intake" },
  "J4p9N2vC7mQ6": { method: "PATCH", path: "/api/pan/49a/edit" },
  "L5v1N7qD9kR3": { method: "POST", path: "/api/admin/pan-imports" },
  "T7s3F8mP2cX6": { method: "POST", path: "/api/admin/wallet-credit" },
  "W5k2P8vN4rQd": { method: "POST", path: "/api/admin/wallet-credit/approvals" },
  "V8h4T2mK9xLa": { method: "POST", path: "/api/welcome-credit" },
  "L9w5A3sJ7qP2": { method: "GET", path: "/api/admin/wallet-credit" },
  "D2f6C8mR4nX1": { method: "PATCH", path: "/api/admin/wallet-credit" },
  "P8a2N5dK1vR7": { method: "GET", path: "/api/internal/profile-snapshot" },
  "W3k8P1zN6qT2": { method: "POST", path: "/api/places/autocomplete" },
  "Q9v4H2mX7rB5": { method: "POST", path: "/api/places/details" },
  "E7t2Y9cK4nM1": { method: "POST", path: "/api/places/reverse" },
  "U4n8K2rP6wD1": { method: "GET", path: "/api/admin/promotions" },
  "M7x3Q9vB2kF5": { method: "PATCH", path: "/api/admin/promotions" },
  "Z9p4L6tH1cN8": { method: "POST", path: "/api/admin/promotions/sync" },
  "N4v8Q1cR6tY3": { method: "POST", path: "/api/admin/promotions" },
  "K8d3N6wQ1zT4": { method: "GET", path: "/api/admin/staff" },
  "H5r9C2mV7pX1": { method: "POST", path: "/api/admin/staff" },
  "B2x7T4kL9qW6": { method: "PATCH", path: "/api/admin/staff" },
  "G7m2W5xK8dP4": { method: "GET", path: "/api/admin/media" },
  "S3k9V6nD2hQ8": { method: "GET", path: "/api/admin/campaigns" },
  "R8w4Y1pM5cJ2": { method: "POST", path: "/api/admin/campaigns" },
  "T6h2F9qB3xN7": { method: "PATCH", path: "/api/admin/campaigns" },
  "V1p7K4dZ8mR5": { method: "GET", path: "/api/admin/campaigns/queue" },
  "L9c3X6vH1tB8": { method: "PATCH", path: "/api/admin/campaigns/queue" },
  "Y2n6R9tC4vK7": { method: "POST", path: "/api/admin/contacts" },
  "J7t1P5xW3qM9": { method: "PATCH", path: "/api/admin/contacts" },
  "Q3n7B1xK5vR8": { method: "POST", path: "/api/leads" },
  "M9q2X5wJ8tB3": { method: "POST", path: "/api/insurance" },
  "D4r8F2kW6nQ1": { method: "POST", path: "/api/requests/draft" },
  "G2l6S9wQ4mT8": { method: "GET", path: "/api/admin/gallery" },
  "G7l3A1xN5pK2": { method: "POST", path: "/api/admin/gallery" },
  "D9k3W7pR2xN5": { method: "GET", path: "/api/requests/draft" },
  "F6t1W8kN3pQ2": { method: "POST", path: "/api/admin/coupon-batches" },
  "C8m3J6xR1vT4": { method: "GET", path: "/api/admin/site-content" },
  "K1w5Y9pB3nD7": { method: "POST", path: "/api/admin/site-content" },
  "H2c7R4vM9xL5": { method: "PATCH", path: "/api/admin/coupon-batches" },
  "O9c4V7mB2pL5": { method: "POST", path: "/api/admin/inbox" },
  "E3h8K1tW6qZ9": { method: "PATCH", path: "/api/admin/leads" },
  "U6c2R9pL5wM7": { method: "POST", path: "/api/admin/leads" },
  "R7k2C9vM4pN8": { method: "PATCH", path: "/api/admin/customers" },
  "V2a9N6sK4rD8": { method: "POST", path: "/api/admin/customer-preview" },
  "B4j9D6sX2mH7": { method: "POST", path: "/api/admin/records" },
  "F2q6N9vK3xT5": { method: "GET", path: "/api/admin/testimonials" },
  "R8m4P1wD7zL2": { method: "POST", path: "/api/admin/testimonials" },
  "K6w3H9pL2vN7": { method: "GET", path: "/api/admin/testimonials/sync" },
  "D5x8Q1mT4rV6": { method: "POST", path: "/api/admin/testimonials/sync" },
  "T9q4M2xV7bL3": { method: "GET", path: "/api/admin/team" },
  "W5n8H1cK6zR4": { method: "POST", path: "/api/admin/team" },
  "N2v6Z9kQ4tH1": { method: "GET", path: "/api/admin/prices" },
  "G5t2Y8mK3rX6": { method: "GET", path: "/api/admin/hardware" },
  "H3d8Y5qN2sW7": { method: "GET", path: "/api/offers/codes" },
  "B2w9F4mS7hJ6": { method: "POST", path: "/api/admin/coupon-usage" },
  "Q4r8S2nV6kT9": { method: "GET", path: "/api/admin/qr-scans" },
  "S7h4B1nW9cZ2": { method: "POST", path: "/api/admin/hardware" },
  "E8c4R1pW7mL3": { method: "POST", path: "/api/admin/prices" },
  "C5t9W2yM6kD8": { method: "POST", path: "/api/admin/chats" },
  "P3s7K1mW8xQ4": { method: "POST", path: "/api/auth/phone" },
  "M8b5C1qJ7yL2": { method: "POST", path: "/api/account/phone" },
  "J5w2D8kM3zT7": { method: "GET", path: "/api/admin/loyalty" },
  "V9n4X1rQ6bH3": { method: "POST", path: "/api/admin/loyalty" },
  "L4g8P2nT6vK1": { method: "GET", path: "/api/admin/legal" },
  "S7r3Q9mB5xD2": { method: "POST", path: "/api/admin/legal" },
  "Z6n2K9cR4vP1": { method: "POST", path: "/api/mail" },
  "Y3d7N5qV1mP8": { method: "POST", path: "/api/pay" },
  "H6k2B9tW4xC7": { method: "POST", path: "/api/admin/payments" },
  "N8q4B1tK7mD2": { method: "POST", path: "/api/admin/request-workflow" },
  "R6p2C9wT4kH1": { method: "POST", path: "/api/pay/coupon" },
  "O3bQ7mT5xK2n": { method: "POST", path: "/api/admin/outreach" },
  "K7m2Q9xV4cT8": { method: "POST", path: "/api/auth/mobile" },
  "R3v8N5pH1wD6": { method: "GET", path: "/api/account/records" },
  "B9t4L7qM2xF5": { method: "POST", path: "/api/account/records" },
  "W6c1X8kT3nJ9": { method: "GET", path: "/api/account/verify-status" },
  "H4p7D2vR9mQ1": { method: "POST", path: "/api/account/verify-status" },
  "Z2n5G8yL6bK3": { method: "GET", path: "/api/admin/claims" },
  "F8q3V6cW1tN7": { method: "POST", path: "/api/admin/claims" },
} as const;

function stringValue(input: Record<string, unknown>, key: string, max = 200) {
  const value = input[key];
  return typeof value === "string" ? value.slice(0, max) : "";
}

function operationTarget(operation: string, input: Record<string, unknown>) {
  if (Object.hasOwn(OPS, operation)) return OPS[operation as keyof typeof OPS];
  switch (operation) {
    case "Q3x8M5wT2kB7": {
      // Message centre reads: list, one ticket, counters.
      const query = new URLSearchParams();
      for (const [key, max] of [["view", 12], ["box", 24], ["q", 80], ["id", 60], ["before", 40]] as const) { const value = stringValue(input, key, max); if (value) query.set(key, value); }
      return { method: "GET", path: `/api/mail?${query.toString()}` };
    }
    case "U3j7P1xH5nQ9": {
      const phone = stringValue(input, "phone", 30);
      return { method: "GET", path: `/api/admin/chats${phone ? `?phone=${encodeURIComponent(phone)}` : ""}` };
    }
    case "Y6k1D8pT3vN5": {
      const query = new URLSearchParams();
      for (const [key, max] of [["coupon", 60], ["user", 60], ["q", 60]] as const) { const value = stringValue(input, key, max); if (value) query.set(key, value); }
      return { method: "GET", path: `/api/admin/coupon-usage?${query.toString()}` };
    }
    case "A8s5L2nR7vE4": {
      const status = stringValue(input, "status", 20);
      return { method: "GET", path: `/api/admin/payments?status=${encodeURIComponent(status)}` };
    }
    case "X1m7C4pV8qB3": {
      const id = stringValue(input, "id", 80);
      return { method: "DELETE", path: `/api/addresses?id=${encodeURIComponent(id)}` };
    }
    case "G8q4T1vM6rC0": {
      const reference = stringValue(input, "reference", 80);
      return { method: "POST", path: `/api/requests/${encodeURIComponent(reference)}/cancel`, body: { reason: input.reason } };
    }
    case "F7m3Q8wN2kC5": {
      const reference = stringValue(input, "reference", 80);
      const body = Object.fromEntries(Object.entries(input).filter(([key]) => key !== "reference"));
      return { method: "POST", path: `/api/requests/${encodeURIComponent(reference)}/followup`, body };
    }
    case "R1k5V8nD3sJ9": {
      const id = stringValue(input, "id", 80);
      const body = Object.fromEntries(Object.entries(input).filter(([key]) => key !== "id"));
      return { method: "PATCH", path: `/api/admin/jobs/${encodeURIComponent(id)}`, body };
    }
    case "C9p2W6mH4xB8": {
      const q = stringValue(input, "q", 100);
      return { method: "GET", path: `/api/admin/pan-imports?q=${encodeURIComponent(q)}` };
    }
    case "F4m9C1xT6qH3": {
      const reference = stringValue(input, "reference", 80);
      return { method: "GET", path: `/api/internal/request-detail?reference=${encodeURIComponent(reference)}` };
    }
    case "J2w7L5pD9nV4": {
      const q = stringValue(input, "q", 80);
      const status = stringValue(input, "status", 40);
      return { method: "GET", path: `/api/internal/admin-snapshot?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}` };
    }
    case "I5x2N8kQ3wT6": {
      const params = new URLSearchParams();
      for (const key of ["category", "leadTab", "leadScope", "leadPage"]) { const value = stringValue(input, key, 20); if (value) params.set(key, value); }
      if (input.count) params.set("count", "1");
      return { method: "GET", path: `/api/admin/inbox?${params.toString()}` };
    }
    case "Z5b8N2qT6wK1": {
      const id = stringValue(input, "id", 40);
      return { method: "GET", path: `/api/admin/coupon-batches${id ? `?id=${encodeURIComponent(id)}` : ""}` };
    }
    case "W8r2T5yN1cF6": {
      const params = new URLSearchParams();
      for (const key of ["q", "service", "sort", "key"]) { const value = stringValue(input, key, 80); if (value) params.set(key, value); }
      if (input.imports) params.set("imports", "1");
      return { method: "GET", path: `/api/admin/records?${params.toString()}` };
    }
    case "B5dY8rN2cV6w": {
      const query = new URLSearchParams();
      for (const [key, max] of [["view", 12], ["range", 8], ["month", 3], ["q", 80], ["template", 40], ["days", 3], ["vehicle", 8]] as const) { const value = stringValue(input, key, max); if (value) query.set(key, value); }
      if (input.overdue) query.set("overdue", "1");
      return { method: "GET", path: `/api/admin/outreach?${query.toString()}` };
    }
    case "D4q8M2wS7kF1": {
      const q = stringValue(input, "q", 80);
      const consent = stringValue(input, "consent", 20);
      return { method: "GET", path: `/api/admin/contacts?q=${encodeURIComponent(q)}&consent=${encodeURIComponent(consent)}` };
    }
    case "C2m7R4vN9kP6": {
      const id=stringValue(input,"id",80);
      const q=stringValue(input,"q",80);
      return {method:"GET",path:`/api/admin/customers?${id?`id=${encodeURIComponent(id)}`:`q=${encodeURIComponent(q)}&archived=${input.archived?"1":"0"}&includeTeam=${input.includeTeam===false?"0":"1"}`}`};
    }
    case "B6r1K8mQ3cT9": {
      const id = stringValue(input, "id", 80);
      return { method: "GET", path: `/api/internal/admin-request-detail?id=${encodeURIComponent(id)}` };
    }
    case "X3n6Q1vT8mK4": {
      const reference = stringValue(input, "reference", 80);
      return { method: "GET", path: `/api/requests/${encodeURIComponent(reference)}/review` };
    }
    case "Y7k2V5pN9rD1": {
      const reference = stringValue(input, "reference", 80);
      const body = Object.fromEntries(Object.entries(input).filter(([key]) => key !== "reference"));
      return { method: "POST", path: `/api/requests/${encodeURIComponent(reference)}/review`, body };
    }
    default:
      return null;
  }
}


const PAGED_OPERATIONS = new Set([
  "D4q8M2wS7kF1", "C2m7R4vN9kP6", "W8r2T5yN1cF6", "C9p2W6mH4xB8",
  "Y6k1D8pT3vN5", "A8s5L2nR7vE4", "B5dY8rN2cV6w", "L9w5A3sJ7qP2", "J2w7L5pD9nV4",
]);

/** Forward only the pagination fields consumed by each allowlisted read endpoint. */
export function targetFor(operation: string, input: Record<string, unknown>) {
  const target = operationTarget(operation, input);
  if (!target || !PAGED_OPERATIONS.has(operation)) return target;
  const [path, search] = target.path.split("?");
  const params = new URLSearchParams(search);
  const pageKeys = operation === "J2w7L5pD9nV4" ? ["jobPage", "requestPage"] : ["page"];
  for (const key of pageKeys) {
    const value = Number(input[key]);
    params.set(key, String(Number.isFinite(value) ? Math.max(0, Math.min(100000, Math.floor(value))) : 0));
  }
  const sizeKey = operation === "L9w5A3sJ7qP2" ? "size" : "pageSize";
  const size = Number(input[sizeKey]);
  params.set(sizeKey, String([10, 20, 50].includes(size) ? size : 20));
  if (operation === "L9w5A3sJ7qP2") {
    for (const [key, max] of [["userId", 80], ["q", 80]] as const) {
      const value = stringValue(input, key, max);
      if (value) params.set(key, value);
    }
  }
  return { ...target, path: `${path}?${params}` };
}
