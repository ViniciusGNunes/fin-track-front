import {
  PaymentMethod,
  RecurrenceInterval,
  TransactionStatus,
  TransactionType,
} from "@/app/Enums/FinTrackEnums";
import { IExpenseRead } from "../Expenses/IExpenses";

export interface ITransactionPost {
  name: string;
  totalAmount: number;
  type: TransactionType;
  categoryId: number;
  paymentMethod: PaymentMethod;
  isInstallment: boolean;
  totalInstallments: number | null;
  isRecurrent: boolean;
  recurrenceInterval: RecurrenceInterval | null;
  firstDueDate: Date;
  userId: number;
}

export interface ITransactionRead {
  transactionID: number;
  name: string;
  totalAmount: number;
  type: TransactionType;
  status: TransactionStatus;
  categoryID: number;
  categoryName: string;
  paymentMethod: PaymentMethod;
  isInstallment: boolean;
  totalInstallments: number;
  isRecurrent: boolean;
  recurrenceInterval: RecurrenceInterval;
  recurrenceTargetDay?: number | null;
  userID: number;
  createdAtUtc: string; // ISO 8601 string from DateTime
  expenses: IExpenseRead;
}