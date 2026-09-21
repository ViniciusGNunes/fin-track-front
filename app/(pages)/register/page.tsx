"use client";

import React, { useState } from "react";
import { ConfigProvider, Card, Typography, Spin } from "antd";
import { useRouter } from "next/navigation";
import { SocialAuthButtons } from "@/app/components/SocialAuthButtons/SocialAuthButtons";
import styles from "./page.module.scss";
import { FINTRACK_THEME } from "@/app/lib/theme";

const { Title, Text } = Typography;

export default function Page() {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState<{
    loading: boolean;
    title?: string;
    description?: string;
  }>({ loading: false });

  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      <main className={styles.container}>
        <div className={styles.card}>
          <Card variant={"borderless"}>
            <div
              className={styles.logoBadge}
              onClick={() => router.push("/")}
              style={{ cursor: "pointer" }}
            >
              F
            </div>

            {loadingState.loading ? (
              <div style={{ padding: "40px 12px", textAlign: "center" }}>
                <Spin size="large" />
                <Title level={3} style={{ color: "var(--text-primary)", marginTop: 24, marginBottom: 8 }}>
                  {loadingState.title || "Criando e conectando sua conta..."}
                </Title>
                <Text style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  {loadingState.description || "Aguarde um momento enquanto validamos suas credenciais."}
                </Text>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <Title level={2} className={styles.title}>
                    Criar Conta no FinTrack
                  </Title>
                  <Text className={styles.subtitle}>
                    Cadastre-se com um clique usando seu provedor favorito
                  </Text>
                </div>

                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  <SocialAuthButtons
                    text="signup_with"
                    onLoadingChange={(loading, title, description) =>
                      setLoadingState({ loading, title, description })
                    }
                  />
                </div>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <Text style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    Ao criar sua conta, seus dados são sincronizados com segurança. Você poderá atualizar seu nome e preferências depois nas configurações do app.
                  </Text>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
