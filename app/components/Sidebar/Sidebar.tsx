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
    { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "expenses", icon: <CreditCardOutlined />, label: "Expenses" },
    { key: "calendar", icon: <CalendarOutlined />, label: "Calendar" },
    { key: "investments", icon: <RiseOutlined />, label: "Investments" },
    { key: "debts", icon: <AccountBookOutlined />, label: "Debts" },
    { key: "receivables", icon: <DollarOutlined />, label: "Receivables" },
    { key: "goals", icon: <RocketOutlined />, label: "Goals" },
    {
      key: "configuration",
      icon: <SettingOutlined />,
      label: "Configurations",
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
