"use client";

import React, { useState } from "react";
import {
  ConfigProvider,
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
} from "antd";
import { MailOutlined, ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestPasswordReset } from "@/app/services/Backend/UserService";
import { FINTRACK_THEME } from "@/app/lib/theme";
import styles from "./page.module.scss";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const onFinish = async (values: { email: string }) => {
    try {
      setLoading(true);
      await requestPasswordReset(values.email);
      setSentEmail(values.email);
      messageApi.success("Instruções de redefinição enviadas!");
    } catch (err) {
      messageApi.error("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      {contextHolder}

      <main className={styles.container}>
        <div className={styles.card}>
          <Card variant="borderless">
            <div
              className={styles.logoBadge}
              onClick={() => router.push("/")}
              style={{ cursor: "pointer" }}
            >
              F
            </div>

            {sentEmail ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, color: "var(--color-success)", marginBottom: 16 }}>
                  📩
                </div>
                <Title level={3} style={{ color: "var(--text-primary)", marginBottom: 8 }}>
                  Verifique seu E-mail
                </Title>
                <Text style={{ color: "var(--text-secondary)", display: "block", marginBottom: 24, fontSize: "0.95rem" }}>
                  Se existir uma conta associada a <strong style={{ color: "var(--text-primary)" }}>{sentEmail}</strong>, enviamos um link para redefinir sua senha.
                </Text>

                <Button
                  type="primary"
                  size="large"
                  onClick={() => router.push("/login")}
                  block
                >
                  Voltar para o Login
                </Button>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <Title level={2} className={styles.title}>
                    Recuperar Senha
                  </Title>
                  <Text className={styles.subtitle}>
                    Informe seu e-mail cadastrado para receber o link de redefinição
                  </Text>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                  <Form.Item
                    label="E-mail"
                    name="email"
                    rules={[
                      { required: true, message: "Por favor, insira seu e-mail." },
                      { type: "email", message: "Insira um e-mail válido." },
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<MailOutlined className={styles.inputIcon} />}
                      placeholder="seu@email.com"
                    />
                  </Form.Item>

                  <Form.Item className={styles.submit}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      size="large"
                      loading={loading}
                      icon={<SendOutlined />}
                      className={styles.button}
                    >
                      Enviar Link de Redefinição
                    </Button>
                  </Form.Item>
                </Form>

                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <Link
                    href="/login"
                    style={{ color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <ArrowLeftOutlined style={{ fontSize: 12 }} /> Voltar para o login
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
