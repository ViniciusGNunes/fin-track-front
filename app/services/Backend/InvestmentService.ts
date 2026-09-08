import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";
import {
  IInvestment,
  IInvestmentCreate,
  IInvestmentUpdate,
  IInvestmentTransactionCreate,
  IInvestmentGrowthPoint,
  IPortfolioSummary,
  IPortfolioCashMovement,
} from "@/app/interfaces/Investments/IInvestment";

export const getPortfolioSummary = async (userId?: number): Promise<IPortfolioSummary> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/investments/user/${uid}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch portfolio summary", err);
    return {
      totalInvested: 0,
      totalCurrentValue: 0,
      totalProfitLossAmount: 0,
      totalProfitLossPercentage: 0,
      unallocatedCash: 0,
      cashBalances: { BRL: 0 },
      usdExchangeRate: 5.60,
      eurExchangeRate: 6.10,
      investments: [],
    };
  }
};

export const getInvestmentById = async (id: number, userId?: number): Promise<IInvestment | null> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/investments/${id}?userId=${uid}`);
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch investment ${id}`, err);
    return null;
  }
};

export const getInvestmentGrowthHistory = async (
  id: number,
  userId?: number
): Promise<IInvestmentGrowthPoint[]> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/investments/${id}/growth?userId=${uid}`);
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch growth history for investment ${id}`, err);
    return [];
  }
};

export const createInvestment = async (data: IInvestmentCreate): Promise<IInvestment> => {
  try {
    const response = await api.post("/investments", data);
    return response.data;
  } catch (err) {
    console.error("Failed to create investment", err);
    throw err;
  }
};

export const updateInvestment = async (
  id: number,
  data: IInvestmentUpdate,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.put(`/investments/${id}?userId=${uid}`, data);
  } catch (err) {
    console.error(`Failed to update investment ${id}`, err);
    throw err;
  }
};

export const addInvestmentTransaction = async (
  id: number,
  data: IInvestmentTransactionCreate,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/investments/${id}/transactions?userId=${uid}`, data);
  } catch (err) {
    console.error(`Failed to add transaction to investment ${id}`, err);
    throw err;
  }
};

export const liquidateInvestment = async (id: number, userId?: number): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/investments/${id}/liquidate?userId=${uid}`);
  } catch (err) {
    console.error(`Failed to liquidate investment ${id}`, err);
    throw err;
  }
};

export const depositPortfolioCash = async (
  data: IPortfolioCashMovement,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/investments/cash/deposit?userId=${uid}`, data);
  } catch (err) {
    console.error("Failed to deposit portfolio cash", err);
    throw err;
  }
};

export const withdrawPortfolioCash = async (
  data: IPortfolioCashMovement,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/investments/cash/withdraw?userId=${uid}`, data);
  } catch (err) {
    console.error("Failed to withdraw portfolio cash", err);
    throw err;
  }
};

export const deleteInvestment = async (id: number, userId?: number): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.delete(`/investments/${id}?userId=${uid}`);
  } catch (err) {
    console.error(`Failed to delete investment ${id}`, err);
    throw err;
  }
};
