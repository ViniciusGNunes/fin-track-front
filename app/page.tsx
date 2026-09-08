"use client";

import React from "react";
import { Button, ConfigProvider, Tag } from "antd";
import {
  RiseOutlined,
  AccountBookOutlined,
  TeamOutlined,
  RocketOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { FINTRACK_THEME } from "./lib/theme";
import styles from "./landing.module.scss";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: <RiseOutlined />,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.12)",
      title: "Crescimento de Investimentos",
      description:
        "Acompanhe renda fixa, ações e fundos com cálculo automático de rendimento e distribuição estratégica da carteira.",
    },
    {
      icon: <AccountBookOutlined />,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.12)",
      title: "Eliminação Inteligente de Dívidas",
      description:
        "Visualize saldos devedores, cronogramas de amortização e projeções de quitação antecipada com alertas claros.",
    },
    {
      icon: <TeamOutlined />,
      color: "#38bdf8",
      bgColor: "rgba(56, 189, 248, 0.12)",
      title: "Despesas Compartilhadas",
      description:
        "Divida contas com amigos, família ou colegas de quarto. Monitore saldos pendentes e realize acertos transparentes.",
    },
    {
      icon: <RocketOutlined />,
      color: "#a855f7",
      bgColor: "rgba(168, 85, 247, 0.12)",
      title: "Metas Financeiras & Ritmo",
      description:
        "Estabeleça reservas de emergência e conquistas financeiras com acompanhamento do ritmo de poupança em tempo real.",
    },
    {
      icon: <CalendarOutlined />,
      color: "#ec4899",
      bgColor: "rgba(236, 72, 153, 0.12)",
      title: "Fluxo de Caixa no Calendário",
      description:
        "Inspecione despesas e receitas recorrentes em visualização diária para antecipar gastos e manter o saldo positivo.",
    },
    {
      icon: <SafetyCertificateOutlined />,
      color: "#6366f1",
      bgColor: "rgba(99, 102, 241, 0.12)",
      title: "Segurança e Controle Total",
      description:
        "Arquitetura moderna em .NET Core e Next.js com autenticação segura, cookies criptografados e controle de categorias.",
    },
  ];

  return (
    <ConfigProvider theme={FINTRACK_THEME}>
      <div className={styles.landingWrapper}>
        <div className={styles.ambientIllumination} />

        {/* Navigation */}
        <header className={styles.navbar}>
          <div className={styles.brandLogo} onClick={() => router.push("/")}>
            <div className={styles.logoBadge}>F</div>
            <span className={styles.brandName}>FinTrack</span>
          </div>

          <nav className={styles.navLinks}>
            <a href="#features">Recursos</a>
            <a href="#overview">Plataforma</a>
            <a href="#security">Segurança</a>
          </nav>

          <div className={styles.navActions}>
            <Button
              type="primary"
              onClick={() => router.push("/login")}
              style={{ fontWeight: 600 }}
            >
              Acessar FinTrack
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className={styles.container}>
          <section className={styles.heroSection}>
            <div className={styles.heroBadge}>
              <ThunderboltOutlined /> Inteligência e Gestão Patrimonial
            </div>

            <h1 className={styles.heroTitle}>
              Controle seu patrimônio, <br />
              <span className={styles.accentText}>simplifique cada decisão.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              O FinTrack consolida investimentos, quitação de dívidas, contas compartilhadas e fluxo de caixa diário em uma central financeira de alta performance.
            </p>

            <div className={styles.heroCtaGroup}>
              <Button
                type="primary"
                size="large"
                className={styles.primaryCta}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                onClick={() => router.push("/login")}
              >
                Acessar Plataforma
              </Button>
            </div>

            {/* Interactive Preview Mock */}
            <div className={styles.dashboardPreview} id="overview">
              <div className={styles.previewHeader}>
                <div className={styles.windowDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.previewStatus}>
                  <div className={styles.liveDot} />
                  <span>Sincronização em Tempo Real</span>
                </div>
              </div>

              <div className={styles.previewGrid}>
                <div className={styles.previewStatCard}>
                  <div className={styles.statLabel}>
                    <RiseOutlined style={{ color: "#10b981" }} /> Total em Investimentos
                  </div>
                  <div className={styles.statValue}>R$ 48.920,50</div>
                  <Tag color="success" style={{ marginTop: 8, borderRadius: 4 }}>
                    +14,2% de rendimento este ano
                  </Tag>
                </div>

                <div className={styles.previewStatCard}>
                  <div className={styles.statLabel}>
                    <AccountBookOutlined style={{ color: "#f59e0b" }} /> Saldo Devedor
                  </div>
                  <div className={styles.statValue} style={{ color: "#f59e0b" }}>
                    R$ 12.400,00
                  </div>
                  <span className={styles.statBadge} style={{ color: "#94a3b8" }}>
                    3 empréstimos (68% quitado)
                  </span>
                </div>

                <div className={styles.previewStatCard}>
                  <div className={styles.statLabel}>
                    <TeamOutlined style={{ color: "#38bdf8" }} /> Pendente a Receber
                  </div>
                  <div className={styles.statValue} style={{ color: "#38bdf8" }}>
                    R$ 1.850,00
                  </div>
                  <span className={styles.statBadge} style={{ color: "#94a3b8" }}>
                    4 despesas em grupo
                  </span>
                </div>

                <div className={styles.previewStatCard}>
                  <div className={styles.statLabel}>
                    <RocketOutlined style={{ color: "#a855f7" }} /> Reserva de Emergência
                  </div>
                  <div className={styles.statValue}>R$ 20.000,00</div>
                  <div style={{ marginTop: 8, fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
                    85% Concluído
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className={styles.featuresSection} id="features">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionPretitle}>Construído para Clareza</div>
              <h2 className={styles.sectionTitle}>Tudo o que você precisa para crescer</h2>
              <p className={styles.sectionSubtitle}>
                Diga adeus a planilhas confusas. O FinTrack oferece visão financeira estruturada com ferramentas intuitivas.
              </p>
            </div>

            <div className={styles.featureGrid}>
              {features.map((item, idx) => (
                <div key={idx} className={styles.featureCard}>
                  <div
                    className={styles.featureIcon}
                    style={{ color: item.color, backgroundColor: item.bgColor }}
                  >
                    {item.icon}
                  </div>
                  <h3 className={styles.featureTitle}>{item.title}</h3>
                  <p className={styles.featureDescription}>{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA Banner */}
          <section className={styles.ctaBanner} id="security">
            <h2>Assuma o Controle das Suas Finanças</h2>
            <p>
              Acesse o FinTrack e tenha visão unificada do seu patrimônio hoje mesmo com login em um clique.
            </p>
            <Button
              type="primary"
              size="large"
              className={styles.ctaButton}
              onClick={() => router.push("/login")}
            >
              Acessar FinTrack
            </Button>
          </section>

          {/* Footer */}
          <footer className={styles.footer}>
            <div className={styles.footerText}>
              © {new Date().getFullYear()} FinTrack. Todos os direitos reservados.
            </div>
            <div className={styles.footerLinks}>
              <a href="#features">Recursos</a>
              <a onClick={() => router.push("/login")} style={{ cursor: "pointer" }}>
                Acessar Plataforma
              </a>
            </div>
          </footer>
        </main>
      </div>
    </ConfigProvider>
  );
}
