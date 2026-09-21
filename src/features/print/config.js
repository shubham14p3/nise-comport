export const PRINT_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export const PRINT_LIMITS = {
  maxFiles: 20,
  maxFileSizeMb: 25,
};

export const BW_PRICING_TIERS = [
  { min: 1, max: 10, pricePerPage: 5 },
  { min: 11, max: 50, pricePerPage: 3 },
  { min: 51, max: Infinity, pricePerPage: 2 },
];

export const PRINT_OPTIONS = {
  colorModes: ["bw", "color"],
  sides: ["single", "double"],
  paperSizes: ["A4", "A3"],
  orientations: ["portrait", "landscape"],
};

export const FULFILMENT_TYPES = ["pickup", "delivery"];

export const PRINT_ORDER_STATUSES = [
  "draft",
  "awaiting_payment",
  "paid",
  "queued",
  "printing",
  "needs_customer_confirmation",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
];
