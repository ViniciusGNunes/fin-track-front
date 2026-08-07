import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";

export const getCategories = async () => {
  const userInfo = getUserFromCookiesClient();

  if (userInfo == null) {
    console.error("User not found");
    return null;
  }
  try {
    const response = await api.get(`/categories?userId=${userInfo.id}`);
    return response.data;
  } catch (error) {
    console.error("failed to fetch categories", error);
    return null;
  }
};
