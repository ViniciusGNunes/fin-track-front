import {
  ITransactionPost,
  ITransactionUpdate,
} from "@/app/interfaces/Transaction/ITransaction";
import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";
import { TimeCategory, TimePeriod } from "@/app/Enums/FinTrackEnums";

export const postTransaction = async (transaction: ITransactionPost) => {
  try {
    const response = await api.post("/transactions", transaction);
    return response;
  } catch (err) {
    console.error("Failed to send transaction", err);
    throw err;
  }
};

export const updateTransaction = async (
  id: number,
  transaction: Partial<ITransactionUpdate>
) => {
  try {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  } catch (err) {
    console.error("Failed to update transaction", err);
    throw err;
  }
};

export const cancelTransaction = async (
  id: number,
  cancellationDate?: string
) => {
  try {
    const query = cancellationDate ? `?cancellationDate=${cancellationDate}` : "";
    const response = await api.post(`/transactions/${id}/cancel${query}`);
    return response.data;
  } catch (err) {
    console.error("Failed to cancel transaction", err);
    throw err;
  }
};

export const deleteTransaction = async (id: number) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  } catch (err) {
    console.error("Failed to delete transaction", err);
    throw err;
  }
};

export const payExpense = async (expenseId: number, paidDate?: string) => {
  try {
    const response = await api.post(`/expenses/${expenseId}/pay`, {
      paidDate: paidDate || new Date().toISOString(),
    });
    return response.data;
  } catch (err) {
    console.error("Failed to mark expense as paid", err);
    throw err;
  }
};

export const getTransactions = async (params?: {
  userId?: number;
  timeCategory?: TimeCategory;
  timePeriod?: TimePeriod;
}) => {
  try {
    const userInfo = getUserFromCookiesClient();
    const userId = params?.userId ?? (userInfo?.id ? Number(userInfo.id) : undefined);

    const query = new URLSearchParams();
    if (userId) query.append("userId", String(userId));
    if (params?.timeCategory !== undefined) query.append("timeCategory", String(params.timeCategory));
    if (params?.timePeriod !== undefined) query.append("timePeriod", String(params.timePeriod));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const response = await api.get(`/transactions${queryString}`);
    return response.data;
  } catch (err) {
    console.error("Failed to get transactions", err);
    return [];
  }
};


