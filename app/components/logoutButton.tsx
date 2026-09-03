import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "../lib/api";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      Cookies.remove("X-Access-Token");
      router.push("/");
    }
  };

  return <button onClick={handleLogout}>Log Out</button>;
}
