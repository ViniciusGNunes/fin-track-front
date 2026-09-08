"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ConfigProvider,
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
} from "antd";
import { LockOutlined, CheckCircleFilled, CloseCircleFilled, KeyOutlined } from "@ant-design/icons";
import { resetPassword } from "@/app/services/Backend/UserService";
import { FINTRACK_THEME } from "@/app/lib/theme";
import styles from "./page.module.scss";
import { AxiosError } from "axios";

const { Title, Text } = Typography;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const userIdParam = searchParams.get("userId");
  const tokenParam = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"form" | "success" | "invalid">(
    !userIdParam || !tokenParam ? "invalid" : "form"
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    !userIdParam || !tokenParam ? "Parâmetros de redefinição ausentes no link." : ""
  );

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (!userIdParam || !tokenParam) return;

    try {
      setLoading(true);
      await resetPassword(Number(userIdParam), tokenParam, values.password);
      setStatus("success");
      messageApi.success("Senha redefinida com sucesso!");
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr?.response?.data?.message || "Não foi possível redefinir a senha. O link pode ter expirado.";
      messageApi.error(msg);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      {contextHolder}

      <div className={styles.card}>
        <Card variant="borderless">
          <div
            className={styles.logoBadge}
            onClick={() => router.push("/")}
            style={{ cursor: "pointer" }}
          >
            F
          </div>

          {status === "invalid" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 52, color: "var(--color-danger)", marginBottom: 16 }}>
                <CloseCircleFilled />
              </div>
              <Title level={3} style={{ color: "var(--text-primary)", marginBottom: 8 }}>
                Link Inválido
              </Title>
              <Text style={{ color: "var(--text-secondary)", display: "block", marginBottom: 24 }}>
                {errorMessage}
              </Text>
              <Button
                type="primary"
                size="large"
                block
                onClick={() => router.push("/forgot-password")}
              >
                Solicitar Novo Link
              </Button>
            </div>
          )}

          {status === "success" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 52, color: "var(--color-success)", marginBottom: 16 }}>
                <CheckCircleFilled />
              </div>
              <Title level={3} style={{ color: "var(--text-primary)", marginBottom: 8 }}>
                Senha Redefinida!
              </Title>
              <Text style={{ color: "var(--text-secondary)", display: "block", marginBottom: 24 }}>
                Sua senha foi alterada com sucesso. Você já pode fazer login na sua conta.
              </Text>
              <Button
                type="primary"
                size="large"
                block
                onClick={() => router.push("/login")}
              >
                Fazer Login
              </Button>
            </div>
          )}

          {status === "form" && (
            <>
              <div className={styles.header}>
                <Title level={2} className={styles.title}>
                  Nova Senha
                </Title>
                <Text className={styles.subtitle}>
                  Crie uma nova senha segura para a sua conta
                </Text>
              </div>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                  label="Nova Senha"
                  name="password"
                  rules={[
                    { required: true, message: "Por favor, insira uma nova senha." },
                    { min: 8, message: "A senha deve ter no mínimo 8 caracteres." },
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className={styles.inputIcon} />}
                    placeholder="Mínimo 8 caracteres"
                  />
                </Form.Item>

                <Form.Item
                  label="Confirme a Nova Senha"
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Por favor, confirme sua senha." },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("As senhas não coincidem."));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className={styles.inputIcon} />}
                    placeholder="Confirme a nova senha"
                  />
                </Form.Item>

                <Form.Item className={styles.submit}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                    icon={<KeyOutlined />}
                    className={styles.button}
                  >
                    Salvar Nova Senha
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-canvas)" }} />}>
        <ResetPasswordContent />
      </Suspense>
    </ConfigProvider>
  );
}
