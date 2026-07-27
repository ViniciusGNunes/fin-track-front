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
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import styles from "./page.module.scss";

const { Title, Text } = Typography;

export default function Page() {
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const response = await api.post("/users/login", values);

      if (!response) {
        messageApi.error("Invalid email or password.");
        return;
      }

      messageApi.success("Login successful!");
      router.push("/dashboard");
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
                Welcome Back 👋
              </Title>
              <Text className={styles.subtitle}>Sign in to your account</Text>
            </div>

            <Form layout="vertical" onFinish={onFinish}>
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
                    message: "Please enter your password.",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined className={styles.inputIcon} />}
                  placeholder="Password"
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
                  Sign In
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
