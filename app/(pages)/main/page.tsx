"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { api } from "@/app/lib/api";

export default function MainDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api
      .get("/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Unauthorized or server error", err));
  }, []);

  return (
    <div>
      <h1>Protected Dashboard</h1>
      {/* Render secure data here */}
    </div>
  );
}
