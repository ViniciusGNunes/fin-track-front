"use client";

import React from "react";
import { Layout, Button, Space, Avatar } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";

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
  username = "Alex Vance",
}) => {
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
          <span className={styles.username}>{username}</span>
        </Space>
      </Space>
    </AntHeader>
  );
};
