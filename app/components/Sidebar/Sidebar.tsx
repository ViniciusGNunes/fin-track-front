"use client";

import React from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  RiseOutlined,
  AccountBookOutlined,
  DollarOutlined,
  RocketOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import { useRouter } from "next/navigation";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  selectedKey?: string;
  onSelectKey?: (key: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  selectedKey = "dashboard",
  onSelectKey,
}) => {
  const router = useRouter();
  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Visão Geral" },
    { key: "expenses", icon: <CreditCardOutlined />, label: "Despesas" },
    { key: "calendar", icon: <CalendarOutlined />, label: "Calendário" },
    { key: "investments", icon: <RiseOutlined />, label: "Investimentos" },
    { key: "debts", icon: <AccountBookOutlined />, label: "Dívidas" },
    { key: "receivables", icon: <DollarOutlined />, label: "A Receber" },
    { key: "goals", icon: <RocketOutlined />, label: "Metas" },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Configurações",
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={styles.sider}
      width={240}
    >
      <div className={styles.logoContainer}>
        <div className={styles.logoBadge}>F</div>
        {!collapsed && <span className={styles.logoText}>FinTrack</span>}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          router.push(`/${key}`);
        }}
        items={menuItems}
        className={styles.menu}
      />
    </Sider>
  );
};
