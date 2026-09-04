"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  DashboardOutlined,
  CreditCardOutlined,
  RiseOutlined,
  AccountBookOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";

interface BottomNavProps {
  selectedKey?: string;
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  selectedKey = "dashboard",
  onOpenMore,
}) => {
  const router = useRouter();

  const navItems = [
    { key: "dashboard", label: "Geral", icon: <DashboardOutlined /> },
    { key: "expenses", label: "Despesas", icon: <CreditCardOutlined /> },
    { key: "investments", label: "Investir", icon: <RiseOutlined /> },
    { key: "debts", label: "Dívidas", icon: <AccountBookOutlined /> },
    { key: "more", label: "Mais", icon: <AppstoreOutlined />, isMore: true },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Navegação móvel">
      <div className={styles.navContainer}>
        {navItems.map((item) => {
          const isActive = !item.isMore && selectedKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.navButton} ${isActive ? styles.active : ""}`}
              onClick={() => {
                if (item.isMore) {
                  onOpenMore();
                } else {
                  router.push(`/${item.key}`);
                }
              }}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
              {isActive && <span className={styles.activeDot} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
