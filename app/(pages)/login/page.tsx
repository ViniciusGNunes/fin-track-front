"use client";

import {
  ConfigProvider,
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
  theme,
} from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/app/lib/api";
import styles from "./page.module.scss";
import { FINTRACK_THEME } from "@/app/lib/theme";

const { Title, Text } = Typography;

export default function Page() {
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const response = await api.post("/users/login", values);

      if (!response) {
        messageApi.error("E-mail ou senha incorretos.");
        return;
      }

      if (response.data?.token) {
        Cookies.set("X-Access-Token", response.data.token, {
          expires: 7,
          secure: window.location.protocol === "https:",
          sameSite: "lax",
          path: "/",
        });
      }

      messageApi.success("Login realizado com sucesso!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      const serverMessage = error?.response?.data?.message;
      if (error?.response?.data?.isEmailUnconfirmed) {
        messageApi.warning(serverMessage || "Por favor, confirme seu e-mail antes de entrar.");
      } else {
        messageApi.error(serverMessage || "E-mail ou senha incorretos.");
      }
    }
  };

  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      {contextHolder}

      <main className={styles.container}>
        <div className={styles.card}>
          <Card variant={"borderless"}>
            <div className={styles.logoBadge} onClick={() => router.push("/")} style={{ cursor: "pointer" }}>F</div>

            <div className={styles.header}>
              <Title level={2} className={styles.title}>
                Bem-vindo de volta
              </Title>
              <Text className={styles.subtitle}>Acesse sua conta para continuar</Text>
            </div>

            <Form layout="vertical" onFinish={onFinish}>
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
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="Sua senha"
                />
              </Form.Item>

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Link href="/forgot-password" style={{ color: "var(--color-success)", fontSize: "0.875rem" }}>
                  Esqueceu a senha?
                </Link>
              </div>

              <Form.Item className={styles.submit}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  className={styles.button}
                >
                  Entrar
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Text style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Não tem uma conta?{" "}
                <Link href="/register" style={{ color: "var(--color-success)", fontWeight: 600 }}>
                  Criar conta
                </Link>
              </Text>
            </div>
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
