import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";
import {
  IReceivable,
  IReceivableCreate,
  IReceivableUpdate,
  IReceivableSummary,
} from "@/app/interfaces/Receivables/IReceivable";

export const getReceivablesSummary = async (userId?: number): Promise<IReceivableSummary> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/receivables/user/${uid}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch receivables summary", err);
    return {
      totalPendingReceivables: 0,
      totalCollectedReceivables: 0,
      totalSharedExpenditures: 0,
      overallCollectionPercentage: 0,
      activeBillsCount: 0,
      settledBillsCount: 0,
      receivables: [],
      debtors: [],
    };
  }
};

export const getReceivableById = async (id: number, userId?: number): Promise<IReceivable | null> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    const response = await api.get(`/receivables/${id}?userId=${uid}`);
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch receivable ${id}`, err);
    return null;
  }
};

export const createReceivable = async (data: IReceivableCreate): Promise<IReceivable> => {
  try {
    const response = await api.post("/receivables", data);
    return response.data;
  } catch (err) {
    console.error("Failed to create receivable", err);
    throw err;
  }
};

export const updateReceivable = async (
  id: number,
  data: IReceivableUpdate,
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.put(`/receivables/${id}?userId=${uid}`, data);
  } catch (err) {
    console.error(`Failed to update receivable ${id}`, err);
    throw err;
  }
};

export const toggleReceivableItemPaid = async (
  itemId: number,
  data?: { isPaid?: boolean; amountPaid?: number; notes?: string },
  userId?: number
): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.post(`/receivables/items/${itemId}/toggle-paid?userId=${uid}`, data ?? {});
  } catch (err) {
    console.error(`Failed to toggle paid status for item ${itemId}`, err);
    throw err;
  }
};

export const deleteReceivable = async (id: number, userId?: number): Promise<void> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);

    await api.delete(`/receivables/${id}?userId=${uid}`);
  } catch (err) {
    console.error(`Failed to delete receivable ${id}`, err);
    throw err;
  }
};
