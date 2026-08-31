"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Segmented,
  Space,
  Tooltip,
  Popconfirm,
  message,
  Tabs,
  Empty,
  theme,
  Progress,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  DollarOutlined,
  PieChartOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  AccountBookOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
  CalendarOutlined,
  PayCircleOutlined,
  HistoryOutlined,
  ScheduleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
import { FINTRACK_THEME } from "@/app/lib/theme";
import { UserCookieInfo } from "../../interfaces/UserCookieInfo";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import {
  IDebt,
  IDebtCreate,
  IDebtPaymentCreate,
  IDebtScheduleItem,
  IDebtSummary,
  IDebtUpdate,
} from "../../interfaces/Debts/IDebt";
import {
  getDebtSummary,
  getDebtById,
  getDebtSchedule,
  createDebt,
  updateDebt,
  recordDebtPayment,
  payoffDebt,
  deleteDebt,
} from "@/app/services/Backend/DebtService";
import {
  DebtRateType,
  DebtType,
  RecurrenceInterval,
} from "@/app/Enums/FinTrackEnums";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;

export default function DebtsPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("debts");
  const [viewMode, setViewMode] = useState<"list" | "treemap" | "pie">("treemap");

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

  const [summary, setSummary] = useState<IDebtSummary>({
    totalOriginalPrincipal: 0,
    totalRemainingBalance: 0,
    totalPaidAmount: 0,
    overallProgressPercentage: 0,
    totalMonthlyObligation: 0,
    weightedAverageInterestRate: 0,
    activeDebtsCount: 0,
    paidOffDebtsCount: 0,
    debts: [],
  });
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<IDebt | null>(null);
  const [scheduleItems, setScheduleItems] = useState<IDebtScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDebtSummary(
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      setSummary(data);
    } catch (err) {
      console.error("Failed to load debts summary", err);
      message.error("Failed to load debts.");
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const openDebtDetail = async (debt: IDebt) => {
    setSelectedDebt(debt);
    setIsDetailModalOpen(true);
    try {
      setLoadingSchedule(true);
      const schedule = await getDebtSchedule(
        debt.debtID,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      setScheduleItems(schedule);
    } catch (err) {
      console.error("Failed to load debt schedule", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleCreateDebt = async (values: any) => {
    try {
      setLoading(true);
      const payload: IDebtCreate = {
        userID: userInfo?.id ? Number(userInfo.id) : 1,
        name: values.name,
        issuer: values.issuer,
        debtType: values.debtType,
        currency: values.currency || "BRL",
        originalPrincipal: values.originalPrincipal,
        remainingBalance: values.remainingBalance ?? values.originalPrincipal,
        interestRate: values.interestRate,
        rateType: values.rateType,
        paymentFrequency: values.paymentFrequency ?? RecurrenceInterval.Monthly,
        installmentAmount: values.installmentAmount,
        totalInstallments: values.totalInstallments,
        paidInstallments: values.paidInstallments || 0,
        dueDay: values.dueDay,
        startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
        maturityDate: values.maturityDate ? values.maturityDate.toISOString() : undefined,
        autoGenerateExpenses: values.autoGenerateExpenses ?? true,
        description: values.description,
      };

      await createDebt(payload);
      message.success("Debt / Loan created successfully!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      await fetchSummary();
    } catch (err) {
      message.error("Failed to create debt.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDebt = async (values: any) => {
    if (!selectedDebt) return;
    try {
      setLoading(true);
      const payload: IDebtUpdate = {
        name: values.name,
        issuer: values.issuer,
        debtType: values.debtType,
        currency: values.currency || "BRL",
        remainingBalance: values.remainingBalance,
        interestRate: values.interestRate,
        rateType: values.rateType,
        paymentFrequency: values.paymentFrequency,
        installmentAmount: values.installmentAmount,
        totalInstallments: values.totalInstallments,
        dueDay: values.dueDay,
        maturityDate: values.maturityDate ? values.maturityDate.toISOString() : undefined,
        isPaidOff: values.isPaidOff ?? false,
        description: values.description,
      };

      await updateDebt(
        selectedDebt.debtID,
        payload,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success("Debt updated successfully!");
      setIsDetailModalOpen(false);
      await fetchSummary();
    } catch (err) {
      message.error("Failed to update debt.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (values: any) => {
    if (!selectedDebt) return;
    try {
      setLoading(true);
      const payload: IDebtPaymentCreate = {
        amount: values.amount,
        principalAmount: values.principalAmount ?? values.amount,
        interestAmount: values.interestAmount ?? 0,
        paymentDate: values.paymentDate ? values.paymentDate.toISOString() : new Date().toISOString(),
        notes: values.notes,
      };

      await recordDebtPayment(
        selectedDebt.debtID,
        payload,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success("Payment recorded successfully!");
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
      await fetchSummary();

      // Refresh opened detail modal if active
      if (selectedDebt) {
        const updated = await getDebtById(
          selectedDebt.debtID,
          userInfo?.id ? Number(userInfo.id) : undefined
        );
        if (updated) setSelectedDebt(updated);
      }
    } catch (err) {
      message.error("Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayoffDebt = async (debtId: number) => {
    try {
      setLoading(true);
      await payoffDebt(debtId, userInfo?.id ? Number(userInfo.id) : undefined);
      message.success("Loan marked as fully paid off! 🎉");
      setIsDetailModalOpen(false);
      await fetchSummary();
    } catch (err) {
      message.error("Failed to payoff debt.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDebt = async (debtId: number) => {
    try {
      setLoading(true);
      await deleteDebt(debtId, userInfo?.id ? Number(userInfo.id) : undefined);
      message.success("Debt deleted.");
      setIsDetailModalOpen(false);
      await fetchSummary();
    } catch (err) {
      message.error("Failed to delete debt.");
    } finally {
      setLoading(false);
    }
  };

  const getDebtTypeName = (type: DebtType) => {
    switch (type) {
      case DebtType.Personal:
      case DebtType.Personal:
        return "Empréstimo Pessoal";
      case DebtType.Bank:
        return "Empréstimo Bancário";
      case DebtType.Student:
        return "Financiamento Estudantil";
      case DebtType.Financing_Mortgage:
        return "Financiamento / Imobiliário";
      case DebtType.CreditCard:
        return "Cartão de Crédito";
      default:
        return "Outra Dívida";
    }
  };

  const getDebtRateTypeName = (type: DebtRateType) => {
    switch (type) {
      case DebtRateType.FixedAnnual:
        return "Fixa (a.a.)";
      case DebtRateType.FixedMonthly:
        return "Fixa (a.m.)";
      case DebtRateType.CDI_Linked:
        return "% CDI";
      case DebtRateType.IPCA_Linked:
        return "IPCA +";
      default:
        return "Fixa";
    }
  };

  const getFrequencyName = (freq: RecurrenceInterval) => {
    switch (freq) {
      case RecurrenceInterval.Weekly:
        return "Semanal";
      case RecurrenceInterval.Daily:
        return "Diário";
      case RecurrenceInterval.Yearly:
        return "Anual";
      case RecurrenceInterval.Monthly:
      default:
        return "Mensal";
    }
  };

  // Pie chart calculation
  const distributionData = useMemo(() => {
    const active = summary.debts.filter((d) => !d.isPaidOff && d.remainingBalance > 0);
    const total = active.reduce((sum, d) => sum + d.remainingBalance, 0);

    const colors = [
      "#58a6ff",
      "#f59e0b",
      "#ec4899",
      "#8b5cf6",
      "#10b981",
      "#38bdf8",
      "#f97316",
      "#a855f7",
    ];

    if (total === 0) return { items: [], total: 0 };

    let currentAngle = 0;
    const items = active.map((debt, index) => {
      const percentage = (debt.remainingBalance / total) * 100;
      const angle = (debt.remainingBalance / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      return {
        id: debt.debtID,
        name: debt.name,
        issuer: debt.issuer,
        amount: debt.remainingBalance,
        percentage: Number(percentage.toFixed(1)),
        color: colors[index % colors.length],
        startAngle,
        endAngle,
      };
    });

    return { items, total };
  }, [summary.debts]);

  // SVG helper for Pie chart slices
  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const polarToCartesian = (
      centerX: number,
      centerY: number,
      r: number,
      angleInDegrees: number
    ) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      x,
      y,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ");
  };

  const columns = [
    {
      title: "Dívida / Empréstimo",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: IDebt) => (
        <Space direction="vertical" size={2}>
          <a
            onClick={() => openDebtDetail(record)}
            style={{ fontWeight: 600, color: "#38bdf8" }}
          >
            {name}
          </a>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <BankOutlined style={{ marginRight: 4 }} />
            {record.issuer} • {getDebtTypeName(record.debtType)}
          </span>
        </Space>
      ),
    },
    {
      title: "Taxa de Juros",
      key: "rate",
      render: (_: any, record: IDebt) => (
        <Tag color="volcano">
          {record.interestRate}% {getDebtRateTypeName(record.rateType)}
        </Tag>
      ),
    },
    {
      title: "Valor Original",
      dataIndex: "originalPrincipal",
      key: "originalPrincipal",
      render: (val: number, record: IDebt) =>
        `${record.currency} ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    {
      title: "Saldo Devedor",
      dataIndex: "remainingBalance",
      key: "remainingBalance",
      render: (val: number, record: IDebt) => (
        <span style={{ fontWeight: 600, color: val > 0 ? "#f59e0b" : "#10b981", fontVariantNumeric: "tabular-nums" }}>
          {record.currency} {val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Progresso / Quitado",
      key: "progress",
      render: (_: any, record: IDebt) => (
        <div style={{ minWidth: 140 }}>
          <Progress
            percent={record.progressPercentage}
            size="small"
            status={record.isPaidOff ? "success" : "active"}
            strokeColor={record.isPaidOff ? "#10b981" : "#f59e0b"}
          />
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
            {record.paidInstallments} de {record.totalInstallments || "—"} parcelas pagas
          </div>
        </div>
      ),
    },
    {
      title: "Parcela Mensal",
      key: "installment",
      render: (_: any, record: IDebt) => (
        <div>
          {record.installmentAmount ? (
            <div>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {record.currency}{" "}
                {record.installmentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {getFrequencyName(record.paymentFrequency)}
                {record.dueDay ? ` (Dia ${record.dueDay})` : ""}
              </div>
            </div>
          ) : (
            <span style={{ color: "var(--text-secondary)" }}>Flexível</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: IDebt) =>
        record.isPaidOff ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Quitado
          </Tag>
        ) : (
          <Tag color="processing">Ativo</Tag>
        ),
    },
    {
      title: "Ações",
      key: "actions",
      render: (_: any, record: IDebt) => (
        <Space size="small">
          <Tooltip title="Registrar Pagamento">
            <Button
              type="primary"
              size="small"
              icon={<PayCircleOutlined />}
              disabled={record.isPaidOff}
              onClick={() => {
                setSelectedDebt(record);
                paymentForm.setFieldsValue({
                  amount: record.installmentAmount || undefined,
                  paymentDate: dayjs(),
                });
                setIsPaymentModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Ver Detalhes">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openDebtDetail(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Excluir esta dívida?"
            description="Isso removerá a dívida e todos os registros de pagamentos vinculados."
            onConfirm={() => handleDeleteDebt(record.debtID)}
            okText="Sim"
            cancelText="Não"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      <Layout className={styles.layout}>
        <Sidebar
          collapsed={collapsed}
          selectedKey={selectedKey}
          onSelectKey={(key) => setSelectedKey(key)}
        />
        <Layout className={styles.mainLayout}>
          <Header
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
          <Content className={styles.content}>
            {/* Header */}
            <div className={styles.pageHeader}>
              <div>
                <h2>Gestão de Dívidas e Empréstimos</h2>
                <p>Monitore, amortize e planeje a quitação de financiamentos, cartões e empréstimos bancários.</p>
              </div>
              <div className={styles.headerControls}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    addForm.resetFields();
                    addForm.setFieldsValue({
                      debtType: DebtType.Bank,
                      rateType: DebtRateType.FixedAnnual,
                      paymentFrequency: RecurrenceInterval.Monthly,
                      autoGenerateExpenses: true,
                      startDate: dayjs(),
                      currency: "BRL",
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  Adicionar Dívida / Empréstimo
                </Button>
              </div>
            </div>

            {/* Metric Overview Row */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Saldo Devedor Total"
                    value={summary.totalRemainingBalance}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: summary.totalRemainingBalance > 0 ? "#f59e0b" : "#10b981" }}
                  />
                  <span className={styles.subDetail}>
                    Em {summary.activeDebtsCount} {summary.activeDebtsCount === 1 ? "empréstimo ativo" : "empréstimos ativos"}
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Quitado até o Momento"
                    value={summary.totalPaidAmount}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: "#10b981" }}
                  />
                  <span className={styles.trendGood}>
                    {summary.overallProgressPercentage}% do valor original
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Compromisso Mensal"
                    value={summary.totalMonthlyObligation}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: "#38bdf8" }}
                  />
                  <span className={styles.subDetail}>
                    Parcelas mensais estimadas
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Taxa de Juros Média"
                    value={summary.weightedAverageInterestRate}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: "#f43f5e" }}
                  />
                  <span className={styles.trendWarning}>
                    Ponderada pelos saldos ativos
                  </span>
                </Card>
              </Col>
            </Row>

            {/* View Mode Toggle */}
            <Card className={styles.viewToggleCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "1rem" }}>Carteira de Dívidas</span>
                <Segmented
                  value={viewMode}
                  onChange={(val) => setViewMode(val as any)}
                  options={[
                    { label: "Blocos / Cartões", value: "treemap", icon: <AppstoreOutlined /> },
                    { label: "Distribuição", value: "pie", icon: <PieChartOutlined /> },
                    { label: "Tabela / Lista", value: "list", icon: <UnorderedListOutlined /> },
                  ]}
                />
              </div>
            </Card>

            {/* View 1: Treemap / Visual Cards */}
            {viewMode === "treemap" && (
              <div>
                {summary.debts.length === 0 ? (
                  <Card>
                    <Empty
                      description="No debts or loans recorded yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        Add Your First Loan
                      </Button>
                    </Empty>
                  </Card>
                ) : (
                  <div className={styles.treemapContainer}>
                    {summary.debts.map((debt) => {
                      const isHighRate = debt.interestRate > 15;
                      const tileClass = debt.isPaidOff
                        ? styles.paidOffTile
                        : isHighRate
                        ? styles.highRateTile
                        : styles.activeTile;

                      return (
                        <div
                          key={debt.debtID}
                          className={`${styles.debtTile} ${tileClass}`}
                          style={{
                            flex: debt.remainingBalance > 0
                              ? Math.max(1, Math.min(3, Math.ceil(debt.remainingBalance / 10000)))
                              : 1,
                            minWidth: "280px",
                          }}
                          onClick={() => openDebtDetail(debt)}
                        >
                          <div className={styles.tileHeader}>
                            <div className={styles.tileTitleGroup}>
                              <span className={styles.tileTitle}>{debt.name}</span>
                              <span className={styles.tileIssuer}>
                                <BankOutlined /> {debt.issuer} • {getDebtTypeName(debt.debtType)}
                              </span>
                            </div>
                            <span className={styles.tilePercentage}>
                              {debt.progressPercentage}% Paid
                            </span>
                          </div>

                          <div className={styles.tileBody}>
                            <div className={styles.balanceLabel}>Remaining Principal</div>
                            <div className={styles.tileValue}>
                              {debt.currency}{" "}
                              {debt.remainingBalance.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <div className={styles.progressBarWrapper}>
                              <Progress
                                percent={debt.progressPercentage}
                                size="small"
                                showInfo={false}
                                strokeColor={debt.isPaidOff ? "#008d0a" : "#f59e0b"}
                              />
                            </div>
                            <div className={styles.progressMeta}>
                              <span>Original: {debt.currency} {debt.originalPrincipal.toLocaleString("pt-BR")}</span>
                              <span>Paid: {debt.currency} {debt.totalPaidAmount.toLocaleString("pt-BR")}</span>
                            </div>
                          </div>

                          <div className={styles.tileFooter}>
                            <div className={styles.rateBadge}>
                              <PercentageOutlined /> {debt.interestRate}% {getDebtRateTypeName(debt.rateType)}
                            </div>
                            <div className={styles.installmentInfo}>
                              {debt.installmentAmount ? (
                                <span>
                                  {debt.currency} {debt.installmentAmount.toLocaleString("pt-BR")}/mo
                                  {debt.dueDay ? ` (due ${debt.dueDay})` : ""}
                                </span>
                              ) : (
                                <span>{debt.isPaidOff ? "Settled" : "Flexible"}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View 2: Distribution Pie Chart */}
            {viewMode === "pie" && (
              <Card>
                {distributionData.items.length === 0 ? (
                  <Empty
                    description="No active debt balances to display"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <div className={styles.chartLayout}>
                    <div className={styles.pizzaCanvasContainer}>
                      <svg width="260" height="260" viewBox="0 0 260 260">
                        {distributionData.items.map((item) => (
                          <path
                            key={item.id}
                            d={describeArc(130, 130, 100, item.startAngle, item.endAngle)}
                            fill={item.color}
                            stroke="#0d1117"
                            strokeWidth="2"
                            style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                          >
                            <title>{`${item.name} (${item.issuer}): R$ ${item.amount.toLocaleString()} (${item.percentage}%)`}</title>
                          </path>
                        ))}
                        {/* Donut hole center */}
                        <circle cx="130" cy="130" r="55" fill="#161b22" />
                        <text
                          x="130"
                          y="125"
                          textAnchor="middle"
                          fill="#8b949e"
                          fontSize="11"
                        >
                          TOTAL ACTIVE
                        </text>
                        <text
                          x="130"
                          y="145"
                          textAnchor="middle"
                          fill="#f0f6fc"
                          fontSize="13"
                          fontWeight="bold"
                        >
                          R$ {distributionData.total.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </text>
                      </svg>
                    </div>

                    <div className={styles.chartLegend}>
                      <h4 style={{ margin: "0 0 8px", color: "#f0f6fc" }}>
                        Breakdown by Loan
                      </h4>
                      {distributionData.items.map((item) => (
                        <div
                          key={item.id}
                          className={styles.legendItem}
                          onClick={() => {
                            const found = summary.debts.find((d) => d.debtID === item.id);
                            if (found) openDebtDetail(found);
                          }}
                        >
                          <div className={styles.legendLabel}>
                            <span
                              className={styles.colorDot}
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name} <small style={{ color: "#8b949e" }}>({item.issuer})</small></span>
                          </div>
                          <div className={styles.legendValue}>
                            R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                            <Tag color="default">{item.percentage}%</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* View 3: Table / List */}
            {viewMode === "list" && (
              <Card>
                <Table
                  dataSource={summary.debts}
                  columns={columns}
                  rowKey="debtID"
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              </Card>
            )}

            {/* Add Loan Modal */}
            <Modal
              title="Cadastrar Nova Dívida / Empréstimo"
              open={isAddModalOpen}
              onCancel={() => setIsAddModalOpen(false)}
              footer={null}
              width={680}
            >
              <Form
                form={addForm}
                layout="vertical"
                onFinish={handleCreateDebt}
                initialValues={{
                  debtType: DebtType.Bank,
                  rateType: DebtRateType.FixedAnnual,
                  paymentFrequency: RecurrenceInterval.Monthly,
                  currency: "BRL",
                  autoGenerateExpenses: true,
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Nome da Dívida / Empréstimo"
                      rules={[{ required: true, message: "Insira o nome da dívida" }]}
                    >
                      <Input placeholder="Ex: Financiamento Carro, Empréstimo Nubank" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="issuer"
                      label="Credor / Banco / Instituição"
                      rules={[{ required: true, message: "Insira a instituição ou credor" }]}
                    >
                      <Input placeholder="Ex: Banco do Brasil, Itaú, Amigo" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="debtType" label="Categoria da Dívida">
                      <Select>
                        <Option value={DebtType.Personal}>Empréstimo Pessoal</Option>
                        <Option value={DebtType.Bank}>Empréstimo Bancário</Option>
                        <Option value={DebtType.Student}>Financiamento Estudantil (FIES)</Option>
                        <Option value={DebtType.Financing_Mortgage}>Financiamento Imobiliário / Veicular</Option>
                        <Option value={DebtType.CreditCard}>Fatura de Cartão de Crédito</Option>
                        <Option value={DebtType.Other}>Outro</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="currency" label="Moeda">
                      <Select defaultValue="BRL">
                        <Option value="BRL">BRL - Real Brasileiro (R$)</Option>
                        <Option value="USD">USD - Dólar Americano ($)</Option>
                        <Option value="EUR">EUR - Euro (€)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="originalPrincipal"
                      label="Valor Original Contratado"
                      rules={[{ required: true, message: "Insira o valor original" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        precision={2}
                        prefix="R$"
                        placeholder="0,00"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="remainingBalance"
                      label="Saldo Devedor Atual"
                      tooltip="Deixe em branco se for igual ao valor contratado"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        precision={2}
                        prefix="R$"
                        placeholder="Opcional"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="interestRate"
                      label="Taxa de Juros (%)"
                      rules={[{ required: true, message: "Insira a taxa de juros" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        precision={2}
                        suffix="%"
                        placeholder="Ex: 12,5"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="rateType" label="Tipo de Taxa / Indexador">
                      <Select>
                        <Option value={DebtRateType.FixedAnnual}>Prefixada Anual (% a.a.)</Option>
                        <Option value={DebtRateType.FixedMonthly}>Prefixada Mensal (% a.m.)</Option>
                        <Option value={DebtRateType.CDI_Linked}>% do CDI</Option>
                        <Option value={DebtRateType.IPCA_Linked}>IPCA + Taxa Fixa</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="installmentAmount" label="Valor da Parcela">
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        precision={2}
                        prefix="R$"
                        placeholder="Parcela mensal"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="totalInstallments" label="Total de Parcelas">
                      <InputNumber style={{ width: "100%" }} min={1} max={480} placeholder="Ex: 48" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="dueDay" label="Dia do Vencimento">
                      <InputNumber style={{ width: "100%" }} min={1} max={31} placeholder="Ex: 10" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="startDate" label="Data de Início">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Selecione a data" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="paymentFrequency" label="Frequência de Pagamento">
                      <Select>
                        <Option value={RecurrenceInterval.Monthly}>Mensal</Option>
                        <Option value={RecurrenceInterval.Weekly}>Semanal</Option>
                        <Option value={RecurrenceInterval.Yearly}>Anual</Option>
                        <Option value={RecurrenceInterval.None}>Parcela Única / Flexível</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="autoGenerateExpenses"
                  valuePropName="checked"
                  tooltip="Gera automaticamente lançamentos agendados nas suas despesas e no calendário!"
                >
                  <Checkbox>
                    Gerar automaticamente despesas recorrentes/parceladas vinculadas
                  </Checkbox>
                </Form.Item>

                <Form.Item name="description" label="Observações / Detalhes do Contrato">
                  <Input.TextArea rows={2} placeholder="Número do contrato, objetivo do empréstimo ou notas" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Salvar Dívida
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* Make Payment Modal */}
            <Modal
              title={`Registrar Pagamento para ${selectedDebt?.name || "Dívida"}`}
              open={isPaymentModalOpen}
              onCancel={() => setIsPaymentModalOpen(false)}
              footer={null}
            >
              <Form form={paymentForm} layout="vertical" onFinish={handleRecordPayment}>
                <Form.Item
                  name="amount"
                  label="Valor Total do Pagamento"
                  rules={[{ required: true, message: "Insira o valor pago" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0.01}
                    precision={2}
                    prefix="R$"
                    placeholder="0,00"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="principalAmount"
                      label="Amortização do Principal"
                      tooltip="Quanto desse pagamento abate diretamente do saldo devedor"
                    >
                      <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="R$" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="interestAmount" label="Juros / Taxas Pagas">
                      <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="R$" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="paymentDate"
                  label="Data do Pagamento"
                  rules={[{ required: true, message: "Selecione a data do pagamento" }]}
                  initialValue={dayjs()}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item name="notes" label="Notas / Referência">
                  <Input placeholder="Ex: Parcela 5/48, amortização extraordinária" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Confirmar Pagamento
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* Debt Detail & Schedule Modal */}
            <Modal
              title={
                selectedDebt && (
                  <Space align="center">
                    <AccountBookOutlined style={{ color: "#38bdf8" }} />
                    <span>{selectedDebt.name}</span>
                    <Tag color="volcano">
                      {selectedDebt.interestRate}% {getDebtRateTypeName(selectedDebt.rateType)}
                    </Tag>
                    {selectedDebt.isPaidOff ? (
                      <Tag color="success">Quitado</Tag>
                    ) : (
                      <Tag color="processing">Ativo</Tag>
                    )}
                  </Space>
                )
              }
              open={isDetailModalOpen}
              onCancel={() => setIsDetailModalOpen(false)}
              width={760}
              footer={[
                <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
                  Fechar
                </Button>,
                selectedDebt && !selectedDebt.isPaidOff && (
                  <Popconfirm
                    key="payoff"
                    title="Quitar saldo devedor restante?"
                    description={`Isso registrará um pagamento final de R$ ${selectedDebt.remainingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} e marcará a dívida como quitada.`}
                    onConfirm={() => handlePayoffDebt(selectedDebt.debtID)}
                    okText="Sim, Quitar"
                    cancelText="Cancelar"
                  >
                    <Button type="primary" style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}>
                      Quitar Integralmente
                    </Button>
                  </Popconfirm>
                ),
                selectedDebt && !selectedDebt.isPaidOff && (
                  <Button
                    key="pay"
                    type="primary"
                    icon={<PayCircleOutlined />}
                    onClick={() => {
                      paymentForm.setFieldsValue({
                        amount: selectedDebt.installmentAmount || undefined,
                        paymentDate: dayjs(),
                      });
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    Registrar Pagamento
                  </Button>
                ),
              ]}
            >
              {selectedDebt && (
                <div>
                  {/* Hero stats */}
                  <div className={styles.detailHero}>
                    <div className={styles.heroStat}>
                      <div className={styles.statTitle}>Saldo Devedor</div>
                      <div className={styles.statValue} style={{ color: "#f59e0b" }}>
                        {selectedDebt.currency}{" "}
                        {selectedDebt.remainingBalance.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className={styles.heroStat}>
                      <div className={styles.statTitle}>Valor Contratado</div>
                      <div className={styles.statValue}>
                        {selectedDebt.currency}{" "}
                        {selectedDebt.originalPrincipal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className={styles.heroStat}>
                      <div className={styles.statTitle}>Total Amortizado</div>
                      <div className={styles.statValue} style={{ color: "#10b981" }}>
                        {selectedDebt.currency}{" "}
                        {selectedDebt.totalPaidAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className={styles.heroStat}>
                      <div className={styles.statTitle}>Valor da Parcela</div>
                      <div className={styles.statValue} style={{ color: "#38bdf8" }}>
                        {selectedDebt.installmentAmount
                          ? `${selectedDebt.currency} ${selectedDebt.installmentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : "Flexível"}
                      </div>
                    </div>
                  </div>

                  <Tabs
                    defaultActiveKey="schedule"
                    items={[
                      {
                        key: "schedule",
                        label: (
                          <span>
                            <ScheduleOutlined /> Cronograma de Amortização
                          </span>
                        ),
                        children: (
                          <Table
                            dataSource={scheduleItems}
                            rowKey="installmentNumber"
                            loading={loadingSchedule}
                            size="small"
                            pagination={{ pageSize: 6 }}
                            columns={[
                              {
                                title: "#",
                                dataIndex: "installmentNumber",
                                key: "installmentNumber",
                                width: 50,
                              },
                              {
                                title: "Vencimento",
                                dataIndex: "dueDate",
                                key: "dueDate",
                                render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
                              },
                              {
                                title: "Parcela",
                                dataIndex: "scheduledPayment",
                                key: "scheduledPayment",
                                render: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                              },
                              {
                                title: "Amortização",
                                dataIndex: "principalPortion",
                                key: "principalPortion",
                                render: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                              },
                              {
                                title: "Juros",
                                dataIndex: "interestPortion",
                                key: "interestPortion",
                                render: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                              },
                              {
                                title: "Saldo Restante",
                                dataIndex: "remainingBalanceAfter",
                                key: "remainingBalanceAfter",
                                render: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                              },
                              {
                                title: "Status",
                                key: "isPaid",
                                render: (_: any, r: IDebtScheduleItem) =>
                                  r.isPaid ? (
                                    <Tag color="success">Pago</Tag>
                                  ) : (
                                    <Tag color="default">Pendente</Tag>
                                  ),
                              },
                            ]}
                          />
                        ),
                      },
                      {
                        key: "payments",
                        label: (
                          <span>
                            <HistoryOutlined /> Histórico de Pagamentos ({selectedDebt.payments?.length || 0})
                          </span>
                        ),
                        children: (
                          <div>
                            {selectedDebt.payments && selectedDebt.payments.length > 0 ? (
                              selectedDebt.payments.map((p) => (
                                <div key={p.debtPaymentID} className={styles.paymentHistoryItem}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                      Pagamento de R$ {p.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                      {dayjs(p.paymentDate).format("DD/MM/YYYY")}
                                      {p.notes ? ` • ${p.notes}` : ""}
                                    </div>
                                  </div>
                                  <Tag color="success">Pago</Tag>
                                </div>
                              ))
                            ) : (
                              <Empty description="Nenhum pagamento registrado ainda" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            )}
                          </div>
                        ),
                      },
                      {
                        key: "edit",
                        label: (
                          <span>
                            <EditOutlined /> Editar Detalhes
                          </span>
                        ),
                        children: (
                          <Form
                            form={editForm}
                            layout="vertical"
                            initialValues={{
                              name: selectedDebt.name,
                              issuer: selectedDebt.issuer,
                              debtType: selectedDebt.debtType,
                              currency: selectedDebt.currency,
                              remainingBalance: selectedDebt.remainingBalance,
                              interestRate: selectedDebt.interestRate,
                              rateType: selectedDebt.rateType,
                              paymentFrequency: selectedDebt.paymentFrequency,
                              installmentAmount: selectedDebt.installmentAmount,
                              totalInstallments: selectedDebt.totalInstallments,
                              dueDay: selectedDebt.dueDay,
                              isPaidOff: selectedDebt.isPaidOff,
                              description: selectedDebt.description,
                            }}
                            onFinish={handleUpdateDebt}
                          >
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item name="name" label="Nome da Dívida" rules={[{ required: true, message: "Insira o nome" }]}>
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item name="issuer" label="Credor / Banco" rules={[{ required: true, message: "Insira a instituição" }]}>
                                  <Input />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item name="remainingBalance" label="Saldo Devedor Atual">
                                  <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="R$" />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item name="interestRate" label="Taxa de Juros (%)">
                                  <InputNumber style={{ width: "100%" }} min={0} precision={2} suffix="%" />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item name="installmentAmount" label="Valor da Parcela">
                                  <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="R$" />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item name="dueDay" label="Dia do Vencimento">
                                  <InputNumber style={{ width: "100%" }} min={1} max={31} />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Form.Item name="description" label="Observações">
                              <Input.TextArea rows={2} />
                            </Form.Item>
                            <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                              <Button type="primary" htmlType="submit" loading={loading}>
                                Salvar Alterações
                              </Button>
                            </Form.Item>
                          </Form>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
