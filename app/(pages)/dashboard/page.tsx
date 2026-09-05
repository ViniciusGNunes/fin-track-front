"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Skeleton,
} from "antd";
import {
  ArrowUpOutlined,
  AimOutlined,
  RiseOutlined,
  AccountBookOutlined,
  TeamOutlined,
  PlusOutlined,
  ReloadOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
import { FINTRACK_THEME, FINTRACK_LOCALE } from "@/app/lib/theme";
import { UserCookieInfo } from "../../interfaces/UserCookieInfo";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import { getGoalsSummary } from "@/app/services/Backend/GoalService";
import { IGoalSummary } from "@/app/interfaces/Goals/IGoal";
import { getPortfolioSummary } from "@/app/services/Backend/InvestmentService";
import { IPortfolioSummary } from "@/app/interfaces/Investments/IInvestment";
import { getDebtSummary } from "@/app/services/Backend/DebtService";
import { IDebtSummary } from "@/app/interfaces/Debts/IDebt";
import { getReceivablesSummary } from "@/app/services/Backend/ReceivableService";
import { IReceivableSummary } from "@/app/interfaces/Receivables/IReceivable";
import { getTransactions } from "@/app/services/Backend/TransactionService";
import { ITransactionRead } from "@/app/interfaces/Transaction/ITransaction";
import { TimeCategory, TimePeriod } from "@/app/Enums/FinTrackEnums";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Content } = Layout;

