const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function parseResponse(response) {
  if (response.status === 204) return null;
  return response.json().catch(() => ({}));
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}

export const authApi = {
  me: () => request("/api/me"),
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
};

export const printApi = {
  config: () => request("/api/config/print"),
  pickupSlots: () => request("/api/print/pickup-slots"),
  upload: async (files) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return request("/api/print/uploads", { method: "POST", body: form });
  },
  quote: (payload) => request("/api/print/quote", { method: "POST", body: JSON.stringify(payload) }),
  createOrder: (payload) => request("/api/print/orders", { method: "POST", body: JSON.stringify(payload) }),
  getMyOrders: () => request("/api/print/orders"),
  getOrder: (orderNumber) => request(`/api/print/orders/${encodeURIComponent(orderNumber)}`),
  createPayment: (orderNumber) => request(`/api/print/orders/${encodeURIComponent(orderNumber)}/payment/create`, { method: "POST" }),
  confirmPayment: (orderNumber, payload) => request(`/api/print/orders/${encodeURIComponent(orderNumber)}/payment/confirm`, { method: "POST", body: JSON.stringify(payload) }),
  cancel: (orderNumber) => request(`/api/print/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST" }),
};

export const walletApi = {
  get: () => request("/api/wallet"),
  ledger: () => request("/api/wallet/ledger"),
};

export const notificationApi = {
  list: () => request("/api/notifications"),
  markRead: (id) => request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }),
};

export const staffApi = {
  queue: (status = "") => request(`/api/staff/print/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  order: (orderNumber) => request(`/api/staff/print/orders/${encodeURIComponent(orderNumber)}`),
  updateStatus: (orderNumber, status, note) => request(`/api/staff/print/orders/${encodeURIComponent(orderNumber)}/status`, { method: "POST", body: JSON.stringify({ status, note }) }),
  markPaid: (orderNumber) => request(`/api/staff/print/orders/${encodeURIComponent(orderNumber)}/mark-paid`, { method: "POST" }),
  downloadUrl: (fileId, mode) => `${API_BASE}/api/staff/print/files/${encodeURIComponent(fileId)}/download?mode=${encodeURIComponent(mode)}`,
};

export const adminApi = {
  config: () => request("/api/admin/config"),
  updateConfig: (key, value) => request(`/api/admin/config/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) }),
  createCoupon: (payload) => request("/api/admin/coupons", { method: "POST", body: JSON.stringify(payload) }),
};
