export interface IReceivableItem {
  receivableItemID: number;
  receivableID: number;
  personName: string;
  amountOwed: number;
  amountPaid: number;
  isPaid: boolean;
  paidDate?: string | null;
  notes?: string | null;
  createdAtUtc: string;
}

export interface IReceivableItemCreate {
  personName: string;
  amountOwed: number;
  amountPaid?: number;
  isPaid?: boolean;
  paidDate?: string | null;
  notes?: string | null;
}

export interface IReceivableItemUpdate {
  receivableItemID?: number;
  personName: string;
  amountOwed: number;
  amountPaid?: number;
  isPaid: boolean;
  paidDate?: string | null;
  notes?: string | null;
}

export interface IReceivable {
  receivableID: number;
  userID: number;
  title: string;
  description?: string | null;
  totalAmount: number;
  myShareAmount: number;
  totalOwedByOthers: number;
  totalCollected: number;
  totalPending: number;
  progressPercentage: number;
  currency: string;
  dueDate?: string | null;
  isSettled: boolean;
  createdAtUtc: string;
  lastUpdatedUtc: string;
  items: IReceivableItem[];
}

export interface IReceivableCreate {
  userID: number;
  title: string;
  description?: string | null;
  totalAmount: number;
  myShareAmount?: number;
  currency?: string;
  dueDate?: string | null;
  items: IReceivableItemCreate[];
}

export interface IReceivableUpdate {
  title: string;
  description?: string | null;
  totalAmount: number;
  myShareAmount?: number;
  currency?: string;
  dueDate?: string | null;
  isSettled?: boolean;
  items: IReceivableItemUpdate[];
}

export interface IDebtorSummary {
  personName: string;
  totalOwed: number;
  totalPaid: number;
  totalPending: number;
  activeSharedBillsCount: number;
  settledSharedBillsCount: number;
  lastPaymentDate?: string | null;
}

export interface IReceivableSummary {
  totalPendingReceivables: number;
  totalCollectedReceivables: number;
  totalSharedExpenditures: number;
  overallCollectionPercentage: number;
  activeBillsCount: number;
  settledBillsCount: number;
  receivables: IReceivable[];
  debtors: IDebtorSummary[];
}
