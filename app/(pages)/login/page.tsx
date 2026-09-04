"use client";

import {
  ConfigProvider,
  Card,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { SocialAuthButtons } from "@/app/components/SocialAuthButtons/SocialAuthButtons";
import styles from "./page.module.scss";
import { FINTRACK_THEME } from "@/app/lib/theme";

const { Title, Text } = Typography;

export default function Page() {
  const router = useRouter();

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

            <div className={styles.header}>
              <Title level={2} className={styles.title}>
                Entrar no FinTrack
              </Title>
              <Text className={styles.subtitle}>
                Escolha seu provedor favorito para acessar ou criar sua conta
              </Text>
            </div>

            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <SocialAuthButtons text="continue_with" />
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Text style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                Ao continuar, sua conta é autenticada com segurança via OAuth. Você pode configurar seu nome e preferências nas configurações do painel.
              </Text>
            </div>
          </Card>
        </div>
      </main>
    </ConfigProvider>
  );
}
