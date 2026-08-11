import { ExpenseStatus } from "@/app/Enums/FinTrackEnums";

export interface IExpenseRead {
  expenseID: number;
  transactionID: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number; // Calculated property returned by JSON serializer
  dueDate: string;         // ISO 8601 string (e.g., "2026-08-07T00:00:00Z")
  paidDate?: string | null;
  currentInstallment: number;
  status: ExpenseStatus;
}