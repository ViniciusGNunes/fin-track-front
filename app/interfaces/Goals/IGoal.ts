import { GoalCategory, GoalFrequency } from "../../Enums/FinTrackEnums";

export interface IGoal {
  goalID: number;
  userID: number;
  title: string;
  description?: string | null;
  category: GoalCategory;
  frequency: GoalFrequency;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  currency: string;
  linkedDebtID?: number | null;
  linkedDebtName?: string | null;
  linkedCategoryID?: number | null;
  linkedCategoryName?: string | null;
  targetDate?: string | null;
  autoTrack: boolean;
  isCompleted: boolean;
  pacingStatus: "OnTrack" | "BehindPace" | "OverBudget" | "Achieved";
  createdAtUtc: string;
  lastUpdatedUtc: string;
}

export interface IGoalCreate {
  userID: number;
  title: string;
  description?: string | null;
  category: GoalCategory;
  frequency: GoalFrequency;
  targetAmount: number;
  initialAmount?: number;
  currency?: string;
  linkedDebtID?: number | null;
  linkedCategoryID?: number | null;
  targetDate?: string | null;
  autoTrack?: boolean;
}

export interface IGoalUpdate {
  title: string;
  description?: string | null;
  category: GoalCategory;
  frequency: GoalFrequency;
  targetAmount: number;
  currentAmount?: number;
  currency?: string;
  linkedDebtID?: number | null;
  linkedCategoryID?: number | null;
  targetDate?: string | null;
  autoTrack: boolean;
  isCompleted: boolean;
}

export interface IGoalLogProgress {
  amount: number;
  isIncrement?: boolean;
}

export interface IGoalSummary {
  totalGoalsCount: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  monthlyInvestmentTarget: number;
  monthlyInvestmentActual: number;
  monthlyDebtReductionTarget: number;
  monthlyDebtReductionActual: number;
  overallProgressPercentage: number;
  goals: IGoal[];
}
