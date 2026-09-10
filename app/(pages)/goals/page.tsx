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
  Empty,
  Progress,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  PieChartOutlined,
  AimOutlined,
  SyncOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
import { FINTRACK_THEME, FINTRACK_LOCALE } from "@/app/lib/theme";
import { UserCookieInfo } from "../../interfaces/UserCookieInfo";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import {
  IGoal,
  IGoalCreate,
  IGoalSummary,
  IGoalUpdate,
} from "../../interfaces/Goals/IGoal";
import {
  getGoalsSummary,
  createGoal,
  updateGoal,
  logGoalProgress,
  deleteGoal,
} from "@/app/services/Backend/GoalService";
import { getCategories } from "@/app/services/Backend/CategoriesService";
import { getDebtSummary } from "@/app/services/Backend/DebtService";
import ICategory from "../../interfaces/ICategory";
import { IDebt } from "../../interfaces/Debts/IDebt";
import { GoalCategory, GoalFrequency } from "@/app/Enums/FinTrackEnums";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;

export default function GoalsPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("goals");
  const [activeTab, setActiveTab] = useState<string>("all");

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

  const [summary, setSummary] = useState<IGoalSummary>({
    totalGoalsCount: 0,
    activeGoalsCount: 0,
    completedGoalsCount: 0,
    monthlyInvestmentTarget: 0,
    monthlyInvestmentActual: 0,
    monthlyDebtReductionTarget: 0,
    monthlyDebtReductionActual: 0,
    overallProgressPercentage: 0,
    goals: [],
  });
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [debts, setDebts] = useState<IDebt[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IGoal | null>(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [progressForm] = Form.useForm();

  const addCategory = Form.useWatch("category", addForm);
  const editCategory = Form.useWatch("category", editForm);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getGoalsSummary(
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      setSummary(data);
    } catch (err) {
      console.error("Failed to load goals summary", err);
      message.error("Não foi possível carregar as metas.");
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    fetchSummary();
    getCategories().then(setCategories).catch(() => {});
    getDebtSummary(userInfo?.id ? Number(userInfo.id) : undefined)
      .then((res) => setDebts(res.debts || []))
      .catch(() => {});
  }, [fetchSummary, userInfo?.id]);

  const handleCreateGoal = async (values: any) => {
    try {
      setLoading(true);
      const payload: IGoalCreate = {
        userID: userInfo?.id ? Number(userInfo.id) : 1,
        title: values.title,
        description: values.description,
        category: values.category,
        frequency: values.frequency ?? GoalFrequency.Monthly,
        targetAmount: Number(values.targetAmount),
        initialAmount: values.initialAmount ? Number(values.initialAmount) : 0,
        currency: values.currency || "BRL",
        linkedDebtID: values.linkedDebtID ?? null,
        linkedCategoryID: values.linkedCategoryID ?? null,
        targetDate: values.targetDate ? dayjs(values.targetDate).toISOString() : undefined,
        autoTrack: values.autoTrack ?? true,
      };

      await createGoal(payload);
      message.success("Meta financeira criada com sucesso! 🎯");
      setIsAddModalOpen(false);
      addForm.resetFields();
      await fetchSummary();
    } catch (err) {
      console.error("Failed to create goal", err);
      message.error("Não foi possível cadastrar a meta.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (values: any) => {
    if (!selectedGoal) return;
    try {
      setLoading(true);
      const payload: IGoalUpdate = {
        title: values.title,
        description: values.description,
        category: values.category,
        frequency: values.frequency,
        targetAmount: Number(values.targetAmount),
        currentAmount: values.currentAmount !== undefined && values.currentAmount !== null
          ? Number(values.currentAmount)
          : selectedGoal.currentAmount,
        currency: values.currency || "BRL",
        linkedDebtID: values.linkedDebtID ?? selectedGoal.linkedDebtID,
        linkedCategoryID: values.linkedCategoryID ?? selectedGoal.linkedCategoryID,
        targetDate: values.targetDate ? dayjs(values.targetDate).toISOString() : undefined,
        autoTrack: values.autoTrack ?? true,
        isCompleted: values.isCompleted ?? false,
      };

      await updateGoal(
        selectedGoal.goalID,
        payload,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success("Meta atualizada com sucesso!");
      setIsEditModalOpen(false);
      await fetchSummary();
    } catch (err) {
      console.error("Failed to update goal", err);
      message.error("Não foi possível atualizar a meta.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogProgress = async (values: any) => {
    if (!selectedGoal) return;
    try {
      setLoading(true);
      await logGoalProgress(
        selectedGoal.goalID,
        {
          amount: values.amount,
          isIncrement: values.isIncrement ?? true,
        },
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success("Progresso registrado com sucesso! 🎯");
      setIsProgressModalOpen(false);
      progressForm.resetFields();
      await fetchSummary();
    } catch (err) {
      console.error("Failed to log progress", err);
      message.error("Não foi possível registrar o progresso.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      setLoading(true);
      await deleteGoal(
        goalId,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success("Meta excluída com sucesso!");
      await fetchSummary();
    } catch (err) {
      console.error("Failed to delete goal", err);
      message.error("Não foi possível excluir a meta.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: GoalCategory) => {
    switch (cat) {
      case GoalCategory.MonthlyInvestment:
        return "Meta de Investimento";
      case GoalCategory.MonthlyDebtReduction:
        return "Amortização de Dívidas";
      case GoalCategory.ExpenseCap:
        return "Teto de Gastos";
      case GoalCategory.TargetSavings:
        return "Meta de Poupança";
      case GoalCategory.PortfolioMilestone:
        return "Patrimônio Líquido Alvo";
      default:
        return "Meta Financeira";
    }
  };

  const getCategoryIcon = (cat: GoalCategory) => {
    switch (cat) {
      case GoalCategory.MonthlyInvestment:
        return <RiseOutlined style={{ color: "#10b981" }} />;
      case GoalCategory.MonthlyDebtReduction:
        return <FallOutlined style={{ color: "#f59e0b" }} />;
      case GoalCategory.ExpenseCap:
        return <PieChartOutlined style={{ color: "#f43f5e" }} />;
      case GoalCategory.TargetSavings:
        return <RocketOutlined style={{ color: "#38bdf8" }} />;
      case GoalCategory.PortfolioMilestone:
        return <AimOutlined style={{ color: "#a855f7" }} />;
      default:
        return <AimOutlined />;
    }
  };

  const getPacingTag = (goal: IGoal) => {
    switch (goal.pacingStatus) {
      case "Achieved":
        return <Tag color="success" icon={<CheckCircleOutlined />}>Concluída 🎉</Tag>;
      case "BehindPace":
        return <Tag color="warning" icon={<FireOutlined />}>Abaixo do Ritmo</Tag>;
      case "OverBudget":
        return <Tag color="error">Acima do Orçamento</Tag>;
      case "OnTrack":
      default:
        return <Tag color="processing" icon={<ThunderboltOutlined />}>No Ritmo</Tag>;
    }
  };

  const filteredGoals = summary.goals.filter((g) => {
    if (activeTab === "all") return true;
    if (activeTab === "monthly") {
      return (
        g.category === GoalCategory.MonthlyInvestment ||
        g.category === GoalCategory.MonthlyDebtReduction ||
        g.category === GoalCategory.ExpenseCap
      );
    }
    if (activeTab === "milestones") {
      return (
        g.category === GoalCategory.TargetSavings ||
        g.category === GoalCategory.PortfolioMilestone
      );
    }
    return true;
  });

  return (
    <ConfigProvider theme={FINTRACK_THEME} locale={FINTRACK_LOCALE}>
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
                <h2>Metas Financeiras & Ritmo</h2>
                <p>Defina objetivos para aportes mensais, amortização de dívidas, metas de poupança e tetos de gastos.</p>
              </div>
              <div className={styles.headerControls}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    addForm.resetFields();
                    addForm.setFieldsValue({
                      category: GoalCategory.MonthlyInvestment,
                      frequency: GoalFrequency.Monthly,
                      autoTrack: true,
                      currency: "BRL",
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  Criar Nova Meta
                </Button>
              </div>
            </div>

            {/* Metric Overview Row */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Metas Ativas"
                    value={summary.activeGoalsCount}
                    suffix={`/ ${summary.totalGoalsCount}`}
                    valueStyle={{ color: "#38bdf8", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className={styles.subDetail}>
                    {summary.completedGoalsCount} {summary.completedGoalsCount === 1 ? "meta concluída" : "metas concluídas"}
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Aportes em Investimentos"
                    value={summary.monthlyInvestmentActual}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className={styles.subDetail}>
                    Meta: R$ {summary.monthlyInvestmentTarget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mês
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Amortização de Dívidas"
                    value={summary.monthlyDebtReductionActual}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className={styles.subDetail}>
                    Meta: R$ {summary.monthlyDebtReductionTarget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mês
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Progresso Médio Geral"
                    value={summary.overallProgressPercentage}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: summary.overallProgressPercentage >= 70 ? "#10b981" : "#38bdf8", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className={styles.subDetail}>
                    Em todas as metas ativas
                  </span>
                </Card>
              </Col>
            </Row>

            {/* View Mode Tabs */}
            <Card className={styles.viewToggleCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "1rem" }}>Painel de Metas</span>
                <Segmented
                  value={activeTab}
                  onChange={(val) => setActiveTab(val as any)}
                  options={[
                    { label: `Todas (${summary.goals.length})`, value: "all" },
                    { label: "Metas Mensais", value: "monthly" },
                    { label: "Objetivos de Longo Prazo", value: "milestones" },
                  ]}
                />
              </div>
            </Card>

            {/* Goals Cards Grid */}
            {filteredGoals.length === 0 ? (
              <Card>
                <Empty
                  description="Nenhuma meta financeira cadastrada nesta categoria"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Criar Sua Primeira Meta
                  </Button>
                </Empty>
              </Card>
            ) : (
              <div className={styles.goalsGrid}>
                {filteredGoals.map((goal) => {
                  const cardClass = goal.isCompleted
                    ? styles.achievedCard
                    : goal.pacingStatus === "BehindPace"
                    ? styles.behindPaceCard
                    : goal.pacingStatus === "OverBudget"
                    ? styles.overBudgetCard
                    : styles.onTrackCard;

                  return (
                    <div key={goal.goalID} className={`${styles.goalCard} ${cardClass}`}>
                      <div>
                        <div className={styles.cardHeader}>
                          <div className={styles.titleGroup}>
                            <div className={styles.goalTitle}>{goal.title}</div>
                            <div className={styles.goalCategoryTag}>
                              {getCategoryIcon(goal.category)}
                              <span>{getCategoryLabel(goal.category)}</span>
                              {goal.autoTrack && (
                                <Tooltip title="Acompanhamento automático a partir dos seus lançamentos">
                                  <Tag color="cyan" style={{ fontSize: "0.7rem", padding: "0 4px" }}>
                                    <SyncOutlined spin={false} /> Automático
                                  </Tag>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          <div>{getPacingTag(goal)}</div>
                        </div>

                        <div className={styles.progressCenter}>
                          <div className={styles.amountsBlock}>
                            <div className={styles.currentVal}>
                              {goal.currency} {goal.currentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                            <div className={styles.targetVal}>
                              Alvo: {goal.currency} {goal.targetAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <Progress
                            type="circle"
                            percent={goal.progressPercentage}
                            size={56}
                            strokeColor={goal.isCompleted ? "#10b981" : goal.pacingStatus === "OverBudget" ? "#f43f5e" : "#38bdf8"}
                          />
                        </div>

                        <div className={styles.progressBarSection}>
                          <Progress
                            percent={goal.progressPercentage}
                            size="small"
                            showInfo={false}
                            strokeColor={goal.isCompleted ? "#10b981" : goal.pacingStatus === "OverBudget" ? "#f43f5e" : "#38bdf8"}
                          />
                          <div className={styles.progressMeta}>
                            <span>
                              {goal.category === GoalCategory.ExpenseCap
                                ? `Saldo Restante do Teto: ${goal.currency} ${Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                : `Restante para o Alvo: ${goal.currency} ${goal.remainingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                            </span>
                            {goal.targetDate && (
                              <span>Prazo: {dayjs(goal.targetDate).format("MMM/YYYY")}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <span>
                          {goal.frequency === GoalFrequency.Monthly ? "Recorrência Mensal" : "Meta Pontual"}
                        </span>
                        <Space size="small">
                          {!goal.autoTrack && (
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => {
                                setSelectedGoal(goal);
                                progressForm.setFieldsValue({
                                  amount: undefined,
                                  isIncrement: true,
                                });
                                setIsProgressModalOpen(true);
                              }}
                            >
                              Registrar Progresso
                            </Button>
                          )}
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setSelectedGoal(goal);
                              editForm.setFieldsValue({
                                title: goal.title,
                                description: goal.description,
                                category: goal.category,
                                frequency: goal.frequency,
                                targetAmount: goal.targetAmount,
                                currentAmount: goal.currentAmount,
                                currency: goal.currency,
                                linkedCategoryID: goal.linkedCategoryID ?? undefined,
                                linkedDebtID: goal.linkedDebtID ?? undefined,
                                targetDate: goal.targetDate ? dayjs(goal.targetDate) : undefined,
                                autoTrack: goal.autoTrack,
                                isCompleted: goal.isCompleted,
                              });
                              setIsEditModalOpen(true);
                            }}
                          />
                          <Popconfirm
                            title="Excluir esta meta?"
                            description="Tem certeza de que deseja remover esta meta financeira?"
                            onConfirm={() => handleDeleteGoal(goal.goalID)}
                            okText="Sim, Excluir"
                            cancelText="Cancelar"
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Goal Modal */}
            <Modal
              title="Definir Nova Meta Financeira"
              open={isAddModalOpen}
              onCancel={() => setIsAddModalOpen(false)}
              footer={null}
              width={600}
            >
              <Form
                form={addForm}
                layout="vertical"
                onFinish={handleCreateGoal}
                initialValues={{
                  category: GoalCategory.MonthlyInvestment,
                  frequency: GoalFrequency.Monthly,
                  autoTrack: true,
                  currency: "BRL",
                  initialAmount: 0,
                }}
              >
                <Form.Item
                  name="title"
                  label="Título da Meta"
                  rules={[{ required: true, message: "Insira o título da meta" }]}
                >
                  <Input placeholder="Ex: Aporte Mensal em Ações, Amortizar Carro, Reserva de Emergência" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="category" label="Categoria da Meta">
                      <Select>
                        <Option value={GoalCategory.MonthlyInvestment}>Meta Mensal de Investimentos</Option>
                        <Option value={GoalCategory.MonthlyDebtReduction}>Amortização Mensal de Dívidas</Option>
                        <Option value={GoalCategory.ExpenseCap}>Teto Limite de Gastos</Option>
                        <Option value={GoalCategory.TargetSavings}>Poupança / Compra de Bem</Option>
                        <Option value={GoalCategory.PortfolioMilestone}>Patrimônio Líquido Alvo</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="frequency" label="Periodicidade / Horizonte">
                      <Select>
                        <Option value={GoalFrequency.Monthly}>Recorrência Mensal</Option>
                        <Option value={GoalFrequency.OneTimeTarget}>Meta Pontual / Acumulativa</Option>
                        <Option value={GoalFrequency.Yearly}>Anual</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {addCategory === GoalCategory.ExpenseCap && (
                  <Form.Item
                    name="linkedCategoryID"
                    label="Categoria Vinculada (Opcional)"
                    tooltip="Se selecionada, rastreará apenas gastos desta categoria. Se vazia, acompanhará o total geral de despesas."
                  >
                    <Select allowClear placeholder="Selecione uma categoria (ex: Alimentação, Lazer)">
                      {categories.map((c) => (
                        <Option key={c.categoryID} value={c.categoryID}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                {addCategory === GoalCategory.MonthlyDebtReduction && (
                  <Form.Item
                    name="linkedDebtID"
                    label="Dívida Vinculada (Opcional)"
                    tooltip="Se selecionada, rastreará amortizações apenas desta dívida. Se vazia, acompanhará o total de dívidas amortizadas."
                  >
                    <Select allowClear placeholder="Selecione uma dívida cadastrada">
                      {debts.map((d) => (
                        <Option key={d.debtID} value={d.debtID}>
                          {d.name} ({d.issuer})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                <Row gutter={16}>
                  <Col span={addCategory === GoalCategory.TargetSavings ? 8 : 12}>
                    <Form.Item
                      name="targetAmount"
                      label="Valor Alvo"
                      rules={[{ required: true, message: "Insira o valor alvo" }]}
                    >
                      <InputNumber style={{ width: "100%" }} min={0.01} precision={2} prefix="R$" placeholder="0,00" />
                    </Form.Item>
                  </Col>
                  {addCategory === GoalCategory.TargetSavings && (
                    <Col span={8}>
                      <Form.Item name="initialAmount" label="Saldo Inicial">
                        <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="R$" placeholder="0,00" />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={addCategory === GoalCategory.TargetSavings ? 8 : 12}>
                    <Form.Item name="targetDate" label="Prazo Final (Opcional)">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Selecione a data" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="autoTrack"
                  valuePropName="checked"
                  tooltip="Calcula o progresso automaticamente com base nos seus investimentos, dívidas e despesas no FinTrack"
                >
                  <Checkbox>Acompanhar progresso automaticamente pelo FinTrack</Checkbox>
                </Form.Item>

                <Form.Item name="description" label="Observações / Estratégia">
                  <Input.TextArea rows={2} placeholder="Notas opcionais sobre motivação ou estratégia" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Salvar Meta
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* Edit Goal Modal */}
            <Modal
              title="Editar Meta Financeira"
              open={isEditModalOpen}
              onCancel={() => setIsEditModalOpen(false)}
              footer={null}
              width={600}
            >
              <Form form={editForm} layout="vertical" onFinish={handleUpdateGoal}>
                <Form.Item name="title" label="Título da Meta" rules={[{ required: true, message: "Insira o título" }]}>
                  <Input />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="category" label="Categoria da Meta">
                      <Select>
                        <Option value={GoalCategory.MonthlyInvestment}>Meta Mensal de Investimentos</Option>
                        <Option value={GoalCategory.MonthlyDebtReduction}>Amortização Mensal de Dívidas</Option>
                        <Option value={GoalCategory.ExpenseCap}>Teto Limite de Gastos</Option>
                        <Option value={GoalCategory.TargetSavings}>Poupança / Compra de Bem</Option>
                        <Option value={GoalCategory.PortfolioMilestone}>Patrimônio Líquido Alvo</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="frequency" label="Periodicidade">
                      <Select>
                        <Option value={GoalFrequency.Monthly}>Mensal</Option>
                        <Option value={GoalFrequency.OneTimeTarget}>Meta Pontual</Option>
                        <Option value={GoalFrequency.Yearly}>Anual</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {editCategory === GoalCategory.ExpenseCap && (
                  <Form.Item
                    name="linkedCategoryID"
                    label="Categoria Vinculada (Opcional)"
                    tooltip="Se selecionada, rastreará apenas gastos desta categoria."
                  >
                    <Select allowClear placeholder="Selecione uma categoria (ex: Alimentação, Lazer)">
                      {categories.map((c) => (
                        <Option key={c.categoryID} value={c.categoryID}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                {editCategory === GoalCategory.MonthlyDebtReduction && (
                  <Form.Item
                    name="linkedDebtID"
                    label="Dívida Vinculada (Opcional)"
                    tooltip="Se selecionada, rastreará amortizações apenas desta dívida."
                  >
                    <Select allowClear placeholder="Selecione uma dívida cadastrada">
                      {debts.map((d) => (
                        <Option key={d.debtID} value={d.debtID}>
                          {d.name} ({d.issuer})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="targetAmount" label="Valor Alvo" rules={[{ required: true, message: "Insira o valor alvo" }]}>
                      <InputNumber style={{ width: "100%" }} min={0.01} precision={2} prefix="R$" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="currentAmount" label="Progresso Atual (Manual)">
                      <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="R$" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="targetDate" label="Prazo Final">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Selecione a data" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="isCompleted" valuePropName="checked" label="Status da Meta">
                      <Checkbox>Marcar como Concluída</Checkbox>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="autoTrack" valuePropName="checked">
                  <Checkbox>Acompanhar progresso automaticamente</Checkbox>
                </Form.Item>

                <Form.Item name="description" label="Observações">
                  <Input.TextArea rows={2} />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Salvar Alterações
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* Log Progress Modal */}
            <Modal
              title={`Registrar Progresso: ${selectedGoal?.title || ""}`}
              open={isProgressModalOpen}
              onCancel={() => setIsProgressModalOpen(false)}
              footer={null}
            >
              <Form form={progressForm} layout="vertical" onFinish={handleLogProgress}>
                <Form.Item
                  name="amount"
                  label="Valor Poupado / Aportado"
                  rules={[{ required: true, message: "Insira o valor" }]}
                >
                  <InputNumber style={{ width: "100%" }} min={0.01} precision={2} prefix="R$" placeholder="0,00" />
                </Form.Item>

                <Form.Item name="isIncrement" valuePropName="checked" initialValue={true}>
                  <Checkbox defaultChecked>Somar ao progresso atual (ao invés de substituir)</Checkbox>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button onClick={() => setIsProgressModalOpen(false)}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Salvar Progresso
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
