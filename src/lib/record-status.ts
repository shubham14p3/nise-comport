/** Stages a customer's work can be in, in the order staff use them. Shared by the server and the records screen. */
export const RECORD_STATUSES: Record<string, string> = {
  open: "Open",
  pending: "Pending",
  verification: "Verification",
  dispatch: "Dispatch",
  delivered: "Completed",
  document_required: "Document required",
  pending_client: "Pending from client",
  draft: "Draft",
};
export const RECORD_STATUS_KEYS = Object.keys(RECORD_STATUSES);

/** Records dated before this are finished work: they are stored and shown as Completed. */
export const COMPLETED_BEFORE = "2026-05-01";
