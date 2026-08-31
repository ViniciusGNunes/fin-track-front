import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";
import ICategory from "@/app/interfaces/ICategory";

export type { ICategory };

export interface ICategoryCreate {
  name: string;
  colorHex?: string;
  icon?: string;
  userID?: number;
}

export interface ICategoryUpdate {
  name: string;
  colorHex?: string;
  icon?: string;
}

export const getCategories = async (): Promise<ICategory[]> => {
  const userInfo = getUserFromCookiesClient();

  if (userInfo == null) {
    console.error("User not found");
    return [];
  }
  try {
    const response = await api.get(`/categories?userId=${userInfo.id}`);
    return response.data || [];
  } catch (error) {
    console.error("failed to fetch categories", error);
    return [];
  }
};

export const createCategory = async (data: ICategoryCreate): Promise<ICategory> => {
  const userInfo = getUserFromCookiesClient();
  const payload = {
    ...data,
    userID: data.userID ?? (userInfo?.id ? Number(userInfo.id) : undefined),
  };
  const response = await api.post("/categories", payload);
  return response.data;
};

export const updateCategory = async (id: number, data: ICategoryUpdate): Promise<void> => {
  const userInfo = getUserFromCookiesClient();
  const uid = userInfo?.id ? Number(userInfo.id) : undefined;
  await api.put(`/categories/${id}?userId=${uid}`, data);
};

export const deleteCategory = async (id: number): Promise<void> => {
  const userInfo = getUserFromCookiesClient();
  const uid = userInfo?.id ? Number(userInfo.id) : undefined;
  await api.delete(`/categories/${id}?userId=${uid}`);
};

export const seedDefaultCategories = async (): Promise<void> => {
  await api.post("/categories/seed");
};
