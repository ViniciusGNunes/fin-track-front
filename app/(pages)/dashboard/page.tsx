"use client";

import React, { useState } from "react";
import {
  ConfigProvider,
  Layout,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Empty,
  theme,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  AimOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";

const { Content } = Layout;

// Sample activity entries
const recentActivity = [
  {
    key: "1",
    date: "2026-07-25",
    description: "Tech Corp Retainer",
    category: "Receivables",
    amount: "+$4,200.00",
    status: "Received",
  },
  {
    key: "2",
    date: "2026-07-24",
    description: "SaaS Infrastructure",
    category: "Expenses",
    amount: "-$312.40",
    status: "Completed",
  },
  {
    key: "3",
    date: "2026-07-22",
    description: "SPY ETF Buy Order",
    category: "Investments",
    amount: "-$1,500.00",
    status: "Completed",
  },
  {
    key: "4",
    date: "2026-07-20",
    description: "Apple Inc Dividend",
    category: "Dividends",
    amount: "+$142.50",
    status: "Received",
  },
  {
    key: "5",
    date: "2026-07-18",
    description: "Business Loan Payment",
    category: "Debts",
    amount: "-$650.00",
    status: "Pending",
  },
];

const columns = [
  { title: "Date", dataIndex: "date", key: "date" },
  { title: "Description", dataIndex: "description", key: "description" },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
    render: (cat: string) => <Tag color="dark">{cat}</Tag>,
  },
  {
    title: "Amount",
    dataIndex: "amount",
    key: "amount",
    render: (amt: string) => (
      <span
        className={
          amt.startsWith("+") ? styles.positiveText : styles.negativeText
        }
      >
        {amt}
      </span>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      let color = "default";
      if (status === "Received" || status === "Completed") color = "success";
      if (status === "Pending") color = "warning";
      return <Tag color={color}>{status}</Tag>;
    },
  },
];

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [hasGoals, setHasGoals] = useState(true);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#008d0a",
          colorBgBase: "#0d1117",
          colorBgContainer: "#161b22",
          colorBorderSecondary: "#21262d",
          borderRadius: 8,
        },
      }}
    >
      <Layout className={styles.layout}>
        {/* Modular Sidebar Component */}
        <Sidebar
          collapsed={collapsed}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
        />

        <Layout className={styles.mainLayout}>
          {/* Modular Header Component */}
          <Header
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            hasGoals={hasGoals}
            onToggleGoals={() => setHasGoals(!hasGoals)}
            username="Alex Vance"
          />

          {/* Main Content Area */}
          <Content className={styles.content}>
            <div className={styles.pageHeader}>
              <h2>Overview</h2>
              <p>
                Performance stats and financial activity breakdown across your
                accounts.
              </p>
            </div>

            {/* Metrics Section */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={12} lg={6}>
                <Card title="Total Monthly Expenses" bordered={false}>
                  <Statistic
                    value={3840.5}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: "#ff4d4f" }}
                  />
                  <span className={styles.trendDown}>
                    <ArrowDownOutlined /> 4.2% from last month
                  </span>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card title="Total Investments" bordered={false}>
                  <Statistic
                    value={84250.0}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: "#008d0a" }}
                  />
                  <div className={styles.statDetailGroup}>
                    <span className={styles.trendUp}>
                      <ArrowUpOutlined /> +$6,420.00 (+8.2%)
                    </span>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card title="Total Dividends" bordered={false}>
                  <Statistic
                    value={1280.4}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: "#008d0a" }}
                  />
                  <span className={styles.trendUp}>
                    <ArrowUpOutlined /> +14.5% vs last month
                  </span>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card title="Total Debt" bordered={false}>
                  <Statistic value={14500.0} precision={2} prefix="$" />
                  <span className={styles.trendUp}>
                    <ArrowDownOutlined /> Shrunk by 5.8%
                  </span>
                </Card>
              </Col>
            </Row>

            {/* Tables & Widgets */}
            <Row gutter={[16, 16]} className={styles.middleRow}>
              <Col xs={24} lg={16}>
                <Card title="Recent Activity" bordered={false}>
                  <Table
                    dataSource={recentActivity}
                    columns={columns}
                    pagination={false}
                    size="middle"
                  />
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card
                  title="Monthly Goals & Health"
                  bordered={false}
                  className={styles.goalCard}
                >
                  {hasGoals ? (
                    <div className={styles.goalsContainer}>
                      <div className={styles.goalItem}>
                        <div className={styles.goalLabel}>
                          <span>Monthly Savings Target ($3,000)</span>
                          <span>80%</span>
                        </div>
                        <Progress
                          percent={80}
                          strokeColor="#008d0a"
                          showInfo={false}
                        />
                      </div>

                      <div className={styles.goalItem}>
                        <div className={styles.goalLabel}>
                          <span>Debt Reduction Target</span>
                          <span>65%</span>
                        </div>
                        <Progress
                          percent={65}
                          strokeColor="#008d0a"
                          showInfo={false}
                        />
                      </div>

                      <div className={styles.goalItem}>
                        <div className={styles.goalLabel}>
                          <span>Expense Cap Limit ($4,500)</span>
                          <span>85%</span>
                        </div>
                        <Progress
                          percent={85}
                          strokeColor="#faad14"
                          showInfo={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyGoalsState}>
                      <Empty
                        image={
                          <AimOutlined
                            style={{ fontSize: 40, color: "#008d0a" }}
                          />
                        }
                        description={
                          <div className={styles.emptyText}>
                            <h4>No Active Goals Set</h4>
                            <p>
                              Track your targets here! Head over to the{" "}
                              <strong>Goals</strong> tab to define custom
                              financial milestones.
                            </p>
                          </div>
                        }
                      >
                        <Button type="primary">Set Your First Goal</Button>
                      </Empty>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
