export const PRINT_ORDER_STATUS_META = {
  paid: { label: "Paid", nextAction: "Prepare print job" },
  queued: { label: "Ready to print", nextAction: "Start printing" },
  printing: { label: "Printing", nextAction: "Mark ready" },
  needs_customer_confirmation: { label: "Needs customer", nextAction: "Send clarification request" },
  ready_for_pickup: { label: "Ready for pickup", nextAction: "Verify pickup code" },
  out_for_delivery: { label: "Out for delivery", nextAction: "Confirm delivery" },
  completed: { label: "Completed", nextAction: "No action" },
};

export function buildPrintJobSheet(order) {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    fulfilment: order.fulfilment,
    pickupSlot: order.pickupSlot,
    paymentStatus: order.paymentStatus,
    files: (order.files || []).map((item) => ({
      name: item.name,
      pages: item.selection,
      colourPages: item.colourSelection || "None",
      copies: item.copies || 1,
      sides: item.sides || "single",
      paperSize: item.paperSize || "A4",
    })),
  };
}
