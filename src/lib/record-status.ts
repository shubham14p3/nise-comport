/** Stages a customer's work can be in. Shared by the server and the records screen. */
export const RECORD_STATUSES: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  waiting_documents: "Waiting for documents",
  submitted: "Submitted to office",
  completed: "Completed",
  cancelled: "Cancelled",
};
export const RECORD_STATUS_KEYS = Object.keys(RECORD_STATUSES);
