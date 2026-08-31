import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";
import {
  IGoal,
  IGoalCreate,
  IGoalUpdate,
  IGoalLogProgress,
  IGoalSummary,
} from "@/app/interfaces/Goals/IGoal";

export const getGoalsSummary = async (userId?: number): Promise<IGoalSummary> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/goals/user/${uid}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch goals summary", err);
    return {
      totalGoalsCount: 0,
      activeGoalsCount: 0,
      completedGoalsCount: 0,
      monthlyInvestmentTarget: 0,
      monthlyInvestmentActual: 0,
      monthlyDebtReductionTarget: 0,
      monthlyDebtReductionActual: 0,
      overallProgressPercentage: 0,
      goals: [],
    };
  }
};

export const getGoalById = async (id: number, userId?: number): Promise<IGoal | null> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/goals/${id}?userId=${uid}`);
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch goal ${id}`, err);
    return null;
  }
};

export const createGoal = async (data: IGoalCreate): Promise<IGoal> => {
  try {
    const response = await api.post("/goals", data);
    return response.data;
  } catch (err) {
    console.error("Failed to create goal", err);
    throw err;
  }
};

export const updateGoal = async (
  id: number,
  data: IGoalUpdate,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.put(`/goals/${id}?userId=${uid}`, data);
  } catch (err) {
    console.error(`Failed to update goal ${id}`, err);
    throw err;
  }
};

export const logGoalProgress = async (
  id: number,
  data: IGoalLogProgress,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/goals/${id}/progress?userId=${uid}`, data);
  } catch (err) {
    console.error(`Failed to log progress for goal ${id}`, err);
    throw err;
  }
};

export const deleteGoal = async (id: number, userId?: number): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.delete(`/goals/${id}?userId=${uid}`);
  } catch (err) {
    console.error(`Failed to delete goal ${id}`, err);
    throw err;
  }
};
