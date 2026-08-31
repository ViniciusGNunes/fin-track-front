import {
  DebtRateType,
  DebtType,
  RecurrenceInterval,
} from "../../Enums/FinTrackEnums";

export interface IDebtPayment {
  debtPaymentID: number;
  debtID: number;
  amount: number;
  principalAmount?: number | null;
  interestAmount?: number | null;
  paymentDate: string;
  expenseID?: number | null;
  notes?: string | null;
  createdAtUtc: string;
}

export interface IDebt {
  debtID: number;
  userID: number;
  name: string;
  issuer: string;
  debtType: DebtType;
  currency: string;
  originalPrincipal: number;
  remainingBalance: number;
  totalPaidAmount: number;
  progressPercentage: number;
  interestRate: number;
  rateType: DebtRateType;
  paymentFrequency: RecurrenceInterval;
  installmentAmount?: number | null;
  totalInstallments?: number | null;
  paidInstallments: number;
  startDate: string;
  dueDay?: number | null;
  maturityDate?: string | null;
  isPaidOff: boolean;
  autoGenerateExpenses: boolean;
  transactionID?: number | null;
  description?: string | null;
  createdAtUtc: string;
  lastUpdatedUtc: string;
  payments: IDebtPayment[];
}

export interface IDebtCreate {
  userID: number;
  name: string;
  issuer: string;
  debtType: DebtType;
  currency?: string;
  originalPrincipal: number;
  remainingBalance?: number | null;
  interestRate: number;
  rateType: DebtRateType;
  paymentFrequency: RecurrenceInterval;
  installmentAmount?: number | null;
  totalInstallments?: number | null;
  paidInstallments?: number;
  startDate?: string;
  dueDay?: number | null;
  maturityDate?: string | null;
  autoGenerateExpenses?: boolean;
  description?: string | null;
}

export interface IDebtUpdate {
  name: string;
  issuer: string;
  debtType: DebtType;
  currency?: string;
  remainingBalance?: number | null;
  interestRate: number;
  rateType: DebtRateType;
  paymentFrequency: RecurrenceInterval;
  installmentAmount?: number | null;
  totalInstallments?: number | null;
  dueDay?: number | null;
  maturityDate?: string | null;
  isPaidOff: boolean;
  description?: string | null;
}

export interface IDebtPaymentCreate {
  amount: number;
  principalAmount?: number | null;
  interestAmount?: number | null;
  paymentDate?: string;
  expenseID?: number | null;
  notes?: string | null;
}

export interface IDebtScheduleItem {
  installmentNumber: number;
  dueDate: string;
  scheduledPayment: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalanceAfter: number;
  isPaid: boolean;
}

export interface IDebtSummary {
  totalOriginalPrincipal: number;
  totalRemainingBalance: number;
  totalPaidAmount: number;
  overallProgressPercentage: number;
  totalMonthlyObligation: number;
  weightedAverageInterestRate: number;
  activeDebtsCount: number;
  paidOffDebtsCount: number;
  debts: IDebt[];
}
