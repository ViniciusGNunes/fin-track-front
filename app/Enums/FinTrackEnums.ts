export enum PaymentMethod {
  Cash = 1,
  CreditCard = 2,
  DebitCard = 3,
  BankTransfer = 4,
  Pix = 5,
}

export enum RecurrenceInterval {
  None = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
  Yearly = 4,
}

export enum TransactionType {
  Expense = 1,
  Income = 2,
}

export enum TransactionStatus {
  Active = 1,
  Completed = 2,
  Cancelled = 3,
  Refunded = 4,
  PartiallyRefunded = 5,
}

export enum ExpenseStatus {
  Pending = 1,
  PartiallyPaid = 2,
  Paid = 3,
  Overdue = 4,
  Cancelled = 5,
  PartiallyRefunded = 6,
  Refunded = 7,
}

export enum TimeCategory{
  Last = 1,
  Current = 2,
  Next = 3
}

export enum TimePeriod{
  Day = 1,
  Week = 2,
  TwoWeeks = 3,
  Month = 4,
  Year = 5
}

export enum InvestmentType {
  FixedIncome = 0,
  VariableIncome = 1,
  Crypto = 2,
}

export enum FixedRateType {
  Prefixado = 0,
  Selic_CDI = 1,
  IPCA_Plus = 2,
}

export enum InvestmentTransactionType {
  Buy = 0,
  Sell = 1,
  Liquidate = 2,
  Dividend = 3,
  StockSplit = 4,
}

export enum DebtType {
  Personal = 0,
  Bank = 1,
  Student = 2,
  Financing_Mortgage = 3,
  CreditCard = 4,
  Other = 5,
}

export enum DebtRateType {
  FixedAnnual = 0,
  FixedMonthly = 1,
  CDI_Linked = 2,
  IPCA_Linked = 3,
}

export enum GoalCategory {
  MonthlyInvestment = 0,
  MonthlyDebtReduction = 1,
  ExpenseCap = 2,
  TargetSavings = 3,
  PortfolioMilestone = 4,
}

export enum GoalFrequency {
  Monthly = 0,
  OneTimeTarget = 1,
  Yearly = 2,
}
