import {
  FixedRateType,
  InvestmentType,
  InvestmentTransactionType,
} from "../../Enums/FinTrackEnums";

export interface IInvestmentTransaction {
  investmentTransactionID: number;
  investmentID: number;
  transactionType: InvestmentTransactionType;
  amount: number;
  quantity?: number | null;
  unitPrice?: number | null;
  transactionDate: string;
  notes?: string | null;
}

export interface IInvestment {
  investmentID: number;
  userID: number;
  name: string;
  ticker?: string | null;
  investmentType: InvestmentType;
  currency: string;
  totalInvested: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercentage: number;
  quantity?: number | null;
  purchasePricePerUnit?: number | null;
  currentPricePerUnit?: number | null;
  rateType?: FixedRateType | null;
  annualRate?: number | null;
  isTaxExempt: boolean;
  startDate: string;
  maturityDate?: string | null;
  isLiquidated: boolean;
  lastUpdatedUtc: string;
  transactions: IInvestmentTransaction[];
}

export interface IInvestmentCreate {
  name: string;
  ticker?: string | null;
  investmentType: InvestmentType;
  currency?: string;
  totalInvested: number;
  quantity?: number | null;
  purchasePricePerUnit?: number | null;
  rateType?: FixedRateType | null;
  annualRate?: number | null;
  isTaxExempt?: boolean;
  startDate?: string;
  maturityDate?: string | null;
  fromCashBalance?: boolean;
  userID: number;
}

export interface IInvestmentUpdate {
  name: string;
  ticker?: string | null;
  currency?: string;
  quantity?: number | null;
  purchasePricePerUnit?: number | null;
  currentPricePerUnit?: number | null;
  rateType?: FixedRateType | null;
  annualRate?: number | null;
  isTaxExempt?: boolean;
  maturityDate?: string | null;
}

export interface IInvestmentTransactionCreate {
  transactionType: InvestmentTransactionType;
  amount: number;
  quantity?: number | null;
  unitPrice?: number | null;
  fromCashBalance?: boolean;
  transactionDate?: string;
  notes?: string | null;
}

export interface IInvestmentGrowthPoint {
  date: string;
  investedAmount: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercentage: number;
}

export interface IPortfolioCashMovement {
  amount: number;
  currency?: string;
  notes?: string | null;
}

export interface IPortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLossAmount: number;
  totalProfitLossPercentage: number;
  unallocatedCash: number;
  cashBalances?: Record<string, number>;
  usdExchangeRate?: number;
  eurExchangeRate?: number;
  investments: IInvestment[];
}
