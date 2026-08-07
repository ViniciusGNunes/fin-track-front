import {
  PaymentMethod,
  RecurrenceInterval,
  TransactionType,
} from "@/app/Enums/FinTrackEnums";

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
