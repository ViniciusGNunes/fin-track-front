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
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
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

  const onFinish = async (values: RegisterForm) => {
    try {
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

      if (!response.ok) {
        const error = await response.json();

        const validationMessage =
          error.errors && Object.values(error.errors).flat()[0];

        messageApi.error(
          validationMessage ?? error.title ?? "Falha ao criar conta.",
        );
        return;
      }

      messageApi.success("Conta criada com sucesso!");
      router.push("/dashboard");

      form.resetFields();
    } catch (error) {
      console.error(error);
      messageApi.error("Ocorreu um erro ao tentar cadastrar.");
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
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
