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

const { Content } = Layout;
const { Option } = Select;

// Sample Initial Expenses (Representing Expense Line Items)
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
  {
    key: "3",
    id: 3008,
    transactionName: "Monster Energy Drink",
    category: "Food & Drinks",
    amount: "$4.00",
    dueDate: "2026-07-29",
    installmentText: "Single",
    status: "Paid",
  },
  {
    key: "4",
    id: 3250,
    transactionName: "Herman Miller Chair",
    category: "Furniture",
    amount: "$33.34",
    dueDate: "2026-08-01",
    installmentText: "1 of 3",
    status: "Paid",
  },
  {
    key: "5",
    id: 3300,
    transactionName: "Apartment Rent",
    category: "Housing & Rent",
    amount: "$1,200.00",
    dueDate: "2026-08-01",
    installmentText: "Recurring",
    status: "PartiallyPaid",
  },
];

export default function ExpensesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("expenses");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenses, setExpenses] = useState(initialExpenses);

  const [form] = Form.useForm();

  // Watch fields to dynamically show Installment / Recurrence settings
  const isInstallment = Form.useWatch("isInstallment", form);
  const isRecurrent = Form.useWatch("isRecurrent", form);

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
      render: (amt: string) => <span className={styles.negativeText}>{amt}</span>,
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

  const handleCreateExpense = (values: any) => {
    let installmentText = "Single";
    if (values.isInstallment) {
      installmentText = `1 of ${values.totalInstallments}`;
    } else if (values.isRecurrent) {
      installmentText = "Recurring";
    }

    const newExpense = {
      key: (expenses.length + 1).toString(),
      id: 4000 + expenses.length,
      transactionName: values.name,
      category: values.categoryName || "Uncategorized",
      amount: `$${Number(values.amount).toFixed(2)}`,
      dueDate: values.dueDate ? values.dueDate.format("YYYY-MM-DD") : "2026-08-01",
      installmentText,
      status: "Pending",
    };

    setExpenses([newExpense, ...expenses]);
    setIsModalOpen(false);
    form.resetFields();
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
            username="Alex Vance" hasGoals={false} onToggleGoals={function (): void {
                throw new Error("Function not implemented.");
            } }          />

          <Content className={styles.content}>
            {/* Page Title & Action Bar */}
            <div className={styles.pageHeader}>
              <div>
                <h2>Expenses & Outgoings</h2>
                <p>Track, schedule, and log your purchases, installments, and recurrent bills.</p>
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

            {/* Quick Metrics */}
            <Row gutter={[16, 16]} className={styles.metricRow}>
              <Col xs={24} sm={8}>
                <Card bordered={false}>
                  <Statistic
                    title="Total Month Expenses"
                    value={1872.84}
                    precision={2}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: "#ff4d4f" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bordered={false}>
                  <Statistic
                    title="Active Installments"
                    value={2}
                    prefix={<CreditCardOutlined />}
                    valueStyle={{ color: "#3B82F6" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card bordered={false}>
                  <Statistic
                    title="Pending / Overdue Bills"
                    value={235.50}
                    precision={2}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: "#faad14" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Expenses List Table */}
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card title="Latest Expenses & Cash Flow Events" bordered={false}>
                  <Table
                    dataSource={expenses}
                    columns={columns}
                    pagination={{ pageSize: 8 }}
                    size="middle"
                  />
                </Card>
              </Col>
            </Row>

            {/* Log Expense Modal Form */}
            <Modal
              title="Log New Expense / Transaction"
              open={isModalOpen}
              onCancel={() => setIsModalOpen(false)}
              onOk={() => form.submit()}
              okText="Save Expense"
              width={600}
              destroyOnClose
              modalRender={(modal) => modal}
              style={{top:40}}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleCreateExpense}
                initialValues={{
                  paymentMethod: "CreditCard",
                  categoryName: "Food & Drinks",
                  isInstallment: false,
                  totalInstallments: 2,
                  isRecurrent: false,
                  recurrenceInterval: "Monthly",
                }}
              >
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      name="name"
                      label="Expense Name / Title"
                      rules={[{ required: true, message: "Please enter a name" }]}
                    >
                      <Input placeholder="e.g., Coffee Machine or AWS Bill" />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item
                      name="amount"
                      label="Total Amount ($)"
                      rules={[{ required: true, message: "Please enter amount" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        precision={2}
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="categoryName" label="Category">
                      <Select>
                        <Option value="Food & Drinks">Food & Drinks</Option>
                        <Option value="Electronics">Electronics</Option>
                        <Option value="Subscriptions & SaaS">Subscriptions & SaaS</Option>
                        <Option value="Housing & Rent">Housing & Rent</Option>
                        <Option value="Transportation">Transportation</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="paymentMethod" label="Payment Method">
                      <Select>
                        <Option value="CreditCard">Credit Card</Option>
                        <Option value="DebitCard">Debit Card</Option>
                        <Option value="Cash">Cash</Option>
                        <Option value="BankTransfer">Bank Transfer</Option>
                        <Option value="Pix">Pix</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="dueDate"
                      label="Due / Payment Date"
                      rules={[{ required: true, message: "Please select date" }]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Domain Toggles for Installments & Recurrence */}
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

                {/* Conditional Fields based on Toggles */}
                {isInstallment && (
                  <Card size="small" style={{ background: "#0d1117", marginBottom: 16 }}>
                    <Form.Item
                      name="totalInstallments"
                      label="Total Number of Installments"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={2} max={360} style={{ width: "100%" }} />
                    </Form.Item>
                  </Card>
                )}

                {isRecurrent && (
                  <Card size="small" style={{ background: "#0d1117", marginBottom: 16 }}>
                    <Form.Item name="recurrenceInterval" label="Billing Frequency">
                      <Select>
                        <Option value="Weekly">Weekly</Option>
                        <Option value="Monthly">Monthly</Option>
                        <Option value="Yearly">Yearly</Option>
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