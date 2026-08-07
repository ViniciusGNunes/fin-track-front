import { ITransactionPost } from "@/app/(pages)/interfaces/Transaction/ITransaction";
import { api } from "@/app/lib/api";

export const postTransaction = async (transaction: ITransactionPost) => {
  try {
    const response = await api.post("/transactions", transaction);
    console.log(response);
    return response;
  } catch (err) {
    console.error("Failed to send transaction", err);
  }
};
