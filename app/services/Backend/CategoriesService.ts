import { UserCookieInfo } from "@/app/(pages)/interfaces/UserCookieInfo";
import { api } from "@/app/lib/api";
import { getUserFromCookies } from "../Frontend/tokenServices";

export const getCategories = async () =>{
    const userInfo: UserCookieInfo|null = getUserFromCookies();

    if(userInfo == null){
        console.error("User not found")
        return null;
    }
    try{
        const response = await api.get(`/categories?userId=${userInfo.id}`);
        return response.data;
    } catch (error) {
        console.error("failed to fetch categories", error);
        return null;
    }
}