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
  Result,
} from "antd";
import { UserOutlined, MailOutlined, LockOutlined, CheckCircleOutlined, SendOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import { resendConfirmationEmail } from "@/app/services/Backend/UserService";
import styles from "./page.module.scss";
import { FINTRACK_THEME } from "@/app/lib/theme";

const { Title, Text } = Typography;

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Page() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const onFinish = async (values: RegisterForm) => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:5066/v1/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const validationMessage =
          data.errors && Object.values(data.errors).flat()[0];

        messageApi.error(
          (typeof validationMessage === "string" ? validationMessage : null) ?? data.message ?? data.title ?? "Falha ao criar conta.",
        );
        return;
      }

      setRegisteredEmail(values.email);
      messageApi.success("Cadastro realizado com sucesso!");
      form.resetFields();
    } catch (error) {
      console.error(error);
      messageApi.error("Ocorreu um erro ao tentar cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    try {
      setResending(true);
      await resendConfirmationEmail(registeredEmail);
      messageApi.success("Novo link de verificação enviado para o seu e-mail!");
    } catch (err) {
      messageApi.error("Não foi possível reenviar o e-mail no momento.");
    } finally {
      setResending(false);
    }
  };

  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      {contextHolder}

      <main className={styles.container}>
        <div className={styles.card}>
          <Card variant={"borderless"}>
            <div className={styles.logoBadge} onClick={() => router.push("/")} style={{ cursor: "pointer" }}>F</div>

            {registeredEmail ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, color: "var(--color-success)", marginBottom: 16 }}>
                  ✉️
                </div>
                <Title level={3} style={{ color: "var(--text-primary)", marginBottom: 8 }}>
                  Confirme seu E-mail
                </Title>
                <Text style={{ color: "var(--text-secondary)", display: "block", marginBottom: 24, fontSize: "0.95rem" }}>
                  Enviamos um link de ativação para <strong style={{ color: "var(--text-primary)" }}>{registeredEmail}</strong>. Por favor, acerte sua caixa de entrada para ativar sua conta.
                </Text>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => router.push("/login")}
                    block
                  >
                    Ir para a Página de Login
                  </Button>

                  <Button
                    type="default"
                    icon={<SendOutlined />}
                    onClick={handleResend}
                    loading={resending}
                    block
                  >
                    Reenviar Link de Confirmação
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <Title level={2} className={styles.title}>
                    Criar Conta
                  </Title>
                  <Text className={styles.subtitle}>Cadastre-se para começar</Text>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Nome Completo"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira seu nome.",
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined className={styles.inputIcon} />}
                  placeholder="Seu Nome"
                />
              </Form.Item>

              <Form.Item
                label="E-mail"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira seu e-mail.",
                  },
                  {
                    type: "email",
                    message: "Por favor, insira um e-mail válido.",
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined className={styles.inputIcon} />}
                  placeholder="seu@email.com"
                />
              </Form.Item>

              <Form.Item
                label="Senha"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira uma senha.",
                  },
                  {
                    min: 8,
                    message: "A senha deve ter pelo menos 8 caracteres.",
                  },
                  {
                    validator(_, value) {
                      if (!value) {
                        return Promise.resolve();
                      }

                      const passwordRegex =
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

                      if (passwordRegex.test(value)) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error(
                          "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.",
                        ),
                      );
                    },
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="Sua senha"
                />
              </Form.Item>

              <Form.Item
                label="Confirmar Senha"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "Por favor, confirme sua senha.",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error("As senhas não coincidem."),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="Confirme sua senha"
                />
              </Form.Item>

              <Form.Item className={styles.submit}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  className={styles.button}
                >
                  Criar Conta
                </Button>
              </Form.Item>
            </Form>

            <div className={styles.footer}>
              <Text className={styles.footerText}>
                Já possui uma conta?{" "}
                <Link href="/login" className={styles.link}>
                  Entrar
                </Link>
              </Text>
            </div>
          </>
        )}
      </Card>
    </div>
  </main>
</ConfigProvider>
  );
}
