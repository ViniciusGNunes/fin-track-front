"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import {
  ArrowLeftOutlined,
  DashboardOutlined,
  CreditCardOutlined,
  RiseOutlined,
  RocketOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import styles from "./not-found.module.scss";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.ambientGlow} />

      <div className={styles.content}>
        <Link href="/" className={styles.brand}>
          <div className={styles.logoBadge}>FT</div>
          <span className={styles.brandName}>FinTrack</span>
        </Link>

        <div className={styles.tagBadge}>
          <CompassOutlined />
          <span>Erro 404 • Fora de Rota</span>
        </div>

        <h1 className={styles.errorCode}>404</h1>

        <h2 className={styles.title}>Página não encontrada</h2>

        <p className={styles.description}>
          O endereço solicitado não existe, mudou de lugar ou está temporariamente indisponível.
          Retorne ao painel ou navegue pelos atalhos abaixo.
        </p>

        <div className={styles.actions}>
          <Button
            type="primary"
            size="large"
            icon={<DashboardOutlined />}
            onClick={() => router.push("/dashboard")}
          >
            Ir para o Dashboard
          </Button>

          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
          >
            Voltar
          </Button>
        </div>

        <div className={styles.quickNav}>
          <div className={styles.quickNavTitle}>Atalhos rápidos</div>
          <div className={styles.quickGrid}>
            <Link href="/dashboard" className={styles.quickCard}>
              <DashboardOutlined className={styles.cardIcon} />
              <span className={styles.cardLabel}>Dashboard</span>
            </Link>

            <Link href="/expenses" className={styles.quickCard}>
              <CreditCardOutlined className={styles.cardIcon} />
              <span className={styles.cardLabel}>Despesas</span>
            </Link>

            <Link href="/investments" className={styles.quickCard}>
              <RiseOutlined className={styles.cardIcon} />
              <span className={styles.cardLabel}>Investimentos</span>
            </Link>

            <Link href="/goals" className={styles.quickCard}>
              <RocketOutlined className={styles.cardIcon} />
              <span className={styles.cardLabel}>Metas</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
