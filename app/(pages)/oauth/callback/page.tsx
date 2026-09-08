"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin, Card, Typography, Button, Result } from "antd";
import Cookies from "js-cookie";
import { api } from "@/app/lib/api";
import Link from "next/link";

const { Text, Title } = Typography;

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function handleExchange() {
      const provider = searchParams.get("provider");
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDesc = searchParams.get("error_description");

      if (errorParam) {
        if (!isMounted) return;
        setStatus("error");
        let translatedError = "O usuário ou o provedor de autenticação recusou o pedido de autorização.";
        if (errorDesc) {
          if (errorDesc.toLowerCase().includes("denied the request") || errorDesc.toLowerCase().includes("access_denied")) {
            translatedError = "O usuário ou o servidor de autorização recusou a solicitação de acesso.";
          } else {
            translatedError = errorDesc;
          }
        } else if (errorParam === "access_denied") {
          translatedError = "Acesso negado: a autorização foi cancelada ou recusada.";
        } else {
          translatedError = `Autenticação cancelada ou recusada (${errorParam}).`;
        }
        setErrorMessage(translatedError);
        return;
      }

      if (!provider || !code) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage("Parâmetros de autenticação ausentes na requisição de retorno.");
        return;
      }

      try {
        let codeVerifier: string | undefined = undefined;
        if (provider === "twitter") {
          codeVerifier = sessionStorage.getItem("fintrack_twitter_verifier") || undefined;
          sessionStorage.removeItem("fintrack_twitter_verifier");
        }

        const redirectUri = `${window.location.origin}/oauth/callback?provider=${provider}`;

        const response = await api.post("/users/oauth-login", {
          provider,
          code,
          redirectUri,
          codeVerifier,
        });

        if (!isMounted) return;

        if (response.data?.token) {
          Cookies.set("X-Access-Token", response.data.token, {
            expires: 7,
            secure: window.location.protocol === "https:",
            sameSite: "lax",
            path: "/",
          });

          setStatus("success");
          router.push("/dashboard");
        } else {
          setStatus("error");
          setErrorMessage("Resposta do servidor não continha um token válido.");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("OAuth exchange error:", err);
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const backendMsg =
          axiosErr?.response?.data?.message ||
          "Não foi possível concluir a autenticação com o provedor selecionado.";
        setStatus("error");
        setErrorMessage(backendMsg);
      }
    }

    handleExchange();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]);

  return (
    <Card
      style={{
        maxWidth: 480,
        width: "100%",
        background: "var(--bg-surface, #14171a)",
        borderColor: "var(--border-subtle, rgba(255, 255, 255, 0.12))",
        borderRadius: "var(--radius-lg, 16px)",
        textAlign: "center",
        padding: "24px 12px",
      }}
    >
      {status === "loading" && (
        <div style={{ padding: "32px 0" }}>
          <Spin size="large" />
          <Title level={4} style={{ color: "var(--text-primary)", marginTop: 24 }}>
            Conectando à sua conta...
          </Title>
          <Text style={{ color: "var(--text-secondary)" }}>
            Aguarde um momento enquanto validamos suas credenciais.
          </Text>
        </div>
      )}

      {status === "success" && (
        <div style={{ padding: "32px 0" }}>
          <Title level={4} style={{ color: "var(--color-success, #52c41a)" }}>
            Login realizado com sucesso!
          </Title>
          <Text style={{ color: "var(--text-secondary)" }}>
            Redirecionando para o painel...
          </Text>
        </div>
      )}

      {status === "error" && (
        <Result
          status="error"
          title={<span style={{ color: "var(--text-primary)" }}>Falha na autenticação</span>}
          subTitle={
            <span style={{ color: "var(--text-secondary)" }}>
              {errorMessage}
            </span>
          }
          extra={[
            <Link href="/login" key="login">
              <Button type="primary" size="large">
                Voltar para o Login
              </Button>
            </Link>,
          ]}
        />
      )}
    </Card>
  );
}

export default function OAuthCallbackPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg-canvas, #0a0d10)",
      }}
    >
      <Suspense
        fallback={
          <Card
            style={{
              maxWidth: 480,
              width: "100%",
              background: "var(--bg-surface, #14171a)",
              borderColor: "var(--border-subtle, rgba(255, 255, 255, 0.12))",
              borderRadius: "var(--radius-lg, 16px)",
              textAlign: "center",
              padding: "48px 12px",
            }}
          >
            <Spin size="large" />
          </Card>
        }
      >
        <OAuthCallbackContent />
      </Suspense>
    </main>
  );
}
