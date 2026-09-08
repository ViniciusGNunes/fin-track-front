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
  Radio,
  Switch,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  PieChartOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StockOutlined,
  BankOutlined,
  WalletOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
import { FINTRACK_THEME, FINTRACK_LOCALE } from "@/app/lib/theme";
import { UserCookieInfo } from "../../interfaces/UserCookieInfo";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import {
  IInvestment,
  IInvestmentCreate,
  IInvestmentGrowthPoint,
  IPortfolioSummary,
} from "../../interfaces/Investments/IInvestment";
import {
  getPortfolioSummary,
  getInvestmentGrowthHistory,
  createInvestment,
  addInvestmentTransaction,
  liquidateInvestment,
  deleteInvestment,
  depositPortfolioCash,
  withdrawPortfolioCash,
} from "@/app/services/Backend/InvestmentService";
import {
  FixedRateType,
  InvestmentTransactionType,
  InvestmentType,
} from "@/app/Enums/FinTrackEnums";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;

export default function InvestmentsPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("investments");
  const [viewMode, setViewMode] = useState<"list" | "treemap" | "pie">("treemap");
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "BRL" | "USD" | "EUR">("ALL");

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

  const [portfolio, setPortfolio] = useState<IPortfolioSummary>({
    totalInvested: 0,
    totalCurrentValue: 0,
    totalProfitLossAmount: 0,
    totalProfitLossPercentage: 0,
    unallocatedCash: 0,
    cashBalances: { BRL: 0 },
    usdExchangeRate: 5.60,
    eurExchangeRate: 6.10,
    investments: [],
  });
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashModalType, setCashModalType] = useState<"deposit" | "withdraw">("deposit");

  const [selectedInvestment, setSelectedInvestment] = useState<IInvestment | null>(null);
  const [growthPoints, setGrowthPoints] = useState<IInvestmentGrowthPoint[]>([]);
  const [loadingGrowth, setLoadingGrowth] = useState(false);

  const [addForm] = Form.useForm();
  const [transForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [cashForm] = Form.useForm();

  // Watch selected currency in modals
  const selectedCashCurrency = Form.useWatch("currency", cashForm) || "BRL";
  const selectedAddCurrency = Form.useWatch("currency", addForm) || "BRL";

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPortfolioSummary(
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      setPortfolio(data);
    } catch (err) {
      console.error("Failed to load portfolio", err);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Derived filtered investments and summary based on selected currency tab
  const filteredInvestments = portfolio.investments.filter((inv) => {
    if (currencyFilter === "ALL") return true;
    return (inv.currency || "BRL").toUpperCase() === currencyFilter;
  });

  const activeCashBalance =
    currencyFilter === "ALL"
      ? (portfolio.cashBalances?.["BRL"] || portfolio.unallocatedCash || 0)
      : (portfolio.cashBalances?.[currencyFilter] || 0);

  const displayedMetrics = (() => {
    if (currencyFilter === "ALL") {
      return {
        currencySymbol: "R$",
        totalCurrentValue: portfolio.totalCurrentValue,
        totalInvested: portfolio.totalInvested,
        totalProfitLossAmount: portfolio.totalProfitLossAmount,
        totalProfitLossPercentage: portfolio.totalProfitLossPercentage,
        cash: portfolio.totalCurrentValue - portfolio.investments.reduce((sum, i) => {
          const rate = (i.currency === "USD" ? portfolio.usdExchangeRate || 5.60 : i.currency === "EUR" ? portfolio.eurExchangeRate || 6.10 : 1);
          return sum + (i.currentValue * rate);
        }, 0),
        isConverted: true,
      };
    }

    const cur = currencyFilter;
    const symbol = cur === "USD" ? "$" : cur === "EUR" ? "€" : "R$";
    const curInvestments = portfolio.investments.filter(
      (i) => (i.currency || "BRL").toUpperCase() === cur
    );
    const cash = portfolio.cashBalances?.[cur] || 0;
    const totalInvested = curInvestments.reduce((sum, i) => sum + i.totalInvested, 0);
    const totalInvestmentsVal = curInvestments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalCurrentValue = totalInvestmentsVal + cash;
    const pnl = totalCurrentValue - totalInvested;
    const pnlPct = totalInvested > 0 ? Number(((pnl / totalInvested) * 100).toFixed(2)) : 0;

    return {
      currencySymbol: symbol,
      totalCurrentValue,
      totalInvested,
      totalProfitLossAmount: pnl,
      totalProfitLossPercentage: pnlPct,
      cash,
      isConverted: false,
    };
  })();

  const handleOpenDetailModal = async (investment: IInvestment) => {
    setSelectedInvestment(investment);
    setIsDetailModalOpen(true);
    editForm.setFieldsValue({
      name: investment.name,
      ticker: investment.ticker,
      currency: investment.currency,
      annualRate: investment.annualRate,
      rateType: investment.rateType,
      isTaxExempt: investment.isTaxExempt,
    });

    try {
      setLoadingGrowth(true);
      const points = await getInvestmentGrowthHistory(
        investment.investmentID,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      setGrowthPoints(points);
    } catch (err) {
      console.error("Failed to fetch growth timeline", err);
      setGrowthPoints([]);
    } finally {
      setLoadingGrowth(false);
    }
  };

  const handleCreateInvestment = async (values: any) => {
    try {
      setLoading(true);
      const payload: IInvestmentCreate = {
        name: values.name,
        ticker: values.ticker || null,
        investmentType: values.investmentType,
        currency: values.currency || "BRL",
        totalInvested: Number(values.totalInvested),
        quantity: values.quantity ? Number(values.quantity) : null,
        purchasePricePerUnit: values.purchasePricePerUnit ? Number(values.purchasePricePerUnit) : null,
        rateType: values.rateType !== undefined ? values.rateType : null,
        annualRate: values.annualRate ? Number(values.annualRate) : null,
        isTaxExempt: values.isTaxExempt || false,
        startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
        maturityDate: values.maturityDate ? values.maturityDate.toISOString() : null,
        fromCashBalance: values.fundingSource === "cash",
        userID: userInfo?.id ? Number(userInfo.id) : 1,
      };

      await createInvestment(payload);
      message.success("Investimento cadastrado com sucesso!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      await fetchPortfolio();
    } catch (err: any) {
      console.error("Failed to add investment", err);
      message.error(err?.response?.data?.message || err.message || "Não foi possível cadastrar o investimento.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (values: any) => {
    if (!selectedInvestment) return;
    try {
      setLoading(true);
      await addInvestmentTransaction(
        selectedInvestment.investmentID,
        {
          transactionType: values.transactionType,
          amount: Number(values.amount),
          quantity: values.quantity ? Number(values.quantity) : null,
          unitPrice: values.unitPrice ? Number(values.unitPrice) : null,
          fromCashBalance: values.fundingSource === "cash",
          transactionDate: values.transactionDate ? values.transactionDate.toISOString() : new Date().toISOString(),
          notes: values.notes || null,
        },
        userInfo?.id ? Number(userInfo.id) : undefined
      );

      message.success("Transação registrada com sucesso!");
      transForm.resetFields();
      setIsDetailModalOpen(false);
      await fetchPortfolio();
    } catch (err: any) {
      console.error("Failed to record transaction", err);
      message.error(err?.response?.data?.message || err.message || "Não foi possível registrar a transação.");
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidate = async (investmentId: number) => {
    try {
      setLoading(true);
      await liquidateInvestment(investmentId, userInfo?.id ? Number(userInfo.id) : undefined);
      message.success("Investimento liquidado! O valor foi creditado no seu Caixa Livre.");
      setIsDetailModalOpen(false);
      await fetchPortfolio();
    } catch (err) {
      console.error("Failed to liquidate investment", err);
      message.error("Não foi possível liquidar o investimento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (investmentId: number) => {
    try {
      setLoading(true);
      await deleteInvestment(investmentId, userInfo?.id ? Number(userInfo.id) : undefined);
      message.success("Investimento excluído com sucesso!");
      setIsDetailModalOpen(false);
      await fetchPortfolio();
    } catch (err) {
      console.error("Failed to delete investment", err);
      message.error("Não foi possível excluir o investimento.");
    } finally {
      setLoading(false);
    }
  };

  const handleCashMovement = async (values: any) => {
    try {
      setLoading(true);
      const chosenCurrency = values.currency || "BRL";
      if (cashModalType === "deposit") {
        await depositPortfolioCash(
          {
            amount: Number(values.amount),
            currency: chosenCurrency,
            notes: values.notes || "Depósito no Caixa da Carteira",
          },
          userInfo?.id ? Number(userInfo.id) : undefined
        );
        message.success(`Depósito no Caixa Livre (${chosenCurrency}) realizado com sucesso!`);
      } else {
        await withdrawPortfolioCash(
          {
            amount: Number(values.amount),
            currency: chosenCurrency,
            notes: values.notes || "Saque do Caixa da Carteira",
          },
          userInfo?.id ? Number(userInfo.id) : undefined
        );
        message.success(`Saque do Caixa Livre (${chosenCurrency}) realizado com sucesso!`);
      }
      setIsCashModalOpen(false);
      cashForm.resetFields();
      await fetchPortfolio();
    } catch (err: any) {
      console.error("Failed cash movement", err);
      message.error(err?.response?.data?.message || err.message || "Não foi possível processar a movimentação.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (cur?: string) => {
    const c = (cur || "BRL").toUpperCase();
    if (c === "USD") return "$";
    if (c === "EUR") return "€";
    return "R$";
  };

  // Table columns for list view
  const columns = [
    {
      title: "Ativo",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: IInvestment) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {record.investmentType === InvestmentType.Crypto ? (
            <DollarOutlined style={{ color: "#a371f7", fontSize: 16 }} />
          ) : record.investmentType === InvestmentType.VariableIncome ? (
            <StockOutlined style={{ color: "#58a6ff", fontSize: 16 }} />
          ) : (
            <BankOutlined style={{ color: "#e3b341", fontSize: 16 }} />
          )}
          <div>
            <strong>{text}</strong>
            {record.ticker && (
              <span style={{ color: "#8b949e", marginLeft: 6, fontSize: 12 }}>
                ({record.ticker})
              </span>
            )}
            <Tag color={record.currency === "USD" ? "green" : record.currency === "EUR" ? "gold" : "blue"} style={{ marginLeft: 6, fontSize: 11 }}>
              {record.currency || "BRL"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "investmentType",
      key: "investmentType",
      render: (type: InvestmentType, record: IInvestment) => {
        if (type === InvestmentType.Crypto) {
          return <Tag color="purple">Cripto</Tag>;
        }
        if (type === InvestmentType.VariableIncome) {
          return <Tag color="blue">Renda Variável</Tag>;
        }
        const rateLabel =
          record.rateType === FixedRateType.Selic_CDI
            ? `${record.annualRate ?? 100}% CDI`
            : record.rateType === FixedRateType.IPCA_Plus
            ? `IPCA + ${record.annualRate ?? 0}%`
            : record.annualRate
            ? `${record.annualRate}% a.a.`
            : null;

        return (
          <Space orientation="horizontal" size={4}>
            <Tag color="gold">Renda Fixa</Tag>
            {rateLabel && <Tag color="cyan">{rateLabel}</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Total Aportado",
      dataIndex: "totalInvested",
      key: "totalInvested",
      render: (val: number, record: IInvestment) =>
        `${getCurrencySymbol(record.currency)} ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    {
      title: "Saldo Atual",
      dataIndex: "currentValue",
      key: "currentValue",
      render: (val: number, record: IInvestment) => (
        <strong style={{ fontVariantNumeric: "tabular-nums" }}>
          {getCurrencySymbol(record.currency)}{" "}
          {Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </strong>
      ),
    },
    {
      title: "Lucro / Prejuízo",
      dataIndex: "profitLossAmount",
      key: "profitLossAmount",
      render: (val: number, record: IInvestment) => {
        const isPos = val >= 0;
        return (
          <span className={isPos ? styles.positiveText : styles.negativeText} style={{ fontVariantNumeric: "tabular-nums" }}>
            {isPos ? "+" : ""}
            {getCurrencySymbol(record.currency)}{" "}
            {Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({isPos ? "+" : ""}
            {record.profitLossPercentage}%)
          </span>
        );
      },
    },
    {
      title: "% Carteira",
      key: "share",
      render: (_: any, record: IInvestment) => {
        const pct =
          portfolio.totalCurrentValue > 0
            ? ((record.currentValue / portfolio.totalCurrentValue) * 100).toFixed(1)
            : "0.0";
        return <Tag color="default">{pct}%</Tag>;
      },
    },
    {
      title: "Ações",
      key: "actions",
      render: (_: any, record: IInvestment) => (
        <Space size="small">
          <Tooltip title="Gerenciar Ativo">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleOpenDetailModal(record)}
            >
              Manage
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Palette for chart items
  const chartColors = [
    "#008d0a",
    "#1f6feb",
    "#d29922",
    "#8957e5",
    "#3fb950",
    "#f778ba",
    "#58a6ff",
    "#bc8cff",
    "#f0883e",
    "#56d364",
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
                <h2>Carteira de Investimentos</h2>
                <p>
                  Acompanhe alocação de ativos, rentabilidade da carteira, taxas e evolução patrimonial.
                </p>
              </div>

              <div className={styles.headerControls} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Segmented
                  value={currencyFilter}
                  onChange={(val) => setCurrencyFilter(val as any)}
                  options={[
                    { value: "ALL", label: "Consolidado (R$)" },
                    { value: "BRL", label: "🇧🇷 BRL (R$)" },
                    { value: "USD", label: "🇺🇸 USD ($)" },
                    { value: "EUR", label: "🇪🇺 EUR (€)" },
                  ]}
                />

                <Segmented
                  value={viewMode}
                  onChange={(val) => setViewMode(val as any)}
                  options={[
                    { value: "treemap", icon: <AppstoreOutlined />, label: "Mosaico / Tamanho" },
                    { value: "pie", icon: <PieChartOutlined />, label: "Pizza" },
                    { value: "list", icon: <UnorderedListOutlined />, label: "Lista" },
                  ]}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Novo Investimento
                </Button>
              </div>
            </div>

            {/* Metrics Overview */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless">
                  <Statistic
                    title={
                      displayedMetrics.isConverted
                        ? "Patrimônio Total (Consolidado)"
                        : `Patrimônio Total (${currencyFilter})`
                    }
                    value={displayedMetrics.totalCurrentValue}
                    precision={2}
                    prefix={`${displayedMetrics.currencySymbol} `}
                    styles={{ value: { color: "#38bdf8", fontVariantNumeric: "tabular-nums" } }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {displayedMetrics.isConverted
                      ? `Ativos + Caixa (USD: R$ ${portfolio.usdExchangeRate?.toFixed(2) || "5.60"})`
                      : "Ativos + Caixa nesta moeda"}
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Statistic
                      title={`Caixa Livre (${currencyFilter === "ALL" ? "BRL" : currencyFilter})`}
                      value={activeCashBalance}
                      precision={2}
                      prefix={`${currencyFilter === "USD" ? "$" : currencyFilter === "EUR" ? "€" : "R$"} `}
                      styles={{ value: { color: "#10b981", fontVariantNumeric: "tabular-nums" } }}
                    />
                    <Space size={4}>
                      <Tooltip title="Depositar no Caixa">
                        <Button
                          size="small"
                          type="primary"
                          icon={<ArrowDownOutlined />}
                          onClick={() => {
                            setCashModalType("deposit");
                            cashForm.setFieldsValue({
                              currency: currencyFilter === "ALL" ? "BRL" : currencyFilter,
                            });
                            setIsCashModalOpen(true);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Sacar do Caixa">
                        <Button
                          size="small"
                          icon={<ArrowUpOutlined />}
                          disabled={activeCashBalance <= 0}
                          onClick={() => {
                            setCashModalType("withdraw");
                            cashForm.setFieldsValue({
                              currency: currencyFilter === "ALL" ? "BRL" : currencyFilter,
                            });
                            setIsCashModalOpen(true);
                          }}
                        />
                      </Tooltip>
                    </Space>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Vendas, dividendos e saldo livre
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless">
                  <Statistic
                    title="Total de Aportes Realizados"
                    value={displayedMetrics.totalInvested}
                    precision={2}
                    prefix={`${displayedMetrics.currencySymbol} `}
                    styles={{ value: { fontVariantNumeric: "tabular-nums" } }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Capital externo investido
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless">
                  <Statistic
                    title="Rentabilidade Total (L/P)"
                    value={displayedMetrics.totalProfitLossAmount}
                    precision={2}
                    prefix={
                      displayedMetrics.totalProfitLossAmount >= 0
                        ? `+${displayedMetrics.currencySymbol} `
                        : `${displayedMetrics.currencySymbol} `
                    }
                    styles={{
                      value: {
                        color:
                          displayedMetrics.totalProfitLossAmount >= 0 ? "#10b981" : "#f43f5e",
                        fontVariantNumeric: "tabular-nums",
                      },
                    }}
                  />
                  <span
                    className={
                      displayedMetrics.totalProfitLossAmount >= 0
                        ? styles.trendUp
                        : styles.trendDown
                    }
                  >
                    {displayedMetrics.totalProfitLossAmount >= 0 ? (
                      <RiseOutlined />
                    ) : (
                      <FallOutlined />
                    )}{" "}
                    {displayedMetrics.totalProfitLossPercentage}% Rendimento
                  </span>
                </Card>
              </Col>
            </Row>

            {/* Views Section */}
            {viewMode === "treemap" && (
              <Card variant="borderless" title="Mosaico da Carteira (Proporção pelo Saldo)">
                {filteredInvestments.length === 0 && activeCashBalance <= 0 ? (
                  <Empty description="Nenhum investimento encontrado para o filtro selecionado." />
                ) : (
                  <div className={styles.treemapContainer}>
                    {/* Render Cash Tile if positive */}
                    {activeCashBalance > 0 && (
                      <div
                        className={`${styles.treemapTile} ${styles.profitTile}`}
                        style={{
                          flex: `${Math.max(1, (activeCashBalance / (displayedMetrics.totalCurrentValue || 1)) * 100)} 1 200px`,
                          borderLeft: "4px solid #10b981",
                        }}
                        onClick={() => {
                          setCashModalType("deposit");
                          cashForm.setFieldsValue({
                            currency: currencyFilter === "ALL" ? "BRL" : currencyFilter,
                          });
                          setIsCashModalOpen(true);
                        }}
                      >
                        <div className={styles.tileHeader}>
                          <div>
                            <span className={styles.tileTitle}>Caixa Livre / Dinheiro Parado</span>
                            <Tag color="green" style={{ marginLeft: 6 }}>
                              {currencyFilter === "ALL" ? "BRL" : currencyFilter}
                            </Tag>
                          </div>
                          <span className={styles.tilePercentage}>
                            {(
                              (activeCashBalance / (displayedMetrics.totalCurrentValue || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className={styles.tileBody}>
                          <div className={styles.tileValue} style={{ color: "#10b981" }}>
                            {displayedMetrics.currencySymbol}{" "}
                            {Number(activeCashBalance).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          <div className={styles.tilePerformance} style={{ color: "#10b981" }}>
                            Saldo disponível para compras
                          </div>
                        </div>
                        <div className={styles.tileFooter}>
                          <span>Liquidez imediata</span>
                          <span>+ Depositar / Sacar</span>
                        </div>
                      </div>
                    )}

                    {filteredInvestments.map((inv) => {
                      const sharePct =
                        displayedMetrics.totalCurrentValue > 0
                          ? ((inv.currentValue * (currencyFilter === "ALL" && inv.currency === "USD" ? portfolio.usdExchangeRate || 5.60 : currencyFilter === "ALL" && inv.currency === "EUR" ? portfolio.eurExchangeRate || 6.10 : 1)) / displayedMetrics.totalCurrentValue) * 100
                          : 0;
                      const flexBasis = Math.max(220, Math.min(600, (sharePct / 100) * 900));

                      return (
                        <div
                          key={inv.investmentID}
                          className={`${styles.treemapTile} ${
                            inv.profitLossAmount >= 0 ? styles.profitTile : styles.lossTile
                          }`}
                          style={{ flex: `${Math.max(1, sharePct)} 1 ${flexBasis}px` }}
                          onClick={() => handleOpenDetailModal(inv)}
                        >
                          <div className={styles.tileHeader}>
                            <div>
                              <span className={styles.tileTitle}>{inv.name}</span>
                              {inv.ticker && (
                                <Tag color="blue" style={{ marginLeft: 6 }}>
                                  {inv.ticker}
                                </Tag>
                              )}
                              <Tag color={inv.currency === "USD" ? "green" : inv.currency === "EUR" ? "gold" : "blue"} style={{ marginLeft: 4 }}>
                                {inv.currency || "BRL"}
                              </Tag>
                            </div>
                            <span className={styles.tilePercentage}>
                              {sharePct.toFixed(1)}% of total
                            </span>
                          </div>

                          <div className={styles.tileBody}>
                            <div className={styles.tileValue}>
                              {getCurrencySymbol(inv.currency)}{" "}
                              {Number(inv.currentValue).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <div
                              className={`${styles.tilePerformance} ${
                                inv.profitLossAmount >= 0
                                  ? styles.positiveText
                                  : styles.negativeText
                              }`}
                            >
                              {inv.profitLossAmount >= 0 ? "+" : ""}
                              {getCurrencySymbol(inv.currency)}{" "}
                              {Number(inv.profitLossAmount).toFixed(2)} (
                              {inv.profitLossAmount >= 0 ? "+" : ""}
                              {inv.profitLossPercentage}%)
                            </div>
                          </div>

                          <div className={styles.tileFooter}>
                            <span>
                              Aportado: {getCurrencySymbol(inv.currency)}{" "}
                              {Number(inv.totalInvested).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            <span>
                              {inv.investmentType === InvestmentType.Crypto
                                ? `${inv.quantity ?? 0} unidades`
                                : inv.investmentType === InvestmentType.VariableIncome
                                ? `${inv.quantity ?? 0} cotas`
                                : inv.rateType === FixedRateType.Selic_CDI
                                ? `${inv.annualRate ?? 100}% do CDI`
                                : inv.rateType === FixedRateType.IPCA_Plus
                                ? `IPCA + ${inv.annualRate ?? 0}% a.a.`
                                : inv.annualRate
                                ? `${inv.annualRate}% a.a.`
                                : "Renda Fixa"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {viewMode === "pie" && (
              <Card variant="borderless" title="Alocação da Carteira (Distribuição de Ativos)">
                {filteredInvestments.length === 0 && activeCashBalance <= 0 ? (
                  <Empty description="Nenhum investimento encontrado" />
                ) : (
                  <div className={styles.chartLayout}>
                    <div className={styles.pizzaCanvasContainer}>
                      <svg width="240" height="240" viewBox="0 0 42 42">
                        {(() => {
                          let accumulatedPercent = 0;
                          const totalVal = displayedMetrics.totalCurrentValue || 1;

                          const slices = [
                            ...(activeCashBalance > 0
                              ? [
                                  {
                                    id: -1,
                                    name: "Caixa Livre",
                                    value: activeCashBalance,
                                    pct: (activeCashBalance / totalVal) * 100,
                                    color: "#10b981",
                                    currency: currencyFilter === "ALL" ? "BRL" : currencyFilter,
                                  },
                                ]
                              : []),
                            ...filteredInvestments.map((inv, idx) => {
                              const convertedVal = inv.currentValue * (currencyFilter === "ALL" && inv.currency === "USD" ? portfolio.usdExchangeRate || 5.60 : currencyFilter === "ALL" && inv.currency === "EUR" ? portfolio.eurExchangeRate || 6.10 : 1);
                              return {
                                id: inv.investmentID,
                                name: inv.name,
                                value: inv.currentValue,
                                pct: (convertedVal / totalVal) * 100,
                                color: chartColors[idx % chartColors.length],
                                currency: inv.currency || "BRL",
                                rawInv: inv,
                              };
                            }),
                          ];

                          return slices.map((slice) => {
                            const dashArray = `${slice.pct} ${100 - slice.pct}`;
                            const dashOffset = 100 - accumulatedPercent + 25;
                            accumulatedPercent += slice.pct;

                            return (
                              <circle
                                key={slice.id}
                                cx="21"
                                cy="21"
                                r="15.91549430918954"
                                fill="transparent"
                                stroke={slice.color}
                                strokeWidth="5"
                                strokeDasharray={dashArray}
                                strokeDashoffset={dashOffset}
                              />
                            );
                          });
                        })()}
                      </svg>
                    </div>

                    <div className={styles.chartLegend}>
                      {activeCashBalance > 0 && (
                        <div
                          className={styles.legendItem}
                          onClick={() => {
                            setCashModalType("deposit");
                            cashForm.setFieldsValue({
                              currency: currencyFilter === "ALL" ? "BRL" : currencyFilter,
                            });
                            setIsCashModalOpen(true);
                          }}
                        >
                          <div className={styles.legendLabel}>
                            <span className={styles.colorDot} style={{ backgroundColor: "#10b981" }} />
                            <span>Caixa Livre ({currencyFilter === "ALL" ? "BRL" : currencyFilter})</span>
                          </div>
                          <span className={styles.legendValue} style={{ color: "#10b981" }}>
                            {displayedMetrics.currencySymbol} {Number(activeCashBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (
                            {((activeCashBalance / (displayedMetrics.totalCurrentValue || 1)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}

                      {filteredInvestments.map((inv, idx) => {
                        const convertedVal = inv.currentValue * (currencyFilter === "ALL" && inv.currency === "USD" ? portfolio.usdExchangeRate || 5.60 : currencyFilter === "ALL" && inv.currency === "EUR" ? portfolio.eurExchangeRate || 6.10 : 1);
                        const pct =
                          displayedMetrics.totalCurrentValue > 0
                            ? ((convertedVal / displayedMetrics.totalCurrentValue) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={inv.investmentID}
                            className={styles.legendItem}
                            onClick={() => handleOpenDetailModal(inv)}
                          >
                            <div className={styles.legendLabel}>
                              <span
                                className={styles.colorDot}
                                style={{
                                  backgroundColor: chartColors[idx % chartColors.length],
                                }}
                              />
                              <span>{inv.name}</span>
                              <Tag color={inv.currency === "USD" ? "green" : inv.currency === "EUR" ? "gold" : "blue"} style={{ marginLeft: 4, fontSize: 10 }}>
                                {inv.currency || "BRL"}
                              </Tag>
                            </div>
                            <span className={styles.legendValue}>
                              {getCurrencySymbol(inv.currency)}{" "}
                              {Number(inv.currentValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {viewMode === "list" && (
              <Card variant="borderless" title="Todos os Investimentos">
                <Table
                  dataSource={filteredInvestments}
                  columns={columns}
                  rowKey="investmentID"
                  pagination={{ pageSize: 8 }}
                  loading={loading}
                />
              </Card>
            )}

            {/* Modal: Create New Investment */}
            <Modal
              title="Adicionar Novo Investimento"
              open={isAddModalOpen}
              onCancel={() => setIsAddModalOpen(false)}
              onOk={() => addForm.submit()}
              okText="Cadastrar Investimento"
              cancelText="Cancelar"
              confirmLoading={loading}
              width={560}
              destroyOnHidden
            >
              <Form
                form={addForm}
                layout="vertical"
                initialValues={{
                  investmentType: InvestmentType.VariableIncome,
                  currency: "BRL",
                  startDate: dayjs(),
                  fundingSource: "external",
                }}
                onFinish={handleCreateInvestment}
              >
                <Form.Item name="fundingSource" label="Origem do Recurso">
                  <Radio.Group style={{ width: "100%" }}>
                    <Radio.Button value="external" style={{ width: "50%", textAlign: "center" }}>
                      Aporte Externo (Novo Capital)
                    </Radio.Button>
                    <Radio.Button
                      value="cash"
                      style={{ width: "50%", textAlign: "center" }}
                      disabled={
                        (portfolio.cashBalances?.[selectedAddCurrency] ??
                          (selectedAddCurrency === "BRL" ? portfolio.unallocatedCash : 0)) <= 0
                      }
                    >
                      Debitar do Caixa (
                      {getCurrencySymbol(selectedAddCurrency)}{" "}
                      {Number(
                        portfolio.cashBalances?.[selectedAddCurrency] ??
                          (selectedAddCurrency === "BRL" ? portfolio.unallocatedCash : 0)
                      ).toFixed(2)}
                      )
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="name"
                      label="Nome do Ativo"
                      rules={[{ required: true, message: "Insira o nome do ativo" }]}
                    >
                      <Input placeholder="Ex: Petrobras PN, Tesouro Selic 2029, Bitcoin" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="currency" label="Moeda">
                      <Select>
                        <Option value="BRL">BRL (R$)</Option>
                        <Option value="USD">USD ($)</Option>
                        <Option value="EUR">EUR (€)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="investmentType"
                  label="Tipo de Investimento"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value={InvestmentType.VariableIncome}>
                      Renda Variável (Ações, FIIs, ETFs, B3 / Exterior)
                    </Option>
                    <Option value={InvestmentType.FixedIncome}>
                      Renda Fixa (CDB, Tesouro Selic/IPCA, LCI/LCA, Debêntures)
                    </Option>
                    <Option value={InvestmentType.Crypto}>
                      Criptomoedas (Bitcoin, Ethereum, Solana)
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    prev.investmentType !== curr.investmentType
                  }
                >
                  {({ getFieldValue }) => {
                    const currentType = getFieldValue("investmentType");
                    const isCrypto = currentType === InvestmentType.Crypto;

                    if (currentType === InvestmentType.VariableIncome || isCrypto) {
                      return (
                        <Row gutter={16}>
                          <Col span={10}>
                            <Form.Item
                              name="ticker"
                              label={isCrypto ? "Código / Par (Cripto)" : "Código / Ticker (B3 / Bolsa)"}
                              rules={[{ required: true, message: "Insira o código do ativo" }]}
                            >
                              <Input placeholder={isCrypto ? "Ex: BTC, ETH, SOL" : "Ex: PETR4, AAPL, VALE3"} />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item name="quantity" label={isCrypto ? "Quantidade de Moedas" : "Nº de Cotas / Ações"}>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0.00000001}
                                step={isCrypto ? 0.00000001 : 1}
                                precision={isCrypto ? 8 : 4}
                                placeholder={isCrypto ? "0,00000000" : "0"}
                                onChange={(qty) => {
                                  const price = addForm.getFieldValue("purchasePricePerUnit");
                                  const total = addForm.getFieldValue("totalInvested");
                                  if (qty && price) {
                                    addForm.setFieldsValue({
                                      totalInvested: Number((Number(qty) * Number(price)).toFixed(2)),
                                    });
                                  } else if (qty && total) {
                                    addForm.setFieldsValue({
                                      purchasePricePerUnit: Number((Number(total) / Number(qty)).toFixed(2)),
                                    });
                                  }
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item name="purchasePricePerUnit" label={isCrypto ? "Preço Médio / Unidade" : "Preço Médio / Cota"}>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0.00000001}
                                precision={2}
                                prefix="R$"
                                onChange={(price) => {
                                  const qty = addForm.getFieldValue("quantity");
                                  if (price && qty) {
                                    addForm.setFieldsValue({
                                      totalInvested: Number((Number(qty) * Number(price)).toFixed(2)),
                                    });
                                  }
                                }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      );
                    }

                    return (
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="rateType" label="Indexador / Taxa" rules={[{ required: true, message: "Selecione o indexador" }]}>
                            <Select placeholder="Selecione o indexador">
                              <Option value={FixedRateType.Selic_CDI}>% do CDI / Selic</Option>
                              <Option value={FixedRateType.Prefixado}>Pré-fixado (% a.a.)</Option>
                              <Option value={FixedRateType.IPCA_Plus}>IPCA + Taxa Fixa (% a.a.)</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) => prev.rateType !== curr.rateType}
                          >
                            {({ getFieldValue: getRateField }) => {
                              const selectedRate = getRateField("rateType");
                              const isCdi = selectedRate === FixedRateType.Selic_CDI;
                              const isIpca = selectedRate === FixedRateType.IPCA_Plus;

                              return (
                                <Form.Item
                                  name="annualRate"
                                  label={
                                    isCdi
                                      ? "Percentual do CDI (%)"
                                      : isIpca
                                      ? "Taxa Adicional ao IPCA (% a.a.)"
                                      : "Taxa Pré-fixada (% a.a.)"
                                  }
                                  rules={[{ required: true, message: "Insira a rentabilidade contratada" }]}
                                >
                                  <InputNumber
                                    style={{ width: "100%" }}
                                    placeholder={isCdi ? "Ex: 110 (para 110% do CDI)" : "Ex: 12.5"}
                                    suffix={isCdi ? "% CDI" : "% a.a."}
                                  />
                                </Form.Item>
                              );
                            }}
                          </Form.Item>
                        </Col>
                      </Row>
                    );
                  }}
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="totalInvested"
                      label="Valor Total Aportado"
                      rules={[{ required: true, message: "Insira o valor investido" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        precision={2}
                        prefix="R$"
                        onChange={(total) => {
                          const qty = addForm.getFieldValue("quantity");
                          if (total && qty && Number(qty) > 0) {
                            addForm.setFieldsValue({
                              purchasePricePerUnit: Number((Number(total) / Number(qty)).toFixed(2)),
                            });
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="startDate" label="Data do Aporte / Aquisição">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Selecione a data" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Modal>

            {/* Modal: Detail, Growth Graph & Manage (Add/Remove/Liquidate) */}
            <Modal
              title={`Gerenciar Ativo: ${selectedInvestment?.name || ""}`}
              open={isDetailModalOpen}
              onCancel={() => {
                setIsDetailModalOpen(false);
                setSelectedInvestment(null);
              }}
              footer={null}
              width={650}
              destroyOnHidden
            >
              {selectedInvestment && (
                <Tabs
                  defaultActiveKey="overview"
                  items={[
                    {
                      key: "overview",
                      label: "Evolução & Desempenho",
                      children: (
                        <div>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Card size="small" variant="borderless">
                                <Statistic
                                  title="Saldo Atual"
                                  value={selectedInvestment.currentValue}
                                  precision={2}
                                  prefix={`${selectedInvestment.currency === "USD" ? "$" : "R$"} `}
                                  styles={{ value: { color: "#38bdf8", fontVariantNumeric: "tabular-nums" } }}
                                />
                              </Card>
                            </Col>
                            <Col span={8}>
                              <Card size="small" variant="borderless">
                                <Statistic
                                  title="Total Aportado"
                                  value={selectedInvestment.totalInvested}
                                  precision={2}
                                  prefix={`${selectedInvestment.currency === "USD" ? "$" : "R$"} `}
                                  styles={{ value: { fontVariantNumeric: "tabular-nums" } }}
                                />
                              </Card>
                            </Col>
                            <Col span={8}>
                              <Card size="small" variant="borderless">
                                <Statistic
                                  title="Lucro / Prejuízo"
                                  value={selectedInvestment.profitLossAmount}
                                  precision={2}
                                  prefix={
                                    selectedInvestment.profitLossAmount >= 0
                                      ? `+${selectedInvestment.currency === "USD" ? "$" : "R$"} `
                                      : `${selectedInvestment.currency === "USD" ? "$" : "R$"} `
                                  }
                                  styles={{
                                    value: {
                                      color:
                                        selectedInvestment.profitLossAmount >= 0
                                          ? "#10b981"
                                          : "#f43f5e",
                                      fontVariantNumeric: "tabular-nums",
                                    },
                                  }}
                                />
                              </Card>
                            </Col>
                          </Row>

                          {/* Historical Growth SVG Graph */}
                          <div className={styles.growthChartContainer}>
                            <div className={styles.chartHeader}>
                              <h4>Linha do Tempo da Rentabilidade</h4>
                              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                                Total Investido vs. Saldo Líquido
                              </span>
                            </div>

                            {growthPoints.length > 0 ? (
                              <svg
                                className={styles.svgChart}
                                viewBox="0 0 500 150"
                                preserveAspectRatio="none"
                              >
                                {(() => {
                                  const maxVal = Math.max(
                                    ...growthPoints.map((p) =>
                                      Math.max(p.currentValue, p.investedAmount)
                                    ),
                                    1
                                  );
                                  const pointsStr = growthPoints
                                    .map((p, idx) => {
                                      const x = (idx / (growthPoints.length - 1 || 1)) * 500;
                                      const y = 140 - (p.currentValue / maxVal) * 120;
                                      return `${x},${y}`;
                                    })
                                    .join(" ");

                                  return (
                                    <>
                                      <polyline
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="3"
                                        points={pointsStr}
                                      />
                                    </>
                                  );
                                })()}
                              </svg>
                            ) : (
                              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px 0" }}>
                                {loadingGrowth
                                  ? "Calculando histórico de rentabilidade..."
                                  : "Apenas um registro histórico disponível até o momento."}
                              </p>
                            )}
                          </div>

                          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                            <Popconfirm
                              title="Resgatar / Liquidar Ativo?"
                              description="Zera a posição na carteira e registra o resgate do valor."
                              onConfirm={() => handleLiquidate(selectedInvestment.investmentID)}
                              okText="Liquidar"
                              okButtonProps={{ danger: true }}
                              cancelText="Cancelar"
                            >
                              <Button danger icon={<CheckCircleOutlined />}>
                                Resgatar / Liquidar
                              </Button>
                            </Popconfirm>

                            <Popconfirm
                              title="Excluir Permanentemente?"
                              description="Deseja remover este ativo da carteira?"
                              onConfirm={() => handleDelete(selectedInvestment.investmentID)}
                              okText="Excluir"
                              okButtonProps={{ danger: true }}
                              cancelText="Cancelar"
                            >
                              <Button type="text" danger icon={<DeleteOutlined />}>
                                Excluir Registro
                              </Button>
                            </Popconfirm>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "transact",
                      label: "Aportar / Resgatar",
                      children: (
                        <Form
                          form={transForm}
                          layout="vertical"
                          onFinish={handleAddTransaction}
                          initialValues={{
                            transactionType: InvestmentTransactionType.Buy,
                            transactionDate: dayjs(),
                          }}
                        >
                          <Form.Item
                            name="transactionType"
                            label="Operação"
                            rules={[{ required: true }]}
                          >
                            <Select>
                              <Option value={InvestmentTransactionType.Buy}>
                                {selectedInvestment?.investmentType === InvestmentType.Crypto
                                  ? "Novo Aporte / Comprar Moedas"
                                  : "Novo Aporte / Comprar Cotas / Ações"}
                              </Option>
                              <Option value={InvestmentTransactionType.Sell}>
                                {selectedInvestment?.investmentType === InvestmentType.Crypto
                                  ? "Venda Parcial / Resgate de Moedas"
                                  : "Venda Parcial / Resgate de Cotas"}
                              </Option>
                              <Option value={InvestmentTransactionType.Dividend}>
                                {selectedInvestment?.investmentType === InvestmentType.Crypto
                                  ? "Rendimento / Recompensa (Staking)"
                                  : "Dividendos / Proventos / JCP"}
                              </Option>
                              {selectedInvestment?.investmentType !== InvestmentType.Crypto && (
                                <Option value={InvestmentTransactionType.StockSplit}>
                                  Desdobramento / Grupamento
                                </Option>
                              )}
                            </Select>
                          </Form.Item>

                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) => prev.transactionType !== curr.transactionType}
                          >
                            {({ getFieldValue }) => {
                              const opType = getFieldValue("transactionType");
                              const isSell = opType === InvestmentTransactionType.Sell;
                              const availableQty = selectedInvestment?.quantity ?? 0;
                              const availableVal = selectedInvestment?.currentValue ?? 0;

                              // Use live/actual current price per unit if available, fallback to computed current value / qty, then purchase price
                              const effectiveCurrentPrice =
                                selectedInvestment?.currentPricePerUnit && selectedInvestment.currentPricePerUnit > 0
                                  ? selectedInvestment.currentPricePerUnit
                                  : selectedInvestment?.quantity && selectedInvestment.quantity > 0
                                  ? selectedInvestment.currentValue / selectedInvestment.quantity
                                  : selectedInvestment?.purchasePricePerUnit ?? 0;

                              return (
                                <Row gutter={16}>
                                  <Col span={12}>
                                    <Form.Item
                                      name="amount"
                                      label="Valor Financeiro (R$)"
                                      rules={[
                                        { required: true, message: "Insira o valor" },
                                        ...(isSell
                                          ? [
                                              {
                                                validator: async (_: any, value: number) => {
                                                  if (value && value > availableVal) {
                                                    return Promise.reject(
                                                      new Error(
                                                        `Valor máximo para resgate é R$ ${Number(availableVal).toFixed(2)}`
                                                      )
                                                    );
                                                  }
                                                  return Promise.resolve();
                                                },
                                              },
                                            ]
                                          : []),
                                      ]}
                                    >
                                      <InputNumber
                                        style={{ width: "100%" }}
                                        min={0}
                                        max={isSell ? availableVal : undefined}
                                        precision={2}
                                        prefix="R$"
                                        onChange={(amt) => {
                                          if (!amt || Number(amt) <= 0) {
                                            transForm.setFieldsValue({
                                              quantity: undefined,
                                              unitPrice: Number(effectiveCurrentPrice.toFixed(2)),
                                            });
                                            return;
                                          }

                                          let finalAmt = Number(amt);
                                          if (isSell && finalAmt > availableVal) {
                                            finalAmt = availableVal;
                                            transForm.setFieldsValue({ amount: finalAmt });
                                          }

                                          if (effectiveCurrentPrice > 0) {
                                            let computedQty = finalAmt / effectiveCurrentPrice;
                                            if (isSell && computedQty > availableQty) {
                                              computedQty = availableQty;
                                            }
                                            transForm.setFieldsValue({
                                              quantity: Number(
                                                computedQty.toFixed(
                                                  selectedInvestment?.investmentType === InvestmentType.Crypto ? 8 : 4
                                                )
                                              ),
                                              unitPrice: Number(effectiveCurrentPrice.toFixed(2)),
                                            });
                                          }
                                        }}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col span={12}>
                                    <Form.Item
                                      name="quantity"
                                      label={
                                        selectedInvestment?.investmentType === InvestmentType.Crypto
                                          ? `Quantidade de Moedas${isSell ? ` (Máx: ${availableQty})` : ""}`
                                          : `Quantidade de Cotas${isSell ? ` (Máx: ${availableQty})` : ""}`
                                      }
                                      rules={[
                                        ...(isSell
                                          ? [
                                              {
                                                validator: async (_: any, value: number) => {
                                                  if (value && value > availableQty) {
                                                    return Promise.reject(
                                                      new Error(
                                                        `Você possui apenas ${availableQty} ${
                                                          selectedInvestment?.investmentType === InvestmentType.Crypto
                                                            ? "moedas"
                                                            : "cotas"
                                                        } disponíveis para venda.`
                                                      )
                                                    );
                                                  }
                                                  return Promise.resolve();
                                                },
                                              },
                                            ]
                                          : []),
                                      ]}
                                    >
                                      <InputNumber
                                        style={{ width: "100%" }}
                                        min={0.00000001}
                                        max={isSell ? availableQty : undefined}
                                        step={selectedInvestment?.investmentType === InvestmentType.Crypto ? 0.00000001 : 1}
                                        precision={selectedInvestment?.investmentType === InvestmentType.Crypto ? 8 : 4}
                                        onChange={(qty) => {
                                          if (!qty || Number(qty) <= 0) {
                                            transForm.setFieldsValue({
                                              amount: undefined,
                                              unitPrice: Number(effectiveCurrentPrice.toFixed(2)),
                                            });
                                            return;
                                          }

                                          let finalQty = Number(qty);
                                          if (isSell && finalQty > availableQty) {
                                            finalQty = availableQty;
                                            transForm.setFieldsValue({ quantity: finalQty });
                                          }

                                          if (effectiveCurrentPrice > 0) {
                                            let totalAmt = finalQty * effectiveCurrentPrice;
                                            if (isSell && totalAmt > availableVal) {
                                              totalAmt = availableVal;
                                            }
                                            transForm.setFieldsValue({
                                              amount: Number(totalAmt.toFixed(2)),
                                              unitPrice: Number(effectiveCurrentPrice.toFixed(2)),
                                            });
                                          }
                                        }}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              );
                            }}
                          </Form.Item>

                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) => prev.transactionType !== curr.transactionType}
                          >
                            {({ getFieldValue }) => {
                              const opType = getFieldValue("transactionType");
                              const isBuy = opType === InvestmentTransactionType.Buy;
                              const isSell = opType === InvestmentTransactionType.Sell;
                              const isDividend = opType === InvestmentTransactionType.Dividend;

                              if (isBuy) {
                                const invCur = (selectedInvestment?.currency || "BRL").toUpperCase();
                                const invCashBal =
                                  portfolio.cashBalances?.[invCur] ??
                                  (invCur === "BRL" ? portfolio.unallocatedCash : 0);

                                return (
                                  <Form.Item name="fundingSource" label="Origem do Recurso">
                                    <Radio.Group style={{ width: "100%" }}>
                                      <Radio.Button value="external" style={{ width: "50%", textAlign: "center" }}>
                                        Aporte Externo (Novo)
                                      </Radio.Button>
                                      <Radio.Button
                                        value="cash"
                                        style={{ width: "50%", textAlign: "center" }}
                                        disabled={invCashBal <= 0}
                                      >
                                        Debitar do Caixa ({getCurrencySymbol(invCur)} {Number(invCashBal).toFixed(2)})
                                      </Radio.Button>
                                    </Radio.Group>
                                  </Form.Item>
                                );
                              }

                              if (isSell || isDividend) {
                                return (
                                  <Alert
                                    type="info"
                                    showIcon
                                    icon={<WalletOutlined />}
                                    message={
                                      isSell
                                        ? "O valor desta venda será creditado no seu Caixa Livre da Carteira."
                                        : "Os proventos serão depositados automaticamente no seu Caixa Livre da Carteira."
                                    }
                                    style={{ marginBottom: 16 }}
                                  />
                                );
                              }

                              return null;
                            }}
                          </Form.Item>

                          <Form.Item name="notes" label="Observações">
                            <Input placeholder="Ex: Aporte mensal, reinvestimento de dividendos" />
                          </Form.Item>

                          <Button type="primary" htmlType="submit" loading={loading} block>
                            Confirmar Operação
                          </Button>
                        </Form>
                      ),
                    },
                  ]}
                />
              )}
            </Modal>

            {/* Modal: Portfolio Cash Movement (Deposit / Withdraw) */}
            {/* Modal: Cash Deposit / Withdraw */}
            <Modal
              title={cashModalType === "deposit" ? "Depositar no Caixa Livre" : "Sacar do Caixa Livre"}
              open={isCashModalOpen}
              onCancel={() => {
                setIsCashModalOpen(false);
                cashForm.resetFields();
              }}
              onOk={() => cashForm.submit()}
              okText={cashModalType === "deposit" ? "Confirmar Depósito" : "Confirmar Saque"}
              cancelText="Cancelar"
              confirmLoading={loading}
              destroyOnHidden
            >
              <Alert
                type="info"
                showIcon
                message={
                  cashModalType === "deposit"
                    ? "Adicione capital livre à sua carteira para aproveitar oportunidades e comprar ativos quando desejar."
                    : `Saldo disponível para saque (${selectedCashCurrency}): ${getCurrencySymbol(selectedCashCurrency)} ${Number(
                        portfolio.cashBalances?.[selectedCashCurrency] ?? (selectedCashCurrency === "BRL" ? portfolio.unallocatedCash : 0)
                      ).toFixed(2)}`
                }
                style={{ marginBottom: 16 }}
              />

              <Form
                form={cashForm}
                layout="vertical"
                initialValues={{
                  amount: undefined,
                  currency: currencyFilter === "ALL" ? "BRL" : currencyFilter,
                }}
                onFinish={handleCashMovement}
              >
                <Row gutter={16}>
                  <Col span={10}>
                    <Form.Item name="currency" label="Moeda do Caixa" rules={[{ required: true }]}>
                      <Select
                        onChange={() => {
                          cashForm.validateFields(["amount"]);
                        }}
                      >
                        <Option value="BRL">🇧🇷 BRL (R$)</Option>
                        <Option value="USD">🇺🇸 USD ($)</Option>
                        <Option value="EUR">🇪🇺 EUR (€)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={14}>
                    <Form.Item
                      name="amount"
                      label={`Valor (${getCurrencySymbol(selectedCashCurrency)})`}
                      rules={[
                        { required: true, message: "Insira o valor" },
                        ...(cashModalType === "withdraw"
                          ? [
                              {
                                validator: async (_: any, value: number) => {
                                  const currentBal =
                                    portfolio.cashBalances?.[selectedCashCurrency] ??
                                    (selectedCashCurrency === "BRL" ? portfolio.unallocatedCash : 0);
                                  if (value && value > currentBal) {
                                    return Promise.reject(
                                      new Error(
                                        `Valor máximo para saque é ${getCurrencySymbol(selectedCashCurrency)} ${Number(currentBal).toFixed(2)}`
                                      )
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]
                          : []),
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        precision={2}
                        prefix={getCurrencySymbol(selectedCashCurrency)}
                        placeholder="0,00"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="notes" label="Descrição / Finalidade">
                  <Input
                    placeholder={
                      cashModalType === "deposit"
                        ? "Ex: Aporte para reserva de oportunidade"
                        : "Ex: Retirada de lucros para conta bancária"
                    }
                  />
                </Form.Item>
              </Form>
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
