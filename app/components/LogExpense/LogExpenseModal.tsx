"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Row,
  Col,
  Card,
  message,
} from "antd";
import { camelToNormalCase, EnumToList } from "@/app/utils/utils";
import {
  PaymentMethod,
  RecurrenceInterval,
  TransactionType,
} from "@/app/Enums/FinTrackEnums";
import ICategory from "@/app/interfaces/ICategory";
import { ITransactionPost } from "@/app/interfaces/Transaction/ITransaction";
import { getCategories } from "@/app/services/Backend/CategoriesService";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import { postTransaction } from "@/app/services/Backend/TransactionService";

const { Option } = Select;

export interface LogExpenseFormValues {
  name: string;
  totalAmount: number;
  description?: string;
  categoryId: number;
  paymentMethod: number;
  firstDueDate?: { toISOString: () => string };
  isInstallment?: boolean;
  totalInstallments?: number;
  isRecurrent?: boolean;
  recurrenceInterval?: number;
}

export interface LogExpenseModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  categories?: ICategory[];
}

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({
  open,
  onCancel,
  onSuccess,
  categories: categoriesProp,
}) => {
  const [form] = Form.useForm<LogExpenseFormValues>();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>(categoriesProp || []);

  const paymentOptions = useMemo(() => EnumToList(PaymentMethod), []);
  const recurrenceInterval = useMemo(
    () => EnumToList(RecurrenceInterval).slice(1, 5),
    []
  );

  const isInstallment = Form.useWatch("isInstallment", form);
  const isRecurrent = Form.useWatch("isRecurrent", form);

  useEffect(() => {
    if (categoriesProp && categoriesProp.length > 0) {
      setCategories(categoriesProp);
    } else if (open) {
      getCategories()
        .then(setCategories)
        .catch((err) => {
          console.error("Failed to get categories:", err);
        });
    }
  }, [open, categoriesProp]);

  const handleCreateExpense = async (values: LogExpenseFormValues) => {
    const userInfo = getUserFromCookiesClient();
    if (!userInfo?.id) {
      console.error("User not authenticated");
      message.error("User not authenticated");
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
      form.resetFields();
      onCancel();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create expense", error);
      message.error("Failed to register expense");
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Log New Expense / Transaction"
      open={open}
      onCancel={handleModalCancel}
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
              rules={[{ required: true, message: "Please enter amount" }]}
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
              rules={[{ required: true, message: "Please select a category" }]}
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
              rules={[{ required: true, message: "Please select date" }]}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
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
  );
};

export default LogExpenseModal;
