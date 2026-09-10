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
  DatePicker,
  Segmented,
  Space,
  Popconfirm,
  message,
  Empty,
  Progress,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
  MinusCircleOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
import { FINTRACK_THEME, FINTRACK_LOCALE } from "@/app/lib/theme";
import { UserCookieInfo } from "../../interfaces/UserCookieInfo";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import {
  IReceivable,
  IReceivableCreate,
  IReceivableSummary,
  IReceivableUpdate,
} from "../../interfaces/Receivables/IReceivable";
import {
  getReceivablesSummary,
  createReceivable,
  updateReceivable,
  toggleReceivableItemPaid,
  deleteReceivable,
} from "@/app/services/Backend/ReceivableService";
import dayjs from "dayjs";

const { Content } = Layout;

export default function ReceivablesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("receivables");
  const [viewMode, setViewMode] = useState<"cards" | "people" | "table">("cards");

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

  const [summary, setSummary] = useState<IReceivableSummary>({
    totalPendingReceivables: 0,
    totalCollectedReceivables: 0,
    totalSharedExpenditures: 0,
    overallCollectionPercentage: 0,
    activeBillsCount: 0,
    settledBillsCount: 0,
    receivables: [],
    debtors: [],
  });
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<IReceivable | null>(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReceivablesSummary(
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      setSummary(data);
    } catch (err) {
      console.error("Failed to load receivables summary", err);
      message.error("Failed to load receivables.");
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleCreateReceivable = async (values: any) => {
    try {
      setLoading(true);
      const items = (values.items || []).map((item: any) => ({
        personName: item.personName,
        amountOwed: item.amountOwed,
        isPaid: item.isPaid || false,
        notes: item.notes,
      }));

      const payload: IReceivableCreate = {
        userID: userInfo?.id ? Number(userInfo.id) : 1,
        title: values.title,
        description: values.description,
        totalAmount: values.totalAmount,
        myShareAmount: values.myShareAmount || 0,
        currency: values.currency || "BRL",
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        items,
      };

      await createReceivable(payload);
      message.success("Rateio criado com sucesso!");
      setIsAddModalOpen(false);
      addForm.resetFields();
      await fetchSummary();
    } catch (err) {
      console.error("Failed to create shared expenditure", err);
      message.error("Não foi possível criar o rateio.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReceivable = async (values: any) => {
    if (!selectedReceivable) return;
    try {
      setLoading(true);
      const items = (values.items || []).map((item: any) => ({
        receivableItemID: item.receivableItemID,
        personName: item.personName,
        amountOwed: item.amountOwed,
        isPaid: item.isPaid || false,
        notes: item.notes,
      }));

      const payload: IReceivableUpdate = {
        title: values.title,
        description: values.description,
        totalAmount: values.totalAmount,
        myShareAmount: values.myShareAmount || 0,
        currency: values.currency || "BRL",
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        items,
      };

      await updateReceivable(
        selectedReceivable.receivableID,
        payload,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success("Rateio atualizado com sucesso!");
      setIsEditModalOpen(false);
      await fetchSummary();
    } catch (err) {
      console.error("Failed to update expenditure", err);
      message.error("Não foi possível atualizar o rateio.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (
    itemId: number,
    currentPaidStatus: boolean
  ) => {
    try {
      await toggleReceivableItemPaid(
        itemId,
        { isPaid: !currentPaidStatus },
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success(!currentPaidStatus ? "Pagamento marcado como recebido! 🎉" : "Marcado como pendente.");
      await fetchSummary();
    } catch (err) {
      console.error("Failed to update payment status", err);
      message.error("Não foi possível atualizar o status de pagamento.");
    }
  };

  const handleDeleteReceivable = async (receivableId: number) => {
    try {
      setLoading(true);
      await deleteReceivable(
        receivableId,
        userInfo?.id ? Number(userInfo.id) : undefined
      );
      message.success("Rateio excluído com sucesso!");
      await fetchSummary();
    } catch (err) {
      console.error("Failed to delete receivable", err);
      message.error("Não foi possível excluir o rateio.");
    } finally {
      setLoading(false);
    }
  };

  const handleSplitEqually = (formInstance: any) => {
    const total = formInstance.getFieldValue("totalAmount") || 0;
    const items = formInstance.getFieldValue("items") || [];
    const includeMyself = formInstance.getFieldValue("includeMyself") ?? true;

    if (items.length === 0) {
      message.warning("Adicione pelo menos uma pessoa para dividir a conta.");
      return;
    }

    const divisor = includeMyself ? items.length + 1 : items.length;
    const perPerson = Number((total / divisor).toFixed(2));

    if (includeMyself) {
      formInstance.setFieldsValue({ myShareAmount: perPerson });
    } else {
      formInstance.setFieldsValue({ myShareAmount: 0 });
    }

    const updatedItems = items.map((item: any) => ({
      ...item,
      amountOwed: perPerson,
    }));

    formInstance.setFieldsValue({ items: updatedItems });
    message.info(`Calculado R$ ${perPerson.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por pessoa para ${items.length} participante(s).`);
  };

  const openEditModal = (rec: IReceivable) => {
    setSelectedReceivable(rec);
    editForm.setFieldsValue({
      title: rec.title,
      description: rec.description,
      totalAmount: rec.totalAmount,
      myShareAmount: rec.myShareAmount,
      currency: rec.currency,
      dueDate: rec.dueDate ? dayjs(rec.dueDate) : undefined,
      items: rec.items.map((i) => ({
        receivableItemID: i.receivableItemID,
        personName: i.personName,
        amountOwed: i.amountOwed,
        isPaid: i.isPaid,
        notes: i.notes,
      })),
    });
    setIsEditModalOpen(true);
  };

  // Flattened items table data
  const flatItemsData = summary.receivables.flatMap((r) =>
    r.items.map((i) => ({
      ...i,
      billTitle: r.title,
      billCreatedAt: r.createdAtUtc,
      currency: r.currency,
    }))
  );

  const tableColumns = [
    {
      title: "Pessoa",
      dataIndex: "personName",
      key: "personName",
      render: (name: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#38bdf8" }} />
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
        </Space>
      ),
    },
    {
      title: "Despesa / Conta",
      dataIndex: "billTitle",
      key: "billTitle",
      render: (title: string) => <span style={{ color: "#38bdf8" }}>{title}</span>,
    },
    {
      title: "Valor Devido",
      dataIndex: "amountOwed",
      key: "amountOwed",
      render: (val: number, r: any) => (
        <span style={{ fontWeight: 600, color: r.isPaid ? "#10b981" : "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
          {r.currency} {val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "Status",
      key: "isPaid",
      render: (_: any, r: any) =>
        r.isPaid ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Pago ({r.paidDate ? dayjs(r.paidDate).format("DD/MM/YYYY") : "Quitado"})
          </Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Pendente
          </Tag>
        ),
    },
    {
      title: "Data de Criação",
      dataIndex: "billCreatedAt",
      key: "billCreatedAt",
      render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Ação",
      key: "action",
      render: (_: any, r: any) => (
        <Button
          size="small"
          type={r.isPaid ? "default" : "primary"}
          onClick={() => handleTogglePaid(r.receivableItemID, r.isPaid)}
        >
          {r.isPaid ? "Marcar Pendente" : "Marcar como Pago"}
        </Button>
      ),
    },
  ];

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
                <h2>Contas a Receber e Rateios</h2>
                <p>Gerencie despesas compartilhadas em grupo, monitore quem te deve e controle acertos de contas.</p>
              </div>
              <div className={styles.headerControls}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    addForm.resetFields();
                    addForm.setFieldsValue({
                      currency: "BRL",
                      myShareAmount: 0,
                      items: [{ personName: "", amountOwed: 0 }],
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  Novo Rateio / Despesa
                </Button>
              </div>
            </div>

            {/* Metric Overview Row */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Pendente a Receber"
                    value={summary.totalPendingReceivables}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: summary.totalPendingReceivables > 0 ? "#f59e0b" : "#10b981", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className={styles.trendWarning}>
                    De {summary.activeBillsCount} {summary.activeBillsCount === 1 ? "conta compartilhada ativa" : "contas compartilhadas ativas"}
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Recebido até o Momento"
                    value={summary.totalCollectedReceivables}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className={styles.trendGood}>
                    {summary.overallCollectionPercentage}% arrecadado
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total de Gastos Compartilhados"
                    value={summary.totalSharedExpenditures}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: "#38bdf8", fontVariantNumeric: "tabular-nums" }}
                  />
                  <span className={styles.subDetail}>
                    Em {summary.receivables.length} eventos rateados
                  </span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Amigos / Devedores"
                    value={summary.debtors.length}
                    valueStyle={{ color: "var(--text-primary)" }}
                    prefix={<TeamOutlined style={{ marginRight: 8, color: "#38bdf8" }} />}
                  />
                  <span className={styles.subDetail}>
                    {summary.debtors.filter((d) => d.totalPending > 0).length} com pendências
                  </span>
                </Card>
              </Col>
            </Row>

            {/* View Mode Toggle */}
            <Card className={styles.viewToggleCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "1rem" }}>Contas e Saldos Compartilhados</span>
                <Segmented
                  value={viewMode}
                  onChange={(val) => setViewMode(val as any)}
                  options={[
                    { label: "Contas Compartilhadas", value: "cards", icon: <ShareAltOutlined /> },
                    { label: "Por Amigo / Pessoa", value: "people", icon: <TeamOutlined /> },
                    { label: "Tabela Completa", value: "table", icon: <UnorderedListOutlined /> },
                  ]}
                />
              </div>
            </Card>

            {/* View 1: Shared Bills Cards Grid */}
            {viewMode === "cards" && (
              <div>
                {summary.receivables.length === 0 ? (
                  <Card>
                    <Empty
                      description="Nenhum rateio ou despesa compartilhada registrada ainda"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        Criar Primeiro Rateio
                      </Button>
                    </Empty>
                  </Card>
                ) : (
                  <div className={styles.billsGrid}>
                    {summary.receivables.map((rec) => {
                      const isSettled = rec.isSettled;
                      const paidCount = rec.items.filter((i) => i.isPaid).length;
                      return (
                        <div
                          key={rec.receivableID}
                          className={`${styles.billCard} ${
                            isSettled ? styles.settledCard : styles.pendingCard
                          }`}
                        >
                          <div>
                            {/* Header */}
                            <div className={styles.tileHeader}>
                              <div className={styles.tileTitleGroup}>
                                <div className={styles.tileTitle}>{rec.title}</div>
                                <div className={styles.tileSubtitle}>
                                  {dayjs(rec.createdAtUtc).format("DD/MM/YYYY")}
                                  {rec.description ? ` • ${rec.description}` : ""}
                                </div>
                              </div>
                              {isSettled ? (
                                <Tag color="success" icon={<CheckCircleOutlined />}>
                                  Quitado
                                </Tag>
                              ) : (
                                <Tag color="warning" icon={<ClockCircleOutlined />}>
                                  R$ {rec.totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pendente
                                </Tag>
                              )}
                            </div>

                            {/* Body */}
                            <div className={styles.tileBody}>
                              <div className={styles.balanceLabel}>Valor Total</div>
                              <div className={styles.tileValue}>
                                {rec.currency} {rec.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>

                              <div style={{ marginTop: 12 }}>
                                <Progress
                                  percent={rec.progressPercentage}
                                  size="small"
                                  strokeColor={isSettled ? "var(--color-success, #10b981)" : "var(--color-warning, #f59e0b)"}
                                />
                              </div>
                              <div className={styles.progressMeta}>
                                <span>Minha parte: {rec.currency} {rec.myShareAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                <span>{paidCount} de {rec.items.length} pagos</span>
                              </div>
                            </div>

                            {/* Participants */}
                            <div className={styles.participantsSection}>
                              <div className={styles.sectionTitle}>
                                <span>Participantes ({rec.items.length})</span>
                                <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>Clique para alternar status</span>
                              </div>
                              <div className={styles.participantsList}>
                                {rec.items.map((item) => (
                                  <div key={item.receivableItemID} className={styles.participantRow}>
                                    <div className={styles.personInfo}>
                                      <Avatar
                                        size={24}
                                        icon={<UserOutlined />}
                                        style={{
                                          backgroundColor: item.isPaid
                                            ? "var(--color-success, #10b981)"
                                            : "var(--color-warning, #f59e0b)",
                                        }}
                                      />
                                      <span className={styles.personName}>{item.personName}</span>
                                    </div>
                                    <div className={styles.personAmount}>
                                      <span
                                        style={{
                                          color: item.isPaid
                                            ? "var(--color-success, #10b981)"
                                            : "var(--color-warning, #f59e0b)",
                                        }}
                                      >
                                        R$ {item.amountOwed.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </span>
                                      <Button
                                        size="small"
                                        type={item.isPaid ? "default" : "primary"}
                                        onClick={() => handleTogglePaid(item.receivableItemID, item.isPaid)}
                                      >
                                        {item.isPaid ? "Pago ✓" : "Marcar Pago"}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className={styles.cardFooter}>
                            <span>
                              {paidCount} de {rec.items.length} pagos
                            </span>
                            <Space size="small">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openEditModal(rec)}
                              />
                              <Popconfirm
                                title="Excluir este rateio?"
                                description="Essa ação não pode ser desfeita."
                                onConfirm={() => handleDeleteReceivable(rec.receivableID)}
                                okText="Sim, excluir"
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
              </div>
            )}

            {/* View 2: Grouped by Friend / Debtor */}
            {viewMode === "people" && (
              <div>
                {summary.debtors.length === 0 ? (
                  <Card>
                    <Empty
                      description="Nenhum participante registrado ainda"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </Card>
                ) : (
                  <div className={styles.debtorsGrid}>
                    {summary.debtors.map((debtor) => (
                      <div key={debtor.personName} className={styles.debtorCard}>
                        <div className={styles.debtorHeader}>
                          <Avatar
                            size={42}
                            icon={<UserOutlined />}
                            style={{
                              backgroundColor: debtor.totalPending > 0
                                ? "var(--color-warning, #f59e0b)"
                                : "var(--color-success, #10b981)",
                            }}
                          />
                          <div>
                            <div className={styles.debtorName}>{debtor.personName}</div>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)" }}>
                              {debtor.activeSharedBillsCount > 0
                                ? `${debtor.activeSharedBillsCount} conta(s) pendente(s)`
                                : "Tudo acertado! ✓"}
                            </span>
                          </div>
                        </div>

                        <div className={styles.debtorStats}>
                          <div className={styles.debtorStatItem}>
                            <div className={styles.label}>Pendente</div>
                            <div
                              className={styles.val}
                              style={{
                                color: debtor.totalPending > 0
                                  ? "var(--color-warning, #f59e0b)"
                                  : "var(--color-success, #10b981)",
                              }}
                            >
                              R$ {debtor.totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className={styles.debtorStatItem}>
                            <div className={styles.label}>Total Pago</div>
                            <div className={styles.val} style={{ color: "var(--color-success, #10b981)" }}>
                              R$ {debtor.totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className={styles.debtorStatItem}>
                            <div className={styles.label}>Total Devido</div>
                            <div className={styles.val} style={{ color: "var(--text-primary, #f8fafc)" }}>
                              R$ {debtor.totalOwed.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View 3: All Items Tabular List */}
            {viewMode === "table" && (
              <Card>
                <Table
                  dataSource={flatItemsData}
                  columns={tableColumns}
                  rowKey="receivableItemID"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )}

            {/* Add Shared Expense Modal */}
            <Modal
              title="Criar Rateio / Despesa"
              open={isAddModalOpen}
              onCancel={() => setIsAddModalOpen(false)}
              footer={null}
              width={640}
            >
              <Form
                form={addForm}
                layout="vertical"
                onFinish={handleCreateReceivable}
                initialValues={{
                  currency: "BRL",
                  myShareAmount: 0,
                  items: [{ personName: "", amountOwed: 0 }],
                }}
              >
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      name="title"
                      label="Título / Nome do Evento"
                      rules={[{ required: true, message: "Insira o título (ex: Pizza com amigos)" }]}
                    >
                      <Input placeholder="ex: Pizza com amigos, Airbnb do fim de semana" />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item name="dueDate" label="Data de Vencimento (Opcional)">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Selecione a data" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="totalAmount"
                      label="Valor Total da Conta"
                      rules={[{ required: true, message: "Insira o valor total" }]}
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
                      name="myShareAmount"
                      label="Minha Parte (Você Paga)"
                      tooltip="Quanto do total é sua própria despesa (não será cobrado dos outros)"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        precision={2}
                        prefix="R$"
                        placeholder="0,00"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Split Calculation Helper */}
                <div className={styles.splitHelperBar}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Ação rápida: divide automaticamente o valor restante entre os participantes.
                  </span>
                  <Button
                    size="small"
                    icon={<CalculatorOutlined />}
                    onClick={() => handleSplitEqually(addForm)}
                  >
                    Dividir Igualmente (Total / N)
                  </Button>
                </div>

                {/* Dynamic Participants List */}
                <Form.List name="items">
                  {(fields, { add, remove }) => (
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                        Participantes / Amigos:
                      </label>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row gutter={12} key={key} align="middle" style={{ marginBottom: 8 }}>
                          <Col span={11}>
                            <Form.Item
                              {...restField}
                              name={[name, "personName"]}
                              rules={[{ required: true, message: "Insira o nome" }]}
                              style={{ margin: 0 }}
                            >
                              <Input placeholder="Nome da pessoa" prefix={<UserOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col span={10}>
                            <Form.Item
                              {...restField}
                              name={[name, "amountOwed"]}
                              rules={[{ required: true, message: "Insira a quantia" }]}
                              style={{ margin: 0 }}
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
                          <Col span={3}>
                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                          </Col>
                        </Row>
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        style={{ marginTop: 8 }}
                      >
                        Adicionar Participante
                      </Button>
                    </div>
                  )}
                </Form.List>

                <Form.Item style={{ marginTop: 24, marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Criar Rateio
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* Modal 2: Edit Shared Bill */}
            <Modal
              title="Editar Rateio"
              open={isEditModalOpen}
              onCancel={() => setIsEditModalOpen(false)}
              onOk={() => editForm.submit()}
              okText="Salvar Alterações"
              cancelText="Cancelar"
              confirmLoading={loading}
              width={640}
            >
              <Form
                form={editForm}
                layout="vertical"
                onFinish={handleUpdateReceivable}
              >
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      name="title"
                      label="Título / Nome do Evento"
                      rules={[{ required: true, message: "Insira o título" }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item name="dueDate" label="Data de Vencimento">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Selecione a data" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="totalAmount" label="Valor Total da Conta" rules={[{ required: true, message: "Insira o valor" }]}>
                      <InputNumber style={{ width: "100%" }} min={0.01} precision={2} prefix="R$" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="myShareAmount" label="Minha Parte">
                      <InputNumber style={{ width: "100%" }} min={0} precision={2} prefix="R$" />
                    </Form.Item>
                  </Col>
                </Row>

                <div className={styles.splitHelperBar}>
                  <Button
                    size="small"
                    icon={<CalculatorOutlined />}
                    onClick={() => handleSplitEqually(editForm)}
                  >
                    Dividir Igualmente (Total / N)
                  </Button>
                </div>

                <Form.List name="items">
                  {(fields, { add, remove }) => (
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                        Participantes / Amigos:
                      </label>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row gutter={12} key={key} align="middle" style={{ marginBottom: 8 }}>
                          <Col span={11}>
                            <Form.Item
                              {...restField}
                              name={[name, "personName"]}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input prefix={<UserOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col span={10}>
                            <Form.Item
                              {...restField}
                              name={[name, "amountOwed"]}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber style={{ width: "100%" }} min={0.01} precision={2} prefix="R$" />
                            </Form.Item>
                          </Col>
                          <Col span={3} style={{ textAlign: "center" }}>
                            {fields.length > 1 && (
                              <MinusCircleOutlined
                                style={{ color: "#ff4d4f", fontSize: "1.1rem", cursor: "pointer" }}
                                onClick={() => remove(name)}
                              />
                            )}
                          </Col>
                        </Row>
                      ))}
                      <Form.Item style={{ marginTop: 12 }}>
                        <Button
                          type="dashed"
                          onClick={() => add({ personName: "", amountOwed: 0 })}
                          block
                          icon={<PlusOutlined />}
                        >
                          Adicionar Participante
                        </Button>
                      </Form.Item>
                    </div>
                  )}
                </Form.List>

                <Form.Item name="description" label="Observações">
                  <Input.TextArea rows={2} placeholder="Detalhes adicionais (opcional)" />
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
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
