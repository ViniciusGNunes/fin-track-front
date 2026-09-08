"use client";

import React, { useState } from "react";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { message, Button, Spin } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/app/lib/api";
import { AxiosError } from "axios";

interface GoogleAuthButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  text = "continue_with",
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse?.credential) {
      message.error("Não foi possível obter a credencial do Google.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/users/google-login", {
        idToken: credentialResponse.credential,
      });

      if (res.data?.token) {
        Cookies.set("X-Access-Token", res.data.token, {
          expires: 7,
          secure: window.location.protocol === "https:",
          sameSite: "lax",
          path: "/",
        });

        message.success(res.data.message || "Autenticado com sucesso!");
        router.push("/dashboard");
      } else {
        message.error("Resposta de autenticação inválida.");
      }
    } catch (error: unknown) {
      console.error("Google login failed:", error);
      const err = error as AxiosError<{ message?: string }>;
      const msg =
        err?.response?.data?.message || "Falha ao autenticar com o Google.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    message.error("Falha na autenticação com o Google. Tente novamente.");
  };

  if (!clientId) {
    return (
      <Button
        block
        size="large"
        icon={<GoogleOutlined />}
        disabled
        style={{
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: "var(--text-secondary)",
          borderColor: "var(--border-default)",
        }}
        title="Defina NEXT_PUBLIC_GOOGLE_CLIENT_ID para ativar o login com Google"
      >
        Continuar com Google
      </Button>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Spin spinning={loading}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme="filled_black"
          shape="rectangular"
          size="large"
          width="100%"
          text={text}
        />
      </Spin>
    </div>
  );
};
