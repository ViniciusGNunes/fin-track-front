import { UserCookieInfo } from "@/app/(pages)/interfaces/UserCookieInfo";

export function getUserFromCookies(
    cookieName: string = 'X-Access-Token'
): UserCookieInfo | null{
    
    if (typeof window === "undefined") return null;

    const match = document.cookie.split("; ")
    .find((row) => row.startsWith(`${cookieName}=`));

    if(!match) return null;

    try{
        const rawValue = match.split("=")[1];
        const parsed = JSON.parse(decodeURIComponent(rawValue));
        console.log(parsed)

        return{
            id: parsed.sub,
            email: parsed.email,
            name: parsed.name
        }
    }
    catch (error) {
        console.error("Error parsing cookies", error);
        return null;
    }
}