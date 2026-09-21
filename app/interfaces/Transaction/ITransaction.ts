import {
  PaymentMethod,
  RecurrenceInterval,
  TransactionStatus,
  TransactionType,
} from "@/app/Enums/FinTrackEnums";
import { IExpenseRead } from "../Expenses/IExpenses";

export interface ITransactionPost {
  name: string;
  description?: string | null;
  totalAmount: number;
  type: TransactionType;
  categoryId: number;
  paymentMethod: PaymentMethod;
  isInstallment: boolean;
  totalInstallments: number | null;
  isRecurrent: boolean;
  recurrenceInterval: RecurrenceInterval | null;
  firstDueDate: string;
  userId: number;
}

export interface ITransactionUpdate {
  name: string;
  description?: string | null;
  totalAmount?: number;
  type: TransactionType;
  status: TransactionStatus;
  categoryID: number;
  paymentMethod: PaymentMethod;
  cancellationDate?: string | null;
}

export interface ITransactionRead {
  transactionID: number;
  name: string;
  description?: string | null;
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
  createdAtUtc: string;
  expenses: IExpenseRead[];
}
