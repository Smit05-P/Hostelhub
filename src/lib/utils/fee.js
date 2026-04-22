/**
 * Computes the effective fee status.
 */
export function computeFeeStatus(fee) {
  if (fee.status === "Paid") return "Paid";
  const now = new Date();
  const due = fee.dueDate instanceof Date ? fee.dueDate : new Date(fee.dueDate);
  if (due < now) return "Overdue";
  return "Pending";
}
