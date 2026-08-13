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