export type InvoiceRow = {
  invoice_id: string;
  customer: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  region: string;
  date: string;
};