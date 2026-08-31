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
      message.error("Você precisa estar conectado para realizar esta ação.");
      return;
    }

    const formattedDate = values.firstDueDate
      ? values.firstDueDate.toISOString()
      : new Date().toISOString();

    const payload: any = {
      userId: Number(userInfo.id),
      name: values.name,
      description: values.description || null,
      totalAmount: Number(values.totalAmount),
      type: TransactionType.Expense,
      categoryId: Number(values.categoryId),
      categoryID: Number(values.categoryId),
      paymentMethod: Number(values.paymentMethod),
      firstDueDate: formattedDate,
      isInstallment: Boolean(values.isInstallment),
      totalInstallments: values.isInstallment && values.totalInstallments
        ? Number(values.totalInstallments)
        : 1,
      isRecurrent: Boolean(values.isRecurrent),
      recurrenceInterval: values.isRecurrent && values.recurrenceInterval
        ? Number(values.recurrenceInterval)
        : 0,
    };

    try {
      setLoading(true);
      await postTransaction(payload);
      message.success("Despesa cadastrada com sucesso!");
      form.resetFields();
      onCancel();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create expense", error);
      message.error("Não foi possível salvar a despesa. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Registrar Nova Despesa"
      open={open}
      onOk={() => form.submit()}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      okText="Salvar Despesa"
      cancelText="Cancelar"
      width={600}
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
              label="Título / Nome da Despesa"
              rules={[
                { required: true, message: "Por favor, insira o título" },
                {
                  max: 150,
                  message: "O título não pode exceder 150 caracteres",
                },
              ]}
            >
              <Input
                placeholder="Ex: Supermercado ou Assinatura AWS"
                maxLength={150}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="totalAmount"
              label="Valor Total (R$)"
              rules={[{ required: true, message: "Por favor, insira o valor" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0.01}
                max={999999999.99}
                precision={2}
                placeholder="0,00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="Descrição (Opcional)"
              rules={[
                {
                  max: 500,
                  message: "A descrição não pode exceder 500 caracteres",
                },
              ]}
            >
              <Input.TextArea
                rows={2}
                placeholder="Ex: Detalhes ou observações adicionais sobre o gasto"
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="categoryId"
              label="Categoria"
              rules={[{ required: true, message: "Por favor, selecione uma categoria" }]}
            >
              <Select placeholder="Selecione a categoria">
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
              label="Forma de Pagamento"
              rules={[
                {
                  required: true,
                  message: "Por favor, selecione a forma de pagamento",
                },
              ]}
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstDueDate"
              label="Data de Vencimento / Pagamento"
              rules={[{ required: true, message: "Por favor, selecione a data" }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Selecione a data" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={12}>
            <Form.Item
              name="isInstallment"
              label="Compra Parcelada?"
              valuePropName="checked"
            >
              <Switch disabled={isRecurrent} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="isRecurrent"
              label="Despesa Recorrente / Assinatura?"
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
              label="Número Total de Parcelas"
              rules={[
                {
                  required: true,
                  message: "Especifique o número de parcelas",
                },
              ]}
            >
              <InputNumber
                min={1}
                max={360}
                style={{ width: "100%" }}
                placeholder="Ex: 12"
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
              label="Frequência de Cobrança"
              rules={[
                {
                  required: true,
                  message: "Selecione o intervalo de recorrência",
                },
              ]}
            >
              <Select placeholder="Selecione a frequência">
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
