"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ConfigProvider,
  Card,
  Button,
  Typography,
  Spin,
  Result,
  Input,
  message,
} from "antd";
import { CheckCircleFilled, CloseCircleFilled, MailOutlined, SendOutlined } from "@ant-design/icons";
import { confirmEmail, resendConfirmationEmail } from "@/app/services/Backend/UserService";
import { FINTRACK_THEME } from "@/app/lib/theme";
import styles from "./page.module.scss";

const { Title, Text } = Typography;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userIdParam = searchParams.get("userId");
  const tokenParam = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState<string>("");
  const [resending, setResending] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!userIdParam || !tokenParam) {
      setStatus("error");
      setErrorMessage("Parâmetros de verificação ausentes no link.");
      return;
    }

    const verify = async () => {
      try {
        await confirmEmail(Number(userIdParam), tokenParam);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.message || "Link de confirmação inválido ou expirado."
        );
      }
    };

    verify();
  }, [userIdParam, tokenParam]);

  const handleResend = async () => {
    if (!resendEmail) {
      messageApi.error("Por favor, digite seu e-mail.");
      return;
    }
    try {
      setResending(true);
      await resendConfirmationEmail(resendEmail);
      messageApi.success("Se o e-mail existir, um novo link de confirmação foi enviado!");
    } catch (err) {
      messageApi.error("Erro ao reenviar confirmação. Tente novamente.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className={styles.container}>
      {contextHolder}
      <div className={styles.card}>
        <Card variant="borderless">
          <div
            className={styles.logoBadge}
            onClick={() => router.push("/")}
            style={{ cursor: "pointer" }}
          >
            F
          </div>

          {status === "loading" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
              <Title level={4} style={{ color: "var(--text-primary)", marginTop: 24, marginBottom: 8 }}>
                Verificando seu e-mail...
              </Title>
              <Text style={{ color: "var(--text-secondary)" }}>
                Por favor, aguarde enquanto validamos suas credenciais.
              </Text>
            </div>
          )}

          {status === "success" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 52, color: "var(--color-success)", marginBottom: 16 }}>
                <CheckCircleFilled />
              </div>
              <Title level={3} style={{ color: "var(--text-primary)", marginBottom: 8 }}>
                E-mail Confirmado!
              </Title>
              <Text style={{ color: "var(--text-secondary)", display: "block", marginBottom: 24, fontSize: "0.95rem" }}>
                Sua conta foi ativada com sucesso. Agora você já pode acessar a plataforma.
              </Text>
              <Button
                type="primary"
                size="large"
                block
                onClick={() => router.push("/login")}
              >
                Acessar Minha Conta
              </Button>
            </div>
          )}

          {status === "error" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 52, color: "var(--color-danger)", marginBottom: 16 }}>
                <CloseCircleFilled />
              </div>
              <Title level={3} style={{ color: "var(--text-primary)", marginBottom: 8 }}>
                Falha na Verificação
              </Title>
              <Text style={{ color: "var(--text-secondary)", display: "block", marginBottom: 24, fontSize: "0.95rem" }}>
                {errorMessage}
              </Text>

              <div style={{ background: "var(--bg-surface-subtle)", padding: 16, borderRadius: "var(--radius-md)", marginBottom: 20, textAlign: "left" }}>
                <Text style={{ color: "var(--text-primary)", fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Reenviar link de confirmação:
                </Text>
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="Digite seu e-mail cadastrado"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <Button
                  type="default"
                  icon={<SendOutlined />}
                  loading={resending}
                  onClick={handleResend}
                  block
                >
                  Reenviar Link
                </Button>
              </div>

              <Button type="link" onClick={() => router.push("/login")} style={{ color: "var(--color-success)" }}>
                Voltar para o Login
              </Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-canvas)" }} />}>
        <VerifyEmailContent />
      </Suspense>
    </ConfigProvider>
  );
}
