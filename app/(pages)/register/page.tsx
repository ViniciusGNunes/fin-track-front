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
import styles from "./page.module.scss";

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
          validationMessage ?? error.title ?? "Registration failed.",
        );
        return;
      }

      messageApi.success("Account created successfully!");
      router.push("/dashboard");

      form.resetFields();
    } catch (error) {
      console.error(error);
      messageApi.error("Something went wrong.");
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
      {contextHolder}

      <main className={styles.container}>
        <div className={styles.card}>
          <Card bordered={false}>
            <div className={styles.logoBadge}>F</div>

            <div className={styles.header}>
              <Title level={2} className={styles.title}>
                Create Account 🚀
              </Title>
              <Text className={styles.subtitle}>Sign up to get started</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Please enter your name.",
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined className={styles.inputIcon} />}
                  placeholder="John Doe"
                />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Please enter your email.",
                  },
                  {
                    type: "email",
                    message: "Please enter a valid email.",
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined className={styles.inputIcon} />}
                  placeholder="your@email.com"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please enter a password.",
                  },
                  {
                    min: 8,
                    message: "Password must be at least 8 characters.",
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
                          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
                        ),
                      );
                    },
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your password.",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error("Passwords do not match."),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="Confirm password"
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
                  Create Account
                </Button>
              </Form.Item>
            </Form>

            <div className={styles.footer}>
              <Text className={styles.footerText}>
                Already have an account?{" "}
                <Link href="/login" className={styles.link}>
                  Sign in
                </Link>
              </Text>
            </div>
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
