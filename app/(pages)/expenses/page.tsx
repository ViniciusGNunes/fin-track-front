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
  Space,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import {
  CreditCardOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import { LogExpenseButton, LogExpenseModal } from "../../components/LogExpense";
import styles from "./styles.module.scss";
import { FINTRACK_THEME, FINTRACK_LOCALE } from "@/app/lib/theme";
import ICategory from "../../interfaces/ICategory";
import { getCategories } from "@/app/services/Backend/CategoriesService";
import {
  ITransactionRead,
} from "../../interfaces/Transaction/ITransaction";
import {
  getTransactions,
  updateTransaction,
  cancelTransaction,
  deleteTransaction,
  payExpense,
} from "@/app/services/Backend/TransactionService";
import {
  ExpenseStatus,
  PaymentMethod,
  TimeCategory,
  TimePeriod,
  TransactionStatus,
  TransactionType,
} from "@/app/Enums/FinTrackEnums";
import { camelToNormalCase, EnumToList, IEnumOptions, getTimeCategoryLabel, getTimePeriodLabel } from "@/app/utils/utils";

const { Content } = Layout;
const { Option } = Select;

interface ExpenseTableItem {
  key: string;
  expenseId: number;
  transactionId: number;
  transactionName: string;
  category: string;
  categoryId: number;
  paymentMethod: PaymentMethod;
  amount: string;
  rawAmount: number;
  dueDate: string;
  installmentText: string;
  status: string;
  statusCode: ExpenseStatus;
  isRecurrent: boolean;
  isInstallment: boolean;
  totalInstallments: number;
  transactionStatus: TransactionStatus;
  description?: string | null;
}

interface EditExpenseFormValues {
  name: string;
  amount: number;
  categoryId: number;
  paymentMethod: number;
  description?: string;
}

const mapTransactionsToTableItems = (
  transactionsList: ITransactionRead[]
): ExpenseTableItem[] => {
  const items: ExpenseTableItem[] = [];

  for (const t of transactionsList) {
    if (t.expenses && t.expenses.length > 0) {
      for (const exp of t.expenses) {
        let installmentText = "One-off";
        if (t.isRecurrent) {
          installmentText = "Recurring";
        } else if (t.isInstallment) {
          installmentText = `${exp.currentInstallment} of ${t.totalInstallments}`;
        }

        const statusName = ExpenseStatus[exp.status] || "Pending";

        items.push({
          key: `${t.transactionID}-${exp.expenseID}-${exp.currentInstallment}-${exp.dueDate}`,
          expenseId: exp.expenseID,
          transactionId: t.transactionID,
          transactionName: t.name,
          category: t.categoryName || "Uncategorized",
          categoryId: t.categoryID,
          paymentMethod: t.paymentMethod,
          amount: `$${Number(exp.amount).toFixed(2)}`,
          rawAmount: Number(exp.amount),
          dueDate: exp.dueDate ? exp.dueDate.split("T")[0] : "",
          installmentText,
          status: statusName,
          statusCode: exp.status,
          isRecurrent: t.isRecurrent,
          isInstallment: t.isInstallment,
          totalInstallments: t.totalInstallments,
          transactionStatus: t.status,
          description: t.description,
        });
      }
    } else {
      items.push({
        key: `t-${t.transactionID}`,
        expenseId: 0,
        transactionId: t.transactionID,
        transactionName: t.name,
        category: t.categoryName || "Uncategorized",
        categoryId: t.categoryID,
        paymentMethod: t.paymentMethod,
        amount: `$${Number(t.totalAmount).toFixed(2)}`,
        rawAmount: Number(t.totalAmount),
        dueDate: t.createdAtUtc ? t.createdAtUtc.split("T")[0] : "",
        installmentText: t.isRecurrent
          ? "Recurring"
          : t.isInstallment
            ? `1 of ${t.totalInstallments}`
            : "One-off",
        status: "Active",
        statusCode: ExpenseStatus.Pending,
        isRecurrent: t.isRecurrent,
        isInstallment: t.isInstallment,
        totalInstallments: t.totalInstallments,
        transactionStatus: t.status,
        description: t.description,
      });
    }
  }

  return items;
};

export default function ExpensesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("expenses");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseTableItem | null>(null);

  const [transactions, setTransactions] = useState<ITransactionRead[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  const [editForm] = Form.useForm<EditExpenseFormValues>();

  const paymentOptions = useMemo(() => EnumToList(PaymentMethod), []);
  const timeCategory = useMemo(() => EnumToList(TimeCategory), []);
  const timePeriod = useMemo(() => EnumToList(TimePeriod), []);

  const initialCategory: IEnumOptions = useMemo(
    () =>
      timeCategory.find((c) => c.value === TimeCategory.Current) || {
        label: "Current",
        value: TimeCategory.Current,
      },
    [timeCategory]
  );

  const initialPeriod: IEnumOptions = useMemo(
    () =>
      timePeriod.find((p) => p.value === TimePeriod.Month) || {
        label: "Month",
        value: TimePeriod.Month,
      },
    [timePeriod]
  );

  const [selectedCategory, setSelectedCategory] =
    useState<IEnumOptions>(initialCategory);
  const [selectedPeriod, setSelectedPeriod] =
    useState<IEnumOptions>(initialPeriod);

  const fetchTransactionsData = useCallback(
    async (catVal: number, perVal: number) => {
      try {
        setLoadingTable(true);
        const data = await getTransactions({
          timeCategory: catVal,
          timePeriod: perVal,
        });
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to get transactions:", err);
        setTransactions([]);
      } finally {
        setLoadingTable(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        const catData = await getCategories();
        if (isMounted) setCategories(catData);
      } catch {
        // noop
      }

      if (isMounted) {
        await fetchTransactionsData(TimeCategory.Current, TimePeriod.Month);
      }
    };

    initData();

    return () => {
      isMounted = false;
    };
  }, [fetchTransactionsData]);

  const expenses = useMemo(
    () => mapTransactionsToTableItems(transactions),
    [transactions]
  );

  const totalPeriodExpenses = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.expenses && t.expenses.length > 0) {
        return acc + t.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      }
      return acc + Number(t.totalAmount || 0);
    }, 0);
  }, [transactions]);

  const activeInstallmentsCount = useMemo(() => {
    return transactions.filter(
      (t) => t.isInstallment && t.status === TransactionStatus.Active
    ).length;
  }, [transactions]);

  const pendingBillsAmount = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.expenses && t.expenses.length > 0) {
        return (
          acc +
          t.expenses
            .filter(
              (e) =>
                e.status === ExpenseStatus.Pending ||
                e.status === ExpenseStatus.Overdue ||
                e.status === ExpenseStatus.PartiallyPaid
            )
            .reduce(
              (sum, e) =>
                sum +
                Number(
                  e.remainingAmount ??
                  Number(e.amount || 0) - Number(e.paidAmount || 0)
                ),
              0
            )
        );
      }
      return acc;
    }, 0);
  }, [transactions]);

  const handleOpenEditModal = (record: ExpenseTableItem) => {
    setEditingItem(record);
    editForm.setFieldsValue({
      name: record.transactionName,
      amount: record.rawAmount,
      categoryId: record.categoryId,
      paymentMethod: record.paymentMethod,
      description: record.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (values: EditExpenseFormValues) => {
    if (!editingItem) return;
    try {
      setLoading(true);
      await updateTransaction(editingItem.transactionId, {
        name: values.name,
        description: values.description || null,
        totalAmount: Number(values.amount),
        categoryID: Number(values.categoryId),
        paymentMethod: Number(values.paymentMethod),
        type: TransactionType.Expense,
        status: editingItem.transactionStatus,
      });

      message.success("Despesa atualizada com sucesso!");
      setIsEditModalOpen(false);
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to update expense", err);
      message.error("Não foi possível atualizar a despesa.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (transactionId: number) => {
    try {
      setLoadingTable(true);
      await cancelTransaction(transactionId);
      message.success("Assinatura cancelada. Cobranças futuras foram interrompidas.");
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to cancel subscription", err);
      message.error("Não foi possível cancelar a assinatura.");
    } finally {
      setLoadingTable(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      setLoadingTable(true);
      await deleteTransaction(transactionId);
      message.success("Despesa excluída com sucesso!");
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to delete transaction", err);
      message.error("Não foi possível excluir a despesa.");
    } finally {
      setLoadingTable(false);
    }
  };

  const handleMarkAsPaid = async (expenseId: number) => {
    try {
      setLoadingTable(true);
      await payExpense(expenseId);
      message.success("Pagamento registrado com sucesso!");
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to pay expense", err);
      message.error("Não foi possível registrar o pagamento.");
    } finally {
      setLoadingTable(false);
    }
  };

  const columns = [
    {
      title: "Data de Vencimento",
      dataIndex: "dueDate",
      key: "dueDate",
    },
    {
      title: "Descrição / Título",
      dataIndex: "transactionName",
      key: "transactionName",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Categoria",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "Tipo / Parcela",
      dataIndex: "installmentText",
      key: "installmentText",
      render: (text: string) => <Tag color="default">{text}</Tag>,
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (amt: string) => (
        <span className={styles.negativeText} style={{ fontVariantNumeric: "tabular-nums" }}>{amt}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: ExpenseTableItem) => {
        let color = "default";
        let icon = null;
        let label = camelToNormalCase(record.status);

        switch (record.statusCode) {
          case ExpenseStatus.Paid:
            color = "success";
            icon = <CheckCircleOutlined />;
            label = "Pago";
            break;
          case ExpenseStatus.Pending:
            color = "warning";
            label = "Pendente";
            break;
          case ExpenseStatus.Overdue:
            color = "error";
            label = "Em Atraso";
            break;
          case ExpenseStatus.PartiallyPaid:
            color = "processing";
            label = "Parcialmente Pago";
            break;
        }

        return (
          <Tag color={color} icon={icon} style={{ borderRadius: 4 }}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Ações",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: ExpenseTableItem) => (
        <Space size="small">
          {(record.statusCode === ExpenseStatus.Pending ||
            record.statusCode === ExpenseStatus.Overdue ||
            record.statusCode === ExpenseStatus.PartiallyPaid) &&
            record.expenseId > 0 && (
              <Tooltip title="Marcar como Pago">
                <Button
                  size="small"
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />}
                  onClick={() => handleMarkAsPaid(record.expenseId)}
                />
              </Tooltip>
            )}

          <Tooltip title="Editar">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined style={{ color: "#38bdf8", fontSize: 16 }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          {record.isRecurrent &&
            record.transactionStatus === TransactionStatus.Active && (
              <Popconfirm
                title="Cancelar Assinatura?"
                description="O histórico pago será mantido. Cobranças futuras serão canceladas."
                onConfirm={() => handleCancelSubscription(record.transactionId)}
                okText="Sim, Cancelar"
                cancelText="Não"
              >
                <Tooltip title="Cancelar Assinatura">
                  <Button
                    size="small"
                    type="text"
                    icon={<StopOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

          <Popconfirm
            title="Excluir Despesa?"
            description="Deseja excluir permanentemente esta transação e todos os registros associados?"
            onConfirm={() => handleDeleteTransaction(record.transactionId)}
            okText="Excluir"
            okButtonProps={{ danger: true }}
            cancelText="Cancelar"
          >
            <Tooltip title="Excluir Permanentemente">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined style={{ fontSize: 16 }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
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
                <h2>Despesas e Saídas</h2>
                <p>
                  Acompanhe, parcele e planeje suas compras, boletos e contas recorrentes.
                </p>
              </div>
              <LogExpenseButton onClick={() => setIsModalOpen(true)} />
            </div>

            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Total de Despesas no Período"
                    value={totalPeriodExpenses}
                    precision={2}
                    prefix="R$"
                    styles={{ value: { color: "#f43f5e", fontVariantNumeric: "tabular-nums" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Parcelamentos Ativos"
                    value={activeInstallmentsCount}
                    prefix={<CreditCardOutlined />}
                    styles={{ value: { color: "#38bdf8", fontVariantNumeric: "tabular-nums" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Contas Pendentes / Atrasadas"
                    value={pendingBillsAmount}
                    precision={2}
                    prefix="R$"
                    styles={{ value: { color: "#f59e0b", fontVariantNumeric: "tabular-nums" } }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card
                  title={
                    <>
                      <Select
                        className={styles.titleSelect}
                        labelInValue
                        value={{
                          value: selectedPeriod.value,
                          label: getTimePeriodLabel(selectedPeriod.value),
                        }}
                        onChange={(val: any) => {
                          const numVal = typeof val === "object" && val !== null ? Number(val.value) : Number(val);
                          const opt = timePeriod.find((p) => Number(p.value) === numVal) || {
                            label: getTimePeriodLabel(numVal),
                            value: numVal,
                          };
                          setSelectedPeriod(opt);
                          fetchTransactionsData(
                            Number(selectedCategory.value),
                            numVal
                          );
                        }}
                      >
                        {timePeriod.map((tPer) => (
                          <Option key={tPer.value} value={tPer.value}>
                            {getTimePeriodLabel(tPer.value)}
                          </Option>
                        ))}
                      </Select>
                      <Select
                        className={styles.titleSelect}
                        labelInValue
                        value={{
                          value: selectedCategory.value,
                          label: getTimeCategoryLabel(selectedCategory.value, selectedPeriod.value),
                        }}
                        onChange={(val: any) => {
                          const numVal = typeof val === "object" && val !== null ? Number(val.value) : Number(val);
                          const opt = timeCategory.find((c) => Number(c.value) === numVal) || {
                            label: getTimeCategoryLabel(numVal, selectedPeriod.value),
                            value: numVal,
                          };
                          setSelectedCategory(opt);
                          fetchTransactionsData(
                            numVal,
                            Number(selectedPeriod.value)
                          );
                        }}
                      >
                        {timeCategory.map((tCat) => (
                          <Option key={tCat.value} value={tCat.value}>
                            {getTimeCategoryLabel(tCat.value, selectedPeriod.value)}
                          </Option>
                        ))}
                      </Select>
                      <Button
                        type="primary"
                        className={styles.titleButton}
                        onClick={() =>
                          fetchTransactionsData(
                            Number(selectedCategory.value),
                            Number(selectedPeriod.value)
                          )
                        }
                        loading={loadingTable}
                      >
                        Filtrar
                      </Button>
                    </>
                  }
                  variant="borderless"
                >
                  <Table
                    dataSource={expenses}
                    columns={columns}
                    pagination={{ pageSize: 8 }}
                    size="middle"
                    loading={loadingTable}
                  />
                </Card>
              </Col>
            </Row>

            <LogExpenseModal
              open={isModalOpen}
              onCancel={() => setIsModalOpen(false)}
              onSuccess={() =>
                fetchTransactionsData(
                  Number(selectedCategory.value),
                  Number(selectedPeriod.value)
                )
              }
              categories={categories}
            />

            <Modal
              title={`Editar Despesa: ${editingItem?.transactionName || ""}`}
              open={isEditModalOpen}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
                editForm.resetFields();
              }}
              onOk={() => editForm.submit()}
              okText="Salvar Alterações"
              cancelText="Cancelar"
              confirmLoading={loading}
              width={550}
              destroyOnHidden
              style={{ top: 40 }}
            >
              <Form
                form={editForm}
                layout="vertical"
                onFinish={handleSaveEdit}
              >
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      name="name"
                      label="Título / Nome da Despesa"
                      rules={[
                        { required: true, message: "Insira o nome da despesa" },
                        {
                          max: 150,
                          message: "O nome não pode exceder 150 caracteres",
                        },
                      ]}
                    >
                      <Input maxLength={150} />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      name="amount"
                      label="Valor (R$)"
                      rules={[
                        { required: true, message: "Insira o valor" },
                      ]}
                    >
                      <InputNumber style={{ width: "100%" }} min={0.01} precision={2} prefix="R$" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="description" label="Descrição (Opcional)">
                      <Input.TextArea rows={2} maxLength={500} placeholder="Observações adicionais" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="categoryId"
                      label="Categoria"
                      rules={[{ required: true, message: "Selecione uma categoria" }]}
                    >
                      <Select placeholder="Selecione a categoria">
                        {categories.map((cat) => (
                          <Option key={cat.categoryID} value={cat.categoryID}>
                            {cat.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="paymentMethod"
                      label="Forma de Pagamento"
                      rules={[{ required: true, message: "Selecione a forma de pagamento" }]}
                    >
                      <Select placeholder="Selecione a forma de pagamento">
                        {paymentOptions.map((pay) => (
                          <Option key={pay.value} value={pay.value}>
                            {camelToNormalCase(pay.label)}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}