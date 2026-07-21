"use client";

import { Button, Card, Form, Input, Typography, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";

import styles from "./page.module.scss";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";

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

      router.push("/main");

      messageApi.success("Login successful!");
    } catch (error) {
      console.error(error);
      messageApi.error("Something went wrong.");
    }
  };

  return (
    <>
      {contextHolder}

      <main className={styles.container}>
        <div className={styles.card}>
          <Card>
            <div className={styles.header}>
              <Title level={2}>Welcome Back 👋</Title>

              <Text type="secondary">Sign in to continue</Text>
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
                  prefix={<MailOutlined />}
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
                  prefix={<LockOutlined />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item className={styles.submit}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className={styles.button}
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </main>
    </>
  );
}
