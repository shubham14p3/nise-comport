const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export const printApi = {
  quote: (payload) => request("/api/print/quote", { method: "POST", body: JSON.stringify(payload) }),
  createOrder: (payload) => request("/api/print/orders", { method: "POST", body: JSON.stringify(payload) }),
  getMyOrders: () => request("/api/print/orders"),
  getOrder: (orderNumber) => request(`/api/print/orders/${encodeURIComponent(orderNumber)}`),
  getStaffQueue: () => request("/api/staff/print/orders"),
  updateStatus: (orderNumber, status, note) => request(`/api/staff/print/orders/${encodeURIComponent(orderNumber)}/status`, { method: "POST", body: JSON.stringify({ status, note }) }),
};
