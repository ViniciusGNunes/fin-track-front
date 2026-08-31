import { api } from "@/app/lib/api";
import { getUserFromCookiesClient } from "../Frontend/tokenServicesClient";

export interface IUserProfile {
  userID: number;
  name: string;
  email: string;
}

export interface IUpdateUserProfile {
  userID: number;
  name: string;
  email: string;
}

export const getUserProfile = async (userId?: number): Promise<IUserProfile | null> => {
  try {
    const userInfo = getUserFromCookiesClient();
    const uid = userId ?? (userInfo?.id ? Number(userInfo.id) : 1);
    const response = await api.get(`/users/${uid}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch user profile", err);
    return null;
  }
};

export const updateUserProfile = async (data: IUpdateUserProfile): Promise<IUserProfile> => {
  try {
    const response = await api.put(`/users/${data.userID}`, data);
    return response.data;
  } catch (err) {
    console.error("Failed to update user profile", err);
    throw err;
  }
};
