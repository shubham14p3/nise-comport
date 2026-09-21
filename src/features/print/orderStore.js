const STORAGE_KEY = "nise-print-orders";

export function getPrintOrders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function savePrintOrder(order) {
  const orders = getPrintOrders();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...orders]));
  return order;
}

export function createPrintOrderNumber() {
  return `NISE-P-${Date.now().toString().slice(-7)}`;
}

export function updatePrintOrderStatus(orderNumber, status) {
  const orders = getPrintOrders().map((order) =>
    order.orderNumber === orderNumber
      ? { ...order, status, statusHistory: [...(order.statusHistory || []), { status, at: new Date().toISOString() }] }
      : order
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return orders.find((order) => order.orderNumber === orderNumber);
}
