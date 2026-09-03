"use client";

import React, { useEffect, useState } from "react";
import { Layout, Button, Space, Avatar, Tooltip, Popconfirm, message } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import { UserCookieInfo } from "@/app/interfaces/UserCookieInfo";
import { api } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  hasGoals?: boolean;
  onToggleGoals?: () => void;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserCookieInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUserInfo = () => {
      try {
        const info: UserCookieInfo | null = getUserFromCookiesClient();
        setUserInfo(info);
      } catch (err) {
        console.log("Failed to get user information:", err);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await api.post("/users/logout");
      Cookies.remove("X-Access-Token");
      message.success("Sessão encerrada com sucesso!");
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      Cookies.remove("X-Access-Token");
      // Even if backend fails, navigate back to landing page
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AntHeader className={styles.header}>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleCollapse}
        className={styles.triggerBtn}
      />

      <Space size="middle" className={styles.headerActions}>
        <Tooltip title="Notificações">
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{ color: "#94a3b8" }}
          />
        </Tooltip>

        <Space
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/settings")}
          className={styles.profileBadge}
        >
          <Avatar
            icon={<UserOutlined />}
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          />
          <span className={styles.username}>{userInfo?.name || "Usuário"}</span>
        </Space>

        <Popconfirm
          title="Sair do FinTrack"
          description="Tem certeza de que deseja sair e retornar à página inicial?"
          onConfirm={handleLogout}
          okText="Sair"
          cancelText="Cancelar"
          placement="bottomRight"
        >
          <Tooltip title="Sair / Encerrar Sessão">
            <Button
              type="text"
              icon={<LogoutOutlined />}
              loading={loggingOut}
              className={styles.logoutBtn}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    </AntHeader>
  );
};

