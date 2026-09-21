import { ExpenseStatus } from "@/app/Enums/FinTrackEnums";

export interface IExpenseRead {
  expenseID: number;
  transactionID: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paidDate?: string | null;
  currentInstallment: number;
  status: ExpenseStatus;
}