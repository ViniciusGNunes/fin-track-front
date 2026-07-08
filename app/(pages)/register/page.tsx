"use client";

import {
  Button,
  Card,
  Form,
  Input,
  Typography,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from "@ant-design/icons";

import styles from "./page.module.scss";

const { Title, Text } = Typography;

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Page() {
  const [form] = Form.useForm();

  const onFinish = (values: RegisterForm) => {
    console.log(values);
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <Card>
          <div className={styles.header}>
            <Title level={2}>Create Account 🚀</Title>
            <Text type="secondary">
              Sign up to get started
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
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
                prefix={<UserOutlined />}
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
                  message: "Please enter a password.",
                },
                {
                  min: 8,
                  message:
                    "Password must be at least 8 characters.",
                },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
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
                  message:
                    "Please confirm your password.",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      getFieldValue("password") === value
                    ) {
                      return Promise.resolve();
                    }

                    return Promise.reject(
                      new Error(
                        "Passwords do not match."
                      )
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="Confirm password"
              />
            </Form.Item>

            <Form.Item className={styles.submit}>
              <Button
                type="primary"
                htmlType="submit"
                block
                className={styles.button}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </main>
  );
}