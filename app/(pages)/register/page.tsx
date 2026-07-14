"use client";

import { Button, Card, Form, Input, Typography, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";

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

      const user = await response.json();

      console.log(user);

      messageApi.success("Account created successfully!");

      form.resetFields();

      // Later:
      // router.push("/login");
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
              <Title level={2}>Create Account 🚀</Title>

              <Text type="secondary">Sign up to get started</Text>
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
    </>
  );
}
