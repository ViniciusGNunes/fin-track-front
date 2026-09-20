import { jwtDecode } from "jwt-decode";
import { UserCookieInfo } from "@/app/interfaces/UserCookieInfo";

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export function getUserFromCookiesClient(
  cookieName: string = "X-Access-Token",
): UserCookieInfo | null {
  if (typeof window === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${cookieName}=`));

  if (!match) return null;

  try {
    const rawToken = match.substring(match.indexOf("=") + 1).trim();
    const cleanToken = decodeURIComponent(rawToken).replace(/^"|"$/g, "");

    const parsed = jwtDecode<JwtPayload>(cleanToken);

    return {
      id: parsed.sub,
      email: parsed.email,
      name: parsed.name,
    };
  } catch (error) {
    console.error("Error decoding JWT on client:", error);
    return null;
  }
}
