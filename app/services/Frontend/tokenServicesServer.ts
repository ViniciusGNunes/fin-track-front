// app/services/Backend/tokenServicesServer.ts
import "server-only";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { UserCookieInfo } from "@/app/interfaces/UserCookieInfo";

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

/**
 * Reads and decodes the JWT cookie on the SERVER (Server Components, Route Handlers, Server Actions).
 */
export async function getUserFromCookiesServer(
  cookieName: string = "X-Access-Token",
): Promise<UserCookieInfo | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) return null;

    const parsed = jwtDecode<JwtPayload>(token);

    return {
      id: parsed.sub,
      email: parsed.email,
      name: parsed.name,
    };
  } catch (error) {
    console.error("Error decoding JWT on server:", error);
    return null;
  }
}
