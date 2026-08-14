"use client";

import React, { useEffect, useState } from "react";
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
  theme,
} from "antd";
import {
  PlusOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CalendarOutlined,
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
} from "@/app/services/Backend/TransactionService";
import {
  PaymentMethod,
  RecurrenceInterval,
  TimeCategory,
  TimePeriod,
  TransactionType,
} from "@/app/Enums/FinTrackEnums";
import { camelToNormalCase, EnumToList, IEnumOptions } from "@/app/utils/utils";

const { Content } = Layout;
const { Option } = Select;

const initialExpenses = [
  {
    key: "1",
    id: 3210,
    transactionName: "AWS Server Infrastructure",
    category: "Subscriptions & SaaS",
    amount: "$235.50",
    dueDate: "2026-08-15",
    installmentText: "Recurring",
    status: "Pending",
  },
  {
    key: "2",
    id: 2983,
    transactionName: "MacBook Pro M3",
    category: "Electronics",
    amount: "$400.00",
    dueDate: "2026-08-29",
    installmentText: "1 of 25",
    status: "Paid",
  },
];

export default function ExpensesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("expenses");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [userInfo, setUserInfo] = useState<UserCookieInfo | null>(null);
  const [transactions, setTransactions] = useState<ITransactionRead[] | null>(
    null,
  );

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const isInstallment = Form.useWatch("isInstallment", form);
  const isRecurrent = Form.useWatch("isRecurrent", form);

  const paymentOptions = EnumToList(PaymentMethod);
  const recurrenceInterval = EnumToList(RecurrenceInterval).slice(1, 5);
  const timeCategory = EnumToList(TimeCategory);
  const timePeriod = EnumToList(TimePeriod);

  const [selectedCategory, setSelectedCategory] = useState<IEnumOptions>({
    label: timeCategory[1]?.label || "",
    value: timeCategory[1]?.value || 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<IEnumOptions>({
    label: timePeriod[1]?.label || "",
    value: timePeriod[1]?.value || 0,
  });

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
    const fetchTransactions = async () => {
      try {
        const data = await getTransactions();
        setTransactions(data);
      } catch (err) {
        console.error("Failed to get transactions:", err);
      }
    };
    fetchCategories();
    fetchUserInfo();
    fetchTransactions();
  }, []);

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
        return <Tag color={color}>{status}</Tag>;
      },
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

    // Payload montado rigorosamente conforme o TransactionCreateDto
    const payload: ITransactionPost = {
      userID: Number(userInfo.id),
      name: values.name,
      description: values.description || null,
      totalAmount: Number(values.totalAmount),
      type: TransactionType.Expense,
      categoryID: Number(values.categoryId),
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

      const updatedTransactions = await getTransactions();
      setTransactions(updatedTransactions);

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Failed to create expense", error);
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
            onToggleGoals={() => {}}
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
                    title="Total Month Expenses"
                    value={1872.84}
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
                    value={2}
                    prefix={<CreditCardOutlined />}
                    styles={{ value: { color: "#3B82F6" } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card variant="borderless">
                  <Statistic
                    title="Pending / Overdue Bills"
                    value={235.5}
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
                        onClick={() => {}}
                      >
                        Search{" "}
                      </Button>
                      <Select
                        className={styles.titleSelect}
                        labelInValue
                        value={selectedCategory}
                        onChange={(val) =>
                          setSelectedCategory(val as IEnumOptions)
                        }
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
                        onChange={(val) =>
                          setSelectedPeriod(val as IEnumOptions)
                        }
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
              destroyOnClose
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

                {/* Campo Description adicionado conforme [MaxLength(500)] no DTO */}
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
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}