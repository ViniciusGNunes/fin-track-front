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
  Switch,
  Space,
  Tooltip,
  Popconfirm,
  message,
  theme,
} from "antd";
import {
  PlusOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
import { UserCookieInfo } from "../../interfaces/UserCookieInfo";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import ICategory from "../../interfaces/ICategory";
import { getCategories } from "@/app/services/Backend/CategoriesService";
import {
  ITransactionPost,
  ITransactionRead,
} from "../../interfaces/Transaction/ITransaction";
import {
  getTransactions,
  postTransaction,
  updateTransaction,
  cancelTransaction,
  deleteTransaction,
  payExpense,
} from "@/app/services/Backend/TransactionService";
import {
  ExpenseStatus,
  PaymentMethod,
  RecurrenceInterval,
  TimeCategory,
  TimePeriod,
  TransactionStatus,
  TransactionType,
} from "@/app/Enums/FinTrackEnums";
import { camelToNormalCase, EnumToList, IEnumOptions } from "@/app/utils/utils";

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

  const [userInfo, setUserInfo] = useState<UserCookieInfo | null>(null);
  const [transactions, setTransactions] = useState<ITransactionRead[]>([]);

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const isInstallment = Form.useWatch("isInstallment", form);
  const isRecurrent = Form.useWatch("isRecurrent", form);

  const paymentOptions = useMemo(() => EnumToList(PaymentMethod), []);
  const recurrenceInterval = useMemo(
    () => EnumToList(RecurrenceInterval).slice(1, 5),
    []
  );
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
      timePeriod.find((p) => p.value === TimePeriod.Week) || {
        label: "Week",
        value: TimePeriod.Week,
      },
    [timePeriod]
  );

  const [selectedCategory, setSelectedCategory] =
    useState<IEnumOptions>(initialCategory);
  const [selectedPeriod, setSelectedPeriod] =
    useState<IEnumOptions>(initialPeriod);

  const fetchTransactionsData = useCallback(
    async (catVal?: number, perVal?: number) => {
      const c = catVal ?? Number(selectedCategory.value);
      const p = perVal ?? Number(selectedPeriod.value);
      try {
        setLoadingTable(true);
        const data = await getTransactions({
          timeCategory: c,
          timePeriod: p,
        });
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to get transactions:", err);
        setTransactions([]);
      } finally {
        setLoadingTable(false);
      }
    },
    [selectedCategory.value, selectedPeriod.value]
  );

  useEffect(() => {
    const fetchUserInfo = () => {
      try {
        const data = getUserFromCookiesClient();
        setUserInfo(data);
      } catch (err) {
        console.log("Failed to get user information:", err);
      }
    };
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
    fetchUserInfo();
    fetchTransactionsData(TimeCategory.Current, TimePeriod.Week);
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

  const handleSaveEdit = async (values: any) => {
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

      message.success("Expense updated successfully");
      setIsEditModalOpen(false);
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to update expense", err);
      message.error("Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (transactionId: number) => {
    try {
      setLoadingTable(true);
      await cancelTransaction(transactionId);
      message.success("Subscription cancelled successfully. Future bills stopped.");
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to cancel subscription", err);
      message.error("Failed to cancel subscription");
    } finally {
      setLoadingTable(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      setLoadingTable(true);
      await deleteTransaction(transactionId);
      message.success("Transaction permanently deleted");
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to delete transaction", err);
      message.error("Failed to delete transaction");
    } finally {
      setLoadingTable(false);
    }
  };

  const handleMarkAsPaid = async (expenseId: number) => {
    try {
      setLoadingTable(true);
      await payExpense(expenseId);
      message.success("Bill marked as paid");
      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );
    } catch (err) {
      console.error("Failed to mark as paid", err);
      message.error("Failed to mark as paid");
    } finally {
      setLoadingTable(false);
    }
  };

  const columns = [
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
    },
    {
      title: "Description",
      dataIndex: "transactionName",
      key: "transactionName",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "Type / Installment",
      dataIndex: "installmentText",
      key: "installmentText",
      render: (text: string) => <Tag color="default">{text}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt: string) => (
        <span className={styles.negativeText}>{amt}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "Paid") color = "success";
        if (status === "Pending") color = "warning";
        if (status === "PartiallyPaid") color = "processing";
        if (status === "Overdue") color = "error";
        if (status === "Cancelled") color = "default";
        if (status === "Refunded" || status === "PartiallyRefunded") color = "purple";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ExpenseTableItem) => (
        <Space size="small">
          {(record.statusCode === ExpenseStatus.Pending ||
            record.statusCode === ExpenseStatus.Overdue ||
            record.statusCode === ExpenseStatus.PartiallyPaid) &&
            record.expenseId > 0 && (
              <Tooltip title="Mark as Paid">
                <Button
                  size="small"
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />}
                  onClick={() => handleMarkAsPaid(record.expenseId)}
                />
              </Tooltip>
            )}

          <Tooltip title="Edit">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff", fontSize: 16 }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          {record.isRecurrent &&
            record.transactionStatus === TransactionStatus.Active && (
              <Popconfirm
                title="Cancel Subscription?"
                description="Past paid history remains. Future bills will be stopped."
                onConfirm={() => handleCancelSubscription(record.transactionId)}
                okText="Yes, Cancel"
                cancelText="No"
              >
                <Tooltip title="Cancel Subscription">
                  <Button
                    size="small"
                    type="text"
                    icon={<StopOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

          <Popconfirm
            title="Delete Expense?"
            description="Permanently delete this transaction and all associated records?"
            onConfirm={() => handleDeleteTransaction(record.transactionId)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Tooltip title="Delete Permanently">
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

  const handleCreateExpense = async (values: any) => {
    if (!userInfo?.id) {
      console.error("User not authenticated");
      return;
    }

    const formattedDate = values.firstDueDate
      ? values.firstDueDate.toISOString()
      : new Date().toISOString();

    const payload: ITransactionPost = {
      userId: Number(userInfo.id),
      name: values.name,
      description: values.description || null,
      totalAmount: Number(values.totalAmount),
      type: TransactionType.Expense,
      categoryId: Number(values.categoryId),
      paymentMethod: Number(values.paymentMethod),
      isInstallment: Boolean(values.isInstallment),
      totalInstallments: values.isInstallment
        ? Number(values.totalInstallments)
        : 1,
      isRecurrent: Boolean(values.isRecurrent),
      recurrenceInterval: values.isRecurrent
        ? Number(values.recurrenceInterval)
        : RecurrenceInterval.None,
      firstDueDate: formattedDate,
    };

    try {
      setLoading(true);
      await postTransaction(payload);
      message.success("Expense registered successfully");

      await fetchTransactionsData(
        Number(selectedCategory.value),
        Number(selectedPeriod.value)
      );

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Failed to create expense", error);
      message.error("Failed to register expense");
    } finally {
      setLoading(false);
    }
  };

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
            onToggleGoals={() => { }}
          />

          <Content className={styles.content}>
            <div className={styles.pageHeader}>
              <div>
                <h2>Expenses & Outgoings</h2>
                <p>
                  Track, schedule, and log your purchases, installments, and
                  recurrent bills.
                </p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setIsModalOpen(true)}
              >
                Log New Expense
              </Button>
            </div>

            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Total Period Expenses"
                    value={totalPeriodExpenses}
                    precision={2}
                    prefix={<DollarOutlined />}
                    styles={{ value: { color: "#ff4d4f" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Active Installments"
                    value={activeInstallmentsCount}
                    prefix={<CreditCardOutlined />}
                    styles={{ value: { color: "#3B82F6" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Pending / Overdue Bills"
                    value={pendingBillsAmount}
                    precision={2}
                    prefix={<CalendarOutlined />}
                    styles={{ value: { color: "#faad14" } }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card
                  title={
                    <>
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
                        Search{" "}
                      </Button>
                      <Select
                        className={styles.titleSelect}
                        labelInValue
                        value={selectedCategory}
                        onChange={(val) => {
                          const opt = val as IEnumOptions;
                          setSelectedCategory(opt);
                          fetchTransactionsData(
                            Number(opt.value),
                            Number(selectedPeriod.value)
                          );
                        }}
                      >
                        {timeCategory.map((tCat) => (
                          <Option key={tCat.value} value={tCat.value}>
                            {camelToNormalCase(tCat.label)}
                          </Option>
                        ))}
                      </Select>
                      <Select
                        className={styles.titleSelect}
                        labelInValue
                        value={selectedPeriod}
                        onChange={(val) => {
                          const opt = val as IEnumOptions;
                          setSelectedPeriod(opt);
                          fetchTransactionsData(
                            Number(selectedCategory.value),
                            Number(opt.value)
                          );
                        }}
                      >
                        {timePeriod.map((tCat) => (
                          <Option key={tCat.value} value={tCat.value}>
                            {camelToNormalCase(tCat.label)}
                          </Option>
                        ))}
                      </Select>
                      Expenses
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

            <Modal
              title="Log New Expense / Transaction"
              open={isModalOpen}
              onCancel={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}
              onOk={() => form.submit()}
              okText="Save Expense"
              confirmLoading={loading}
              width={600}
              destroyOnHidden
              style={{ top: 40 }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleCreateExpense}
                initialValues={{
                  isInstallment: false,
                  totalInstallments: 1,
                  isRecurrent: false,
                  recurrenceInterval: RecurrenceInterval.None,
                  paymentMethod: paymentOptions[0]?.value,
                }}
              >
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      name="name"
                      label="Expense Name / Title"
                      rules={[
                        { required: true, message: "Please enter a name" },
                        {
                          max: 150,
                          message: "Name cannot exceed 150 characters",
                        },
                      ]}
                    >
                      <Input
                        placeholder="e.g., Coffee Machine or AWS Bill"
                        maxLength={150}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      name="totalAmount"
                      label="Total Amount ($)"
                      rules={[
                        { required: true, message: "Please enter amount" },
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        max={999999999.99}
                        precision={2}
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label="Description (Optional)"
                      rules={[
                        {
                          max: 500,
                          message: "Description cannot exceed 500 characters",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="e.g., Additional notes about this expense"
                        maxLength={500}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="categoryId"
                      label="Category"
                      rules={[
                        { required: true, message: "Please select a category" },
                      ]}
                    >
                      <Select placeholder="Select a category">
                        {categories.map((cat: ICategory) => (
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
                      label="Payment Method"
                      rules={[
                        {
                          required: true,
                          message: "Please select payment method",
                        },
                      ]}
                    >
                      <Select placeholder="Select a Payment Method">
                        {paymentOptions.map((pay) => (
                          <Option key={pay.value} value={pay.value}>
                            {camelToNormalCase(pay.label)}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="firstDueDate"
                      label="Due / Payment Date"
                      rules={[
                        { required: true, message: "Please select date" },
                      ]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Form.Item
                      name="isInstallment"
                      label="Is this an Installment Purchase?"
                      valuePropName="checked"
                    >
                      <Switch disabled={isRecurrent} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="isRecurrent"
                      label="Is this a Recurring Expense?"
                      valuePropName="checked"
                    >
                      <Switch disabled={isInstallment} />
                    </Form.Item>
                  </Col>
                </Row>

                {isInstallment && (
                  <Card
                    size="small"
                    style={{ background: "#0d1117", marginBottom: 16 }}
                  >
                    <Form.Item
                      name="totalInstallments"
                      label="Total Number of Installments"
                      rules={[
                        {
                          required: true,
                          message: "Specify number of installments",
                        },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={360}
                        style={{ width: "100%" }}
                        placeholder="e.g., 12"
                      />
                    </Form.Item>
                  </Card>
                )}

                {isRecurrent && (
                  <Card
                    size="small"
                    style={{ background: "#0d1117", marginBottom: 16 }}
                  >
                    <Form.Item
                      name="recurrenceInterval"
                      label="Billing Frequency"
                      rules={[
                        {
                          required: true,
                          message: "Select recurrence interval",
                        },
                      ]}
                    >
                      <Select placeholder="Select frequency">
                        {recurrenceInterval.map((rec) => (
                          <Option value={rec.value} key={rec.value}>
                            {rec.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Card>
                )}
              </Form>
            </Modal>

            <Modal
              title={`Edit Expense: ${editingItem?.transactionName || ""}`}
              open={isEditModalOpen}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
                editForm.resetFields();
              }}
              onOk={() => editForm.submit()}
              okText="Save Changes"
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
                      label="Expense Name / Title"
                      rules={[
                        { required: true, message: "Please enter a name" },
                        {
                          max: 150,
                          message: "Name cannot exceed 150 characters",
                        },
                      ]}
                    >
                      <Input maxLength={150} />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      name="amount"
                      label="Amount ($)"
                      rules={[
                        { required: true, message: "Please enter amount" },
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        max={999999999.99}
                        precision={2}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="categoryId"
                      label="Category"
                      rules={[
                        { required: true, message: "Please select a category" },
                      ]}
                    >
                      <Select placeholder="Select a category">
                        {categories.map((cat: ICategory) => (
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
                      label="Payment Method"
                      rules={[
                        {
                          required: true,
                          message: "Please select payment method",
                        },
                      ]}
                    >
                      <Select placeholder="Select a Payment Method">
                        {paymentOptions.map((pay) => (
                          <Option key={pay.value} value={pay.value}>
                            {camelToNormalCase(pay.label)}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label="Description (Optional)"
                      rules={[
                        {
                          max: 500,
                          message: "Description cannot exceed 500 characters",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="Additional notes"
                        maxLength={500}
                      />
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