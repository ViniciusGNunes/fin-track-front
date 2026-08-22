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
  SwapOutlined,
  CheckCircleOutlined,
  StockOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
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
  updateInvestment,
  addInvestmentTransaction,
  liquidateInvestment,
  deleteInvestment,
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
    investments: [],
  });
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<IInvestment | null>(null);
  const [growthPoints, setGrowthPoints] = useState<IInvestmentGrowthPoint[]>([]);
  const [loadingGrowth, setLoadingGrowth] = useState(false);

  const [addForm] = Form.useForm();
  const [transForm] = Form.useForm();
  const [editForm] = Form.useForm();

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
        userID: userInfo?.id ? Number(userInfo.id) : 1,
      };

      await createInvestment(payload);
      message.success("Investment added successfully!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      await fetchPortfolio();
    } catch (err) {
      message.error("Failed to add investment");
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
          transactionDate: values.transactionDate ? values.transactionDate.toISOString() : new Date().toISOString(),
          notes: values.notes || null,
        },
        userInfo?.id ? Number(userInfo.id) : undefined
      );

      message.success("Transaction recorded successfully!");
      transForm.resetFields();
      setIsDetailModalOpen(false);
      await fetchPortfolio();
    } catch (err) {
      message.error("Failed to record transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidate = async (investmentId: number) => {
    try {
      setLoading(true);
      await liquidateInvestment(investmentId, userInfo?.id ? Number(userInfo.id) : undefined);
      message.success("Investment liquidated successfully!");
      setIsDetailModalOpen(false);
      await fetchPortfolio();
    } catch (err) {
      message.error("Failed to liquidate investment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (investmentId: number) => {
    try {
      setLoading(true);
      await deleteInvestment(investmentId, userInfo?.id ? Number(userInfo.id) : undefined);
      message.success("Investment removed");
      setIsDetailModalOpen(false);
      await fetchPortfolio();
    } catch (err) {
      message.error("Failed to delete investment");
    } finally {
      setLoading(false);
    }
  };

  // Table columns for list view
  const columns = [
    {
      title: "Asset",
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
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "investmentType",
      key: "investmentType",
      render: (type: InvestmentType) => {
        if (type === InvestmentType.Crypto) {
          return <Tag color="purple">Crypto</Tag>;
        }
        if (type === InvestmentType.VariableIncome) {
          return <Tag color="blue">Variable (Stock/FII)</Tag>;
        }
        return <Tag color="gold">Fixed Income</Tag>;
      },
    },
    {
      title: "Total Invested",
      dataIndex: "totalInvested",
      key: "totalInvested",
      render: (val: number, record: IInvestment) =>
        `${record.currency === "USD" ? "$" : "R$"} ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: "Current Value",
      dataIndex: "currentValue",
      key: "currentValue",
      render: (val: number, record: IInvestment) => (
        <strong>
          {record.currency === "USD" ? "$" : "R$"}{" "}
          {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </strong>
      ),
    },
    {
      title: "Profit / Loss",
      dataIndex: "profitLossAmount",
      key: "profitLossAmount",
      render: (val: number, record: IInvestment) => {
        const isPos = val >= 0;
        return (
          <span className={isPos ? styles.positiveText : styles.negativeText}>
            {isPos ? "+" : ""}
            {record.currency === "USD" ? "$" : "R$"}{" "}
            {Number(val).toFixed(2)} ({isPos ? "+" : ""}
            {record.profitLossPercentage}%)
          </span>
        );
      },
    },
    {
      title: "Portfolio %",
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
      title: "Actions",
      key: "actions",
      render: (_: any, record: IInvestment) => (
        <Space size="small">
          <Tooltip title="View & Manage">
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
        <Sidebar
          collapsed={collapsed}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
        />

        <Layout className={styles.mainLayout}>
          <Header
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            username={userInfo?.name || "User"}
            hasGoals={false}
            onToggleGoals={() => {}}
          />

          <Content className={styles.content}>
            <div className={styles.pageHeader}>
              <div>
                <h2>Investments Portfolio</h2>
                <p>
                  Monitor asset allocations, market returns, rates, and historical growth.
                </p>
              </div>

              <div className={styles.headerControls}>
                <Segmented
                  value={viewMode}
                  onChange={(val) => setViewMode(val as any)}
                  options={[
                    { value: "treemap", icon: <AppstoreOutlined />, label: "Mosaic / Size" },
                    { value: "pie", icon: <PieChartOutlined />, label: "Pizza Chart" },
                    { value: "list", icon: <UnorderedListOutlined />, label: "List" },
                  ]}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  New Investment
                </Button>
              </div>
            </div>

            {/* Metrics Overview */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Total Portfolio Value"
                    value={portfolio.totalCurrentValue}
                    precision={2}
                    prefix="R$ "
                    styles={{ value: { color: "#58a6ff" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Total Invested Capital"
                    value={portfolio.totalInvested}
                    precision={2}
                    prefix="R$ "
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Total Return (Profit / Loss)"
                    value={portfolio.totalProfitLossAmount}
                    precision={2}
                    prefix={portfolio.totalProfitLossAmount >= 0 ? "+R$ " : "R$ "}
                    styles={{
                      value: {
                        color:
                          portfolio.totalProfitLossAmount >= 0 ? "#008d0a" : "#ff4d4f",
                      },
                    }}
                  />
                  <span
                    className={
                      portfolio.totalProfitLossAmount >= 0
                        ? styles.trendUp
                        : styles.trendDown
                    }
                  >
                    {portfolio.totalProfitLossAmount >= 0 ? (
                      <RiseOutlined />
                    ) : (
                      <FallOutlined />
                    )}{" "}
                    {portfolio.totalProfitLossPercentage}% Overall Return
                  </span>
                </Card>
              </Col>
            </Row>

            {/* Views Section */}
            {viewMode === "treemap" && (
              <Card variant="borderless" title="Portfolio Mosaic (Size by Invested Amount)">
                {portfolio.investments.length === 0 ? (
                  <Empty description="No investments found. Add your first asset!" />
                ) : (
                  <div className={styles.treemapContainer}>
                    {portfolio.investments.map((inv) => {
                      const sharePct =
                        portfolio.totalCurrentValue > 0
                          ? (inv.currentValue / portfolio.totalCurrentValue) * 100
                          : 0;
                      // Dynamic width flex-basis based on share of portfolio
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
                            </div>
                            <span className={styles.tilePercentage}>
                              {sharePct.toFixed(1)}% of total
                            </span>
                          </div>

                          <div className={styles.tileBody}>
                            <div className={styles.tileValue}>
                              {inv.currency === "USD" ? "$" : "R$"}{" "}
                              {Number(inv.currentValue).toLocaleString(undefined, {
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
                              {inv.currency === "USD" ? "$" : "R$"}{" "}
                              {Number(inv.profitLossAmount).toFixed(2)} (
                              {inv.profitLossAmount >= 0 ? "+" : ""}
                              {inv.profitLossPercentage}%)
                            </div>
                          </div>

                          <div className={styles.tileFooter}>
                            <span>
                              Invested: {inv.currency === "USD" ? "$" : "R$"}{" "}
                              {Number(inv.totalInvested).toFixed(2)}
                            </span>
                            <span>
                              {inv.investmentType === InvestmentType.Crypto
                                ? `${inv.quantity ?? 0} units`
                                : inv.investmentType === InvestmentType.VariableIncome
                                ? `${inv.quantity ?? 0} shares`
                                : inv.annualRate
                                ? `${inv.annualRate}% p.a.`
                                : "Fixed Rate"}
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
              <Card variant="borderless" title="Portfolio Pizza Chart (Asset Allocation)">
                {portfolio.investments.length === 0 ? (
                  <Empty description="No investments found" />
                ) : (
                  <div className={styles.chartLayout}>
                    <div className={styles.pizzaCanvasContainer}>
                      {/* SVG Pizza / Donut Visualization */}
                      <svg width="240" height="240" viewBox="0 0 42 42">
                        {(() => {
                          let accumulatedPercent = 0;
                          return portfolio.investments.map((inv, idx) => {
                            const pct =
                              portfolio.totalCurrentValue > 0
                                ? (inv.currentValue / portfolio.totalCurrentValue) * 100
                                : 0;
                            const dashArray = `${pct} ${100 - pct}`;
                            const dashOffset = 100 - accumulatedPercent + 25;
                            accumulatedPercent += pct;

                            return (
                              <circle
                                key={inv.investmentID}
                                cx="21"
                                cy="21"
                                r="15.91549430918954"
                                fill="transparent"
                                stroke={chartColors[idx % chartColors.length]}
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
                      {portfolio.investments.map((inv, idx) => {
                        const pct =
                          portfolio.totalCurrentValue > 0
                            ? ((inv.currentValue / portfolio.totalCurrentValue) * 100).toFixed(1)
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
                            </div>
                            <span className={styles.legendValue}>
                              {inv.currency === "USD" ? "$" : "R$"}{" "}
                              {Number(inv.currentValue).toLocaleString()} ({pct}%)
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
              <Card variant="borderless" title="All Investments">
                <Table
                  dataSource={portfolio.investments}
                  columns={columns}
                  rowKey="investmentID"
                  pagination={{ pageSize: 8 }}
                  loading={loading}
                />
              </Card>
            )}

            {/* Modal: Create New Investment */}
            <Modal
              title="Add New Investment"
              open={isAddModalOpen}
              onCancel={() => setIsAddModalOpen(false)}
              onOk={() => addForm.submit()}
              okText="Create Investment"
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
                }}
                onFinish={handleCreateInvestment}
              >
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="name"
                      label="Investment Name"
                      rules={[{ required: true, message: "Enter name" }]}
                    >
                      <Input placeholder="e.g. Petrobras PN, Tesouro Selic 2029" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="currency" label="Currency">
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
                  label="Investment Category"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value={InvestmentType.VariableIncome}>
                      Variable Income (Stock, FII, ETF, Wall St / B3)
                    </Option>
                    <Option value={InvestmentType.FixedIncome}>
                      Fixed Income (CDB, Tesouro Selic, LCI/LCA)
                    </Option>
                    <Option value={InvestmentType.Crypto}>
                      Cryptocurrency (BTC, ETH, SOL, Crypto Assets)
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
                              label={isCrypto ? "Crypto Symbol" : "Ticker Symbol"}
                              rules={[{ required: true, message: "Enter ticker" }]}
                            >
                              <Input placeholder={isCrypto ? "e.g. BTC, ETH, SOL" : "e.g. PETR4, AAPL, VALE3"} />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item name="quantity" label={isCrypto ? "Coins / Units" : "Shares / Units"}>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0.00000001}
                                step={isCrypto ? 0.00000001 : 1}
                                precision={isCrypto ? 8 : 4}
                                placeholder={isCrypto ? "0.00000000" : "0"}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item name="purchasePricePerUnit" label={isCrypto ? "Price / Unit" : "Price / Share"}>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0.00000001}
                                precision={2}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      );
                    }

                    return (
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="rateType" label="Rate Index">
                            <Select placeholder="Select index type">
                              <Option value={FixedRateType.Selic_CDI}>% of CDI / Selic</Option>
                              <Option value={FixedRateType.Prefixado}>Pré-fixado (Fixed %)</Option>
                              <Option value={FixedRateType.IPCA_Plus}>IPCA + Fixed %</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="annualRate" label="Contracted Rate (%)">
                            <InputNumber
                              style={{ width: "100%" }}
                              placeholder="e.g. 110 (for 110% CDI) or 12.5"
                            />
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
                      label="Initial Invested Amount"
                      rules={[{ required: true, message: "Enter amount" }]}
                    >
                      <InputNumber style={{ width: "100%" }} min={0.01} precision={2} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="startDate" label="Start / Purchase Date">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Modal>

            {/* Modal: Detail, Growth Graph & Manage (Add/Remove/Liquidate) */}
            <Modal
              title={`Manage Investment: ${selectedInvestment?.name || ""}`}
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
                      label: "Performance & Growth",
                      children: (
                        <div>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Card size="small" variant="borderless">
                                <Statistic
                                  title="Current Value"
                                  value={selectedInvestment.currentValue}
                                  precision={2}
                                  prefix={`${selectedInvestment.currency === "USD" ? "$" : "R$"} `}
                                  styles={{ value: { color: "#58a6ff" } }}
                                />
                              </Card>
                            </Col>
                            <Col span={8}>
                              <Card size="small" variant="borderless">
                                <Statistic
                                  title="Total Invested"
                                  value={selectedInvestment.totalInvested}
                                  precision={2}
                                  prefix={`${selectedInvestment.currency === "USD" ? "$" : "R$"} `}
                                />
                              </Card>
                            </Col>
                            <Col span={8}>
                              <Card size="small" variant="borderless">
                                <Statistic
                                  title="Profit / Loss"
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
                                          ? "#008d0a"
                                          : "#ff4d4f",
                                    },
                                  }}
                                />
                              </Card>
                            </Col>
                          </Row>

                          {/* Historical Growth SVG Graph */}
                          <div className={styles.growthChartContainer}>
                            <div className={styles.chartHeader}>
                              <h4>Historical Growth & Value Timeline</h4>
                              <span style={{ color: "#8b949e", fontSize: 12 }}>
                                Total Invested vs. Net Value
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
                                        stroke="#008d0a"
                                        strokeWidth="3"
                                        points={pointsStr}
                                      />
                                    </>
                                  );
                                })()}
                              </svg>
                            ) : (
                              <p style={{ color: "#8b949e", textAlign: "center" }}>
                                {loadingGrowth
                                  ? "Calculating historical performance..."
                                  : "Single point in time recorded so far."}
                              </p>
                            )}
                          </div>

                          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                            <Popconfirm
                              title="Liquidate Investment?"
                              description="Zeroes your active position and records full liquidation payout."
                              onConfirm={() => handleLiquidate(selectedInvestment.investmentID)}
                              okText="Liquidate"
                              okButtonProps={{ danger: true }}
                            >
                              <Button danger icon={<CheckCircleOutlined />}>
                                Liquidate Position
                              </Button>
                            </Popconfirm>

                            <Popconfirm
                              title="Delete permanently?"
                              onConfirm={() => handleDelete(selectedInvestment.investmentID)}
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                            >
                              <Button type="text" danger icon={<DeleteOutlined />}>
                                Delete Record
                              </Button>
                            </Popconfirm>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "transact",
                      label: "Add / Remove Money",
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
                            label="Action"
                            rules={[{ required: true }]}
                          >
                            <Select>
                              <Option value={InvestmentTransactionType.Buy}>
                                {selectedInvestment?.investmentType === InvestmentType.Crypto
                                  ? "Add Money / Buy More Coins"
                                  : "Add Money / Buy More Shares"}
                              </Option>
                              <Option value={InvestmentTransactionType.Sell}>
                                {selectedInvestment?.investmentType === InvestmentType.Crypto
                                  ? "Remove Money / Sell Coins"
                                  : "Remove Money / Sell Partial"}
                              </Option>
                              <Option value={InvestmentTransactionType.Dividend}>
                                {selectedInvestment?.investmentType === InvestmentType.Crypto
                                  ? "Staking Reward / Yield"
                                  : "Dividend / Yield Payout"}
                              </Option>
                              {selectedInvestment?.investmentType !== InvestmentType.Crypto && (
                                <Option value={InvestmentTransactionType.StockSplit}>
                                  Stock Split / Consolidation
                                </Option>
                              )}
                            </Select>
                          </Form.Item>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="amount"
                                label="Amount ($/R$)"
                                rules={[{ required: true, message: "Enter amount" }]}
                              >
                                <InputNumber style={{ width: "100%" }} min={0} precision={2} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="quantity"
                                label={
                                  selectedInvestment?.investmentType === InvestmentType.Crypto
                                    ? "Coins Altered"
                                    : "Shares Altered"
                                }
                              >
                                <InputNumber
                                  style={{ width: "100%" }}
                                  min={0.00000001}
                                  step={selectedInvestment?.investmentType === InvestmentType.Crypto ? 0.00000001 : 1}
                                  precision={selectedInvestment?.investmentType === InvestmentType.Crypto ? 8 : 4}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item name="notes" label="Notes / Reason">
                            <Input placeholder="e.g. Monthly top-up" />
                          </Form.Item>

                          <Button type="primary" htmlType="submit" loading={loading} block>
                            Confirm Action
                          </Button>
                        </Form>
                      ),
                    },
                  ]}
                />
              )}
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
