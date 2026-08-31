import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";
import {
  IDebt,
  IDebtCreate,
  IDebtUpdate,
  IDebtPaymentCreate,
  IDebtScheduleItem,
  IDebtSummary,
} from "@/app/interfaces/Debts/IDebt";

export const getDebtSummary = async (userId?: number): Promise<IDebtSummary> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/debts/user/${uid}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch debts summary", err);
    return {
      totalOriginalPrincipal: 0,
      totalRemainingBalance: 0,
      totalPaidAmount: 0,
      overallProgressPercentage: 0,
      totalMonthlyObligation: 0,
      weightedAverageInterestRate: 0,
      activeDebtsCount: 0,
      paidOffDebtsCount: 0,
      debts: [],
    };
  }
};

export const getDebtById = async (id: number, userId?: number): Promise<IDebt | null> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/debts/${id}?userId=${uid}`);
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch debt ${id}`, err);
    return null;
  }
};

export const getDebtSchedule = async (
  id: number,
  userId?: number
): Promise<IDebtScheduleItem[]> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/debts/${id}/schedule?userId=${uid}`);
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch schedule for debt ${id}`, err);
    return [];
  }
};

export const createDebt = async (data: IDebtCreate): Promise<IDebt> => {
  try {
    const response = await api.post("/debts", data);
    return response.data;
  } catch (err) {
    console.error("Failed to create debt", err);
    throw err;
  }
};

export const updateDebt = async (
  id: number,
  data: IDebtUpdate,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.put(`/debts/${id}?userId=${uid}`, data);
  } catch (err) {
    console.error(`Failed to update debt ${id}`, err);
    throw err;
  }
};

export const recordDebtPayment = async (
  id: number,
  data: IDebtPaymentCreate,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/debts/${id}/payments?userId=${uid}`, data);
  } catch (err) {
    console.error(`Failed to record debt payment for ${id}`, err);
    throw err;
  }
};

export const payoffDebt = async (id: number, userId?: number): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/debts/${id}/payoff?userId=${uid}`);
  } catch (err) {
    console.error(`Failed to payoff debt ${id}`, err);
    throw err;
  }
};

export const deleteDebt = async (id: number, userId?: number): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.delete(`/debts/${id}?userId=${uid}`);
  } catch (err) {
    console.error(`Failed to delete debt ${id}`, err);
    throw err;
  }
};
