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
  Divider,
} from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/app/lib/api";
import { SocialAuthButtons } from "@/app/components/SocialAuthButtons/SocialAuthButtons";
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

  const onFinish = async (values: RegisterForm) => {
    try {
      setLoading(true);
      const response = await api.post("/users/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (response.data?.token) {
        Cookies.set("X-Access-Token", response.data.token, {
          expires: 7,
          secure: window.location.protocol === "https:",
          sameSite: "lax",
          path: "/",
        });

        messageApi.success(
          response.data?.message || "Cadastro realizado com sucesso!"
        );
        router.push("/dashboard");
      } else {
        messageApi.success(
          "Cadastro realizado com sucesso! Faça login para continuar."
        );
        router.push("/login");
      }
    } catch (error: any) {
      console.error(error);
      const serverData = error?.response?.data;
      const validationMessage =
        serverData?.errors && Object.values(serverData.errors).flat()[0];

      messageApi.error(
        (typeof validationMessage === "string" ? validationMessage : null) ??
          serverData?.message ??
          serverData?.title ??
          "Ocorreu um erro ao tentar cadastrar."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      {contextHolder}

      <main className={styles.container}>
        <div className={styles.card}>
          <Card variant={"borderless"}>
            <div
              className={styles.logoBadge}
              onClick={() => router.push("/")}
              style={{ cursor: "pointer" }}
            >
              F
            </div>

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
                  placeholder="Seu nome completo"
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
                    message: "Por favor, insira sua senha.",
                  },
                  {
                    min: 6,
                    message: "A senha deve ter pelo menos 6 caracteres.",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="Crie uma senha forte"
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
                        new Error("As senhas não coincidem.")
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
                  loading={loading}
                  className={styles.button}
                >
                  Criar Conta
                </Button>
              </Form.Item>
            </Form>

            <Divider
              plain
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                margin: "18px 0 14px",
              }}
            >
              ou continue com
            </Divider>

            <SocialAuthButtons text="signup_with" />

            <div className={styles.footer}>
              <Text className={styles.footerText}>
                Já possui uma conta?{" "}
                <Link href="/login" className={styles.link}>
                  Entrar
                </Link>
              </Text>
            </div>
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
