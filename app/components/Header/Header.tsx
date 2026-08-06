"use client";

import React, { useEffect, useState } from "react";
import { Layout, Button, Space, Avatar } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import { UserCookieInfo } from "@/app/(pages)/interfaces/UserCookieInfo";

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  hasGoals: boolean;
  onToggleGoals: () => void;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
  hasGoals,
  onToggleGoals,
}) => {
  const [userInfo, setUserInfo] = useState<UserCookieInfo|null>(null);

  useEffect(() => {
    const userInfo: UserCookieInfo|null = getUserFromCookiesClient();
    setUserInfo(userInfo)
    console.log(userInfo)
  },[])

  return (
    <AntHeader className={styles.header}>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleCollapse}
        className={styles.triggerBtn}
      />

      <Space size="large" className={styles.headerActions}>
        <Button size="small" type="dashed" onClick={onToggleGoals}>
          Toggle Goals View State ({hasGoals ? "Active" : "Empty"})
        </Button>

        <Button type="text" icon={<BellOutlined />} />

        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#008d0a" }}
          />
          <span className={styles.username}>{userInfo?.name}</span>
        </Space>
      </Space>
    </AntHeader>
  );
};
