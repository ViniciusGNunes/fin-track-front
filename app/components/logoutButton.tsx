import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/users/logout");
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return <button onClick={handleLogout}>Log Out</button>;
}
