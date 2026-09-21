import { PDFDocument } from "pdf-lib";

const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";

async function call(path, { cookie, ...options } = {}) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const response = await fetch(base + path, { ...options, headers });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} -> ${response.status}: ${JSON.stringify(data)}`);
  return { data, cookie: response.headers.get("set-cookie") || cookie };
}

async function makePdf() {
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  pdf.addPage([595, 842]);
  return pdf.save();
}

const registered = await call("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    name: "Print Smoke Customer",
    email: "print-smoke@example.test",
    password: "print-smoke-pass-123",
    whatsappConsent: false,
  }),
});
const customerCookie = registered.cookie;

const slots = await call("/api/print/pickup-slots");
if (!slots.data.slots?.length) throw new Error("No pickup slots generated");

const pdfBytes = await makePdf();
const form = new FormData();
form.append("files", new Blob([pdfBytes], { type: "application/pdf" }), "smoke-two-pages.pdf");
const uploaded = await call("/api/print/uploads", { method: "POST", body: form, cookie: customerCookie });
const upload = uploaded.data.files?.[0];
if (!upload || upload.totalPages !== 2) throw new Error(`Expected a two-page upload, got ${JSON.stringify(upload)}`);

const file = {
  uploadToken: upload.uploadToken,
  totalPages: upload.totalPages,
  selection: "1-2",
  colourSelection: "2",
  copies: 1,
  sides: "single",
  paperSize: "A4",
  orientation: "portrait",
};

const quoted = await call("/api/print/quote", {
  method: "POST",
  cookie: customerCookie,
  body: JSON.stringify({ files: [file], fulfilment: "pickup" }),
});
if (quoted.data.quote?.counts?.bw !== 1 || quoted.data.quote?.counts?.color !== 1) {
  throw new Error(`Unexpected quote: ${JSON.stringify(quoted.data)}`);
}

const created = await call("/api/print/orders", {
  method: "POST",
  cookie: customerCookie,
  body: JSON.stringify({
    files: [file],
    fulfilment: "pickup",
    pickupSlotId: slots.data.slots[0].id,
    paymentMethod: "pay_at_shop",
    acquisitionSource: "ci-smoke",
  }),
});
const number = created.data.order?.order_number;
if (!number) throw new Error(`Order creation failed: ${JSON.stringify(created.data)}`);

const ownerLogin = await call("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ identifier: "owner@example.test", password: "change-me-ci-123" }),
});
const ownerCookie = ownerLogin.cookie;

await call(`/api/staff/print/orders/${number}/mark-paid`, { method: "POST", cookie: ownerCookie });
for (const status of ["QUEUED", "PRINTING", "READY_FOR_PICKUP", "COMPLETED"]) {
  await call(`/api/staff/print/orders/${number}/status`, {
    method: "POST",
    cookie: ownerCookie,
    body: JSON.stringify({ status }),
  });
}

const customerOrder = await call(`/api/print/orders/${number}`, { cookie: customerCookie });
if (customerOrder.data.order?.status !== "COMPLETED") throw new Error("Order did not reach COMPLETED");

const wallet = await call("/api/wallet", { cookie: customerCookie });
if (!(wallet.data.balancePaise > 0)) throw new Error(`Expected cashback, got wallet ${JSON.stringify(wallet.data)}`);

console.log(JSON.stringify({
  ok: true,
  orderNumber: number,
  totalPaise: created.data.order.total_paise,
  cashbackBalancePaise: wallet.data.balancePaise,
}));