export default function DashboardPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [userInfo] = useState<UserCookieInfo | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return getUserFromCookiesClient();
      } catch {
        return null;
      }
    }
    return null;
  });

  // Live state from all modules
  const [goalsSummary, setGoalsSummary] = useState<IGoalSummary | null>(null);
  const [portfolio, setPortfolio] = useState<IPortfolioSummary | null>(null);
  const [debts, setDebts] = useState<IDebtSummary | null>(null);
  const [receivables, setReceivables] = useState<IReceivableSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<ITransactionRead[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const uid = userInfo?.id ? Number(userInfo.id) : undefined;

      const [goalsRes, portRes, debtRes, recRes, txRes] = await Promise.all([
        getGoalsSummary(uid),
        getPortfolioSummary(uid),
        getDebtSummary(uid),
        getReceivablesSummary(uid),
        getTransactions({
          userId: uid,
          timeCategory: TimeCategory.Current,
          timePeriod: TimePeriod.Month,
        }),
      ]);

      setGoalsSummary(goalsRes);
      setPortfolio(portRes);
      setDebts(debtRes);
      setReceivables(recRes);
      setRecentTransactions(Array.isArray(txRes) ? txRes.slice(0, 7) : []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate monthly expense sum from current transactions
  const monthlyExpenseTotal = recentTransactions
    .filter((t) => t.type === 1) // Expense
    .reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  // Table columns for Recent Transactions Activity
  const activityColumns = [
    {
      title: "Transação",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: ITransactionRead) => (
        <div>
          <span style={{ fontWeight: 600, color: "var(--text-primary, #f8fafc)" }}>{name}</span>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", marginTop: 2 }}>
            {dayjs(record.createdAtUtc).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Categoria",
      dataIndex: "category",
      key: "category",
      render: (cat: any) => (
        <Tag color="geekblue" style={{ borderRadius: 4 }}>
          {cat?.name || "Geral"}
        </Tag>
      ),
    },
    {
      title: "Valor",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amt: number, record: ITransactionRead) => {
        const isExpense = record.type === 1;
        return (
          <span
            style={{
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: isExpense ? "var(--color-danger, #f43f5e)" : "var(--color-success, #10b981)",
            }}
          >
            {isExpense ? "-R$ " : "+R$ "}
            {amt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: number) => {
        return status === 2 ? (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 4 }}>
            Concluído
          </Tag>
        ) : (
          <Tag color="processing" icon={<ClockCircleOutlined />} style={{ borderRadius: 4 }}>
            Ativo
          </Tag>
        );
      },
    },
  ];

  return (
    <ConfigProvider theme={FINTRACK_THEME} locale={FINTRACK_LOCALE}>
      <Layout className={styles.layout}>
        <Sidebar
          collapsed={collapsed}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
        />
        <Layout className={styles.mainLayout}>
          <Header
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
          <Content className={styles.content}>
            <div className={styles.pageHeader}>
              <div>
                <h2>Visão Geral Financeira</h2>
                <p>Inteligência consolidada em tempo real sobre seus investimentos, dívidas, contas a receber e metas.</p>
              </div>
              <div className={styles.headerActions}>
                <Button icon={<ReloadOutlined />} onClick={loadDashboardData} loading={loading}>
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Top Metrics Row */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              {/* 1. Investments Portfolio */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className={styles.metricCard}
                  onClick={() => router.push("/investments")}
                  title={
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary, #94a3b8)" }}>
                      <RiseOutlined style={{ color: "#10b981" }} />
                      Patrimônio Investido
                    </span>
                  }
                >
                  <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                    <Statistic
                      value={portfolio?.totalCurrentValue || 0}
                      precision={2}
                      prefix="R$"
                      valueStyle={{ color: "#10b981", fontWeight: 700, fontSize: "1.6rem" }}
                    />
                    <div className={styles.trendUp}>
                      <ArrowUpOutlined />
                      {portfolio && portfolio.totalProfitLossAmount >= 0 ? "+" : ""}
                      R$ {(portfolio?.totalProfitLossAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                      ({portfolio?.totalProfitLossPercentage || 0}%)
                    </div>
                  </Skeleton>
                </Card>
              </Col>

              {/* 2. Total Remaining Debts */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className={styles.metricCard}
                  onClick={() => router.push("/debts")}
                  title={
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary, #94a3b8)" }}>
                      <AccountBookOutlined style={{ color: "#f59e0b" }} />
                      Total em Dívidas
                    </span>
                  }
                >
                  <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                    <Statistic
                      value={debts?.totalRemainingBalance || 0}
                      precision={2}
                      prefix="R$"
                      valueStyle={{
                        color: (debts?.totalRemainingBalance || 0) > 0 ? "#f59e0b" : "#10b981",
                        fontWeight: 700,
                        fontSize: "1.6rem",
                      }}
                    />
                    <span className={styles.subDetail}>
                      {debts?.activeDebtsCount || 0} empréstimos ativos • {debts?.overallProgressPercentage || 0}% quitado
                    </span>
                  </Skeleton>
                </Card>
              </Col>

              {/* 3. Pending Receivables */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className={styles.metricCard}
                  onClick={() => router.push("/receivables")}
                  title={
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary, #94a3b8)" }}>
                      <TeamOutlined style={{ color: "#38bdf8" }} />
                      Pendente a Receber
                    </span>
                  }
                >
                  <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                    <Statistic
                      value={receivables?.totalPendingReceivables || 0}
                      precision={2}
                      prefix="R$"
                      valueStyle={{ color: "#38bdf8", fontWeight: 700, fontSize: "1.6rem" }}
                    />
                    <span className={styles.subDetail}>
                      De {receivables?.activeBillsCount || 0} contas compartilhadas ({receivables?.overallCollectionPercentage || 0}% recebido)
                    </span>
                  </Skeleton>
                </Card>
              </Col>

              {/* 4. Monthly Expenses */}
              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  className={styles.metricCard}
                  onClick={() => router.push("/expenses")}
                  title={
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--text-secondary, #94a3b8)" }}>
                      <CreditCardOutlined style={{ color: "#f43f5e" }} />
                      Despesas do Mês
                    </span>
                  }
                >
                  <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                    <Statistic
                      value={monthlyExpenseTotal}
                      precision={2}
                      prefix="R$"
                      valueStyle={{ color: "#f43f5e", fontWeight: 700, fontSize: "1.6rem" }}
                    />
                    <span className={styles.subDetail}>
                      {recentTransactions.length} lançamentos neste mês
                    </span>
                  </Skeleton>
                </Card>
              </Col>
            </Row>

            {/* Middle Section: Recent Activity Table & Goals Progress Card */}
            <Row gutter={[16, 16]} className={styles.middleRow}>
              {/* Activity Table */}
              <Col xs={24} lg={16}>
                <Card
                  title="Transações Financeiras Recentes"
                  extra={
                    <Button type="link" size="small" onClick={() => router.push("/expenses")}>
                      Ver Todas
                    </Button>
                  }
                >
                  {recentTransactions.length > 0 ? (
                    <Table
                      dataSource={recentTransactions}
                      columns={activityColumns}
                      rowKey="transactionID"
                      pagination={false}
                      size="middle"
                    />
                  ) : (
                    <Empty description="Nenhuma transação registrada neste mês" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                      <Button type="primary" size="small" onClick={() => router.push("/expenses")}>
                        Registrar Despesa
                      </Button>
                    </Empty>
                  )}
                </Card>
              </Col>

              {/* Live Goals & Targets Card */}
              <Col xs={24} lg={8}>
                <Card
                  title="Metas e Objetivos"
                  className={styles.goalCard}
                  extra={
                    <Button type="link" size="small" onClick={() => router.push("/goals")}>
                      Gerenciar Metas
                    </Button>
                  }
                >
                  {goalsSummary && goalsSummary.goals.length > 0 ? (
                    <div className={styles.goalsContainer}>
                      {goalsSummary.goals.slice(0, 4).map((g) => {
                        const isDone = g.isCompleted;
                        const isOver = g.pacingStatus === "OverBudget";
                        let stroke = "#38bdf8";
                        if (isDone) stroke = "#10b981";
                        else if (isOver) stroke = "#f43f5e";

                        return (
                          <div key={g.goalID} className={styles.goalItem}>
                            <div className={styles.goalLabel}>
                              <span style={{ fontWeight: 500 }}>
                                {g.title} ({g.currency} {g.targetAmount.toLocaleString("pt-BR")})
                              </span>
                              <span style={{ fontWeight: 600, color: stroke }}>
                                {g.progressPercentage}%
                              </span>
                            </div>
                            <Progress
                              percent={g.progressPercentage}
                              strokeColor={stroke}
                              showInfo={false}
                              size="small"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty
                      image={<AimOutlined style={{ fontSize: 36, color: "var(--text-secondary, #94a3b8)" }} />}
                      description="Nenhuma meta financeira definida ainda"
                    >
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => router.push("/goals")}
                      >
                        Criar Meta Financeira
                      </Button>
                    </Empty>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Bottom Section: Quick Links & Summary Cards */}
            <Row gutter={[16, 16]} className={styles.bottomRow}>
              {/* Investments Quick Card */}
              <Col xs={24} md={8}>
                <Card
                  title="Destaques em Investimentos"
                  size="small"
                  extra={<Button type="link" size="small" onClick={() => router.push("/investments")}>Abrir</Button>}
                >
                  {portfolio && portfolio.investments.length > 0 ? (
                    <div>
                      {portfolio.investments.slice(0, 3).map((inv) => (
                        <div
                          key={inv.investmentID}
                          className={styles.moduleSummaryItem}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push("/investments")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push("/investments");
                            }
                          }}
                        >
                          <div className={styles.itemInfo}>
                            <RiseOutlined style={{ color: "#10b981" }} />
                            <span className={styles.itemTitle}>{inv.name}</span>
                          </div>
                          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            R$ {inv.currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Nenhum ativo registrado" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </Col>

              {/* Debts Quick Card */}
              <Col xs={24} md={8}>
                <Card
                  title="Empréstimos e Dívidas"
                  size="small"
                  extra={<Button type="link" size="small" onClick={() => router.push("/debts")}>Abrir</Button>}
                >
                  {debts && debts.debts.length > 0 ? (
                    <div>
                      {debts.debts.slice(0, 3).map((d) => (
                        <div
                          key={d.debtID}
                          className={styles.moduleSummaryItem}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push("/debts")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push("/debts");
                            }
                          }}
                        >
                          <div className={styles.itemInfo}>
                            <AccountBookOutlined style={{ color: "#f59e0b" }} />
                            <span className={styles.itemTitle}>{d.name}</span>
                          </div>
                          <span style={{ fontWeight: 600, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                            R$ {d.remainingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Nenhuma dívida registrada" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </Col>

              {/* Shared Receivables Quick Card */}
              <Col xs={24} md={8}>
                <Card
                  title="Contas Compartilhadas"
                  size="small"
                  extra={<Button type="link" size="small" onClick={() => router.push("/receivables")}>Abrir</Button>}
                >
                  {receivables && receivables.receivables.length > 0 ? (
                    <div>
                      {receivables.receivables.slice(0, 3).map((r) => (
                        <div
                          key={r.receivableID}
                          className={styles.moduleSummaryItem}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push("/receivables")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push("/receivables");
                            }
                          }}
                        >
                          <div className={styles.itemInfo}>
                            <TeamOutlined style={{ color: "#38bdf8" }} />
                            <span className={styles.itemTitle}>{r.title}</span>
                          </div>
                          <span style={{ fontWeight: 600, color: r.isSettled ? "#10b981" : "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                            {r.isSettled ? "Quitado" : `Pendente R$ ${r.totalPending.toLocaleString("pt-BR")}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="Nenhuma conta compartilhada" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
