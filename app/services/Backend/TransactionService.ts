import { ITransactionPost } from "@/app/interfaces/Transaction/ITransaction";
import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";

const userInfo = getUserFromCookiesClient();

export const postTransaction = async (transaction: ITransactionPost) => {
  try {
    const response = await api.post("/transactions", transaction);
    return response;
  } catch (err) {
    console.error("Failed to send transaction", err);
  }
};

export const getTransactions = async () => {
  try {
    const response = await api.get(`/transactions?userId=${userInfo?.id}`);
    return response.data;
  } catch (err) {
    console.error("Failed to get transactions", err);
  }
};
