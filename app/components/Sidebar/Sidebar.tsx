"use client";

import React, { useEffect, useState } from "react";
import { Layout, Menu, Drawer } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  RiseOutlined,
  AccountBookOutlined,
  DollarOutlined,
  RocketOutlined,
  SettingOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import { useRouter } from "next/navigation";
import { BottomNav } from "../BottomNav/BottomNav";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    const handleOpen = () => setMobileOpen(true);
    const handleClose = () => setMobileOpen(false);

    window.addEventListener("toggle-mobile-menu", handleToggle);
    window.addEventListener("open-mobile-menu", handleOpen);
    window.addEventListener("close-mobile-menu", handleClose);

    return () => {
      window.removeEventListener("toggle-mobile-menu", handleToggle);
      window.removeEventListener("open-mobile-menu", handleOpen);
      window.removeEventListener("close-mobile-menu", handleClose);
    };
  }, []);

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

  const handleMenuClick = (key: string) => {
    setMobileOpen(false);
    if (onSelectKey) {
      onSelectKey(key);
    }
    router.push(`/${key}`);
  };

  return (
    <>
      {/* Desktop Sider */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={`${styles.sider} ${styles.desktopSider}`}
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
          onClick={({ key }) => handleMenuClick(key as string)}
          items={menuItems}
          className={styles.menu}
        />
      </Sider>

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={280}
        rootClassName={styles.mobileDrawerRoot}
        styles={{
          body: {
            padding: 0,
            background: "var(--bg-surface-subtle, #0f172a)",
          },
          wrapper: {
            background: "var(--bg-surface-subtle, #0f172a)",
          },
        }}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoBadge}>F</div>
            <span className={styles.logoText}>FinTrack</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <CloseOutlined />
          </button>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => handleMenuClick(key as string)}
          items={menuItems}
          className={styles.drawerMenu}
        />
      </Drawer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        selectedKey={selectedKey}
        onOpenMore={() => setMobileOpen(true)}
      />
    </>
  );
};
