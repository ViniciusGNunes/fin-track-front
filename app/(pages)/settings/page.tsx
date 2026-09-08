"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ConfigProvider,
  Layout,
  Button,
  Card,
  Row,
  Col,
  Tabs,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Avatar,
  message,
  Popconfirm,
  Modal,
  Tag,
  Divider,
} from "antd";
import {
  UserOutlined,
  SettingOutlined,
  AppstoreOutlined,
  BellOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
  GlobalOutlined,
  SafetyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { Header } from "../../components/Header/Header";
import styles from "./styles.module.scss";
import { FINTRACK_THEME, FINTRACK_LOCALE } from "@/app/lib/theme";
import { UserCookieInfo } from "../../interfaces/UserCookieInfo";
import { getUserFromCookiesClient } from "@/app/services/Frontend/tokenServicesClient";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
  ICategory,
} from "@/app/services/Backend/CategoriesService";
import {
  getUserProfile,
  updateUserProfile,
  IUserProfile,
} from "@/app/services/Backend/UserService";
import { getPortfolioSummary } from "@/app/services/Backend/InvestmentService";
import { getDebtSummary } from "@/app/services/Backend/DebtService";
import { getReceivablesSummary } from "@/app/services/Backend/ReceivableService";
import { getGoalsSummary } from "@/app/services/Backend/GoalService";
import dayjs from "dayjs";

const { Content } = Layout;
const { Option } = Select;

const PRESET_COLORS = [
  "#58a6ff",
  "#008d0a",
  "#f59e0b",
  "#ff4d4f",
  "#ec4899",
  "#8b5cf6",
  "#10b981",
  "#38bdf8",
  "#f97316",
  "#64748b",
];

export default function SettingsPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("settings");
  const [activeTab, setActiveTab] = useState("profile");

  const [userInfo] = useState<UserCookieInfo | null>(() => {
    if (typeof window !== "undefined") {
      try {
        return getUserFromCookiesClient();
      } catch {
        return null;
      }
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState<IUserProfile | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Category modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);

  // Forms
  const [profileForm] = Form.useForm();
  const [prefForm] = Form.useForm();
  const [catForm] = Form.useForm();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const cats = await getCategories();
      setCategories(cats || []);

      if (userInfo?.id) {
        const prof = await getUserProfile(Number(userInfo.id));
        if (prof) {
          setUserProfile(prof);
          profileForm.setFieldsValue({
            name: prof.name,
            email: prof.email,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load settings data", err);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id, profileForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateProfile = async (values: any) => {
    if (!userInfo?.id) return;
    try {
      setLoading(true);
      await updateUserProfile({
        userID: Number(userInfo.id),
        name: values.name,
        email: values.email,
      });
      message.success("Profile details updated successfully!");
      await loadData();
    } catch {
      message.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = (values: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fintrack_pref_currency", values.currency || "BRL");
      localStorage.setItem("fintrack_pref_due_day", String(values.fiscalStartDay || 1));
      localStorage.setItem("fintrack_pref_selic", String(values.selicRate || 10.5));
    }
    message.success("Preferências financeiras salvas com sucesso!");
  };

  const handleSaveCategory = async (values: any) => {
    try {
      setLoading(true);
      if (editingCategory) {
        await updateCategory(editingCategory.categoryID, {
          name: values.name,
          colorHex: values.colorHex,
          icon: values.icon,
        });
        message.success("Categoria atualizada com sucesso!");
      } else {
        await createCategory({
          name: values.name,
          colorHex: values.colorHex || "#58a6ff",
          icon: values.icon || "tag",
        });
        message.success("Categoria criada com sucesso!");
      }
      setIsCatModalOpen(false);
      catForm.resetFields();
      setEditingCategory(null);
      await loadData();
    } catch {
      message.error("Não foi possível salvar a categoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      setLoading(true);
      await deleteCategory(id);
      message.success("Categoria excluída com sucesso!");
      await loadData();
    } catch {
      message.error("Não foi possível excluir a categoria (ela pode estar em uso por transações).");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await seedDefaultCategories();
      message.success("Categorias padrão restauradas com sucesso!");
      await loadData();
    } catch {
      message.error("Não foi possível restaurar as categorias padrão.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      message.loading({ content: "Gerando backup financeiro...", key: "export" });
      const uid = userInfo?.id ? Number(userInfo.id) : undefined;
      const [investments, debts, receivables, goals] = await Promise.all([
        getPortfolioSummary(uid),
        getDebtSummary(uid),
        getReceivablesSummary(uid),
        getGoalsSummary(uid),
      ]);

      const exportObject = {
        exportedAt: new Date().toISOString(),
        user: { id: userInfo?.id, name: userInfo?.name, email: userInfo?.email },
        investments,
        debts,
        receivables,
        goals,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `FinTrack_Backup_${dayjs().format("YYYYMMDD_HHmm")}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      message.success({ content: "Backup financeiro exportado com sucesso!", key: "export" });
    } catch {
      message.error({ content: "Não foi possível exportar os dados.", key: "export" });
    }
  };

  return (
    <ConfigProvider theme={FINTRACK_THEME} locale={FINTRACK_LOCALE}>
      <Layout className={styles.layout}>
        <Sidebar
          collapsed={collapsed}
          selectedKey={selectedKey}
          onSelectKey={(key) => setSelectedKey(key)}
        />
        <Layout className={styles.mainLayout}>
          <Header
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
          <Content className={styles.content}>
            <div className={styles.pageHeader}>
              <div>
                <h2>Configurações do Sistema</h2>
                <p>Gerencie seu perfil, preferências monetárias, categorias de despesas e exportação de dados.</p>
              </div>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className={styles.settingsTabs}
              items={[
                {
                  key: "profile",
                  label: (
                    <span>
                      <UserOutlined /> Perfil & Conta
                    </span>
                  ),
                  children: (
                    <Row gutter={24}>
                      <Col xs={24} md={14}>
                        <Card className={styles.settingsCard}>
                          <div className={styles.cardSectionTitle}>
                            <UserOutlined /> Informações do Perfil
                          </div>
                          <Form
                            form={profileForm}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                          >
                            <Form.Item
                              name="name"
                              label="Nome Completo"
                              rules={[{ required: true, message: "Por favor, insira seu nome" }]}
                              extra="Você pode atualizar seu nome de exibição a qualquer momento."
                            >
                              <Input prefix={<UserOutlined />} placeholder="Seu nome completo" />
                            </Form.Item>

                            <Form.Item
                              name="email"
                              label="Endereço de E-mail (Vinculado ao OAuth)"
                              extra="O e-mail é gerenciado pelo provedor de autenticação (OAuth)."
                            >
                              <Input disabled style={{ opacity: 0.7, cursor: "not-allowed" }} />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                Salvar Perfil
                              </Button>
                            </Form.Item>
                          </Form>
                        </Card>
                      </Col>

                      <Col xs={24} md={10}>
                        <Card className={styles.settingsCard}>
                          <div className={styles.cardSectionTitle}>
                            <SafetyOutlined /> Visão Geral da Conta
                          </div>
                          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <Avatar size={54} icon={<UserOutlined />} style={{ backgroundColor: "#10b981" }} />
                              <div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{userProfile?.name || userInfo?.name}</div>
                                <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{userProfile?.email || userInfo?.email}</div>
                              </div>
                            </div>
                            <Divider style={{ margin: "12px 0", borderColor: "var(--border-subtle)" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                              <span style={{ color: "#94a3b8" }}>ID do Usuário:</span>
                              <span style={{ fontWeight: 600 }}>#{userInfo?.id || 1}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                              <span style={{ color: "#94a3b8" }}>Status da Conta:</span>
                              <Tag color="success">Ativo / Padrão</Tag>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: "preferences",
                  label: (
                    <span>
                      <SettingOutlined /> Preferências Financeiras
                    </span>
                  ),
                  children: (
                    <Card className={styles.settingsCard} style={{ maxWidth: 700 }}>
                      <div className={styles.cardSectionTitle}>
                        <GlobalOutlined /> Padrões do Sistema e Moeda
                      </div>
                      <Form
                        form={prefForm}
                        layout="vertical"
                        onFinish={handleSavePreferences}
                        initialValues={{
                          currency: "BRL",
                          fiscalStartDay: 1,
                          selicRate: 10.5,
                        }}
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item name="currency" label="Moeda Padrão">
                              <Select>
                                <Option value="BRL">BRL - Real Brasileiro (R$)</Option>
                                <Option value="USD">USD - Dólar Americano ($)</Option>
                                <Option value="EUR">EUR - Euro (€)</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="fiscalStartDay" label="Dia de Início do Ciclo Mensal">
                              <Select>
                                <Option value={1}>Dia 1º de cada mês</Option>
                                <Option value={5}>Dia 5 de cada mês (Pagamento / Salário)</Option>
                                <Option value={10}>Dia 10 de cada mês</Option>
                                <Option value={15}>Dia 15 de cada mês</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              name="selicRate"
                              label="Taxa de Referência Padrão (Selic / CDI %)"
                              tooltip="Utilizada para projeções de rendimento de renda fixa"
                            >
                              <Input suffix="%" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                            Salvar Preferências
                          </Button>
                        </Form.Item>
                      </Form>
                    </Card>
                  ),
                },
                {
                  key: "categories",
                  label: (
                    <span>
                      <AppstoreOutlined /> Categorias ({categories.length})
                    </span>
                  ),
                  children: (
                    <Card className={styles.settingsCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div className={styles.cardSectionTitle} style={{ margin: 0 }}>
                          <AppstoreOutlined /> Categorias de Transações e Despesas
                        </div>
                        <Space>
                          <Button icon={<ReloadOutlined />} onClick={handleSeedDefaults}>
                            Restaurar Padrões
                          </Button>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setEditingCategory(null);
                              catForm.resetFields();
                              catForm.setFieldsValue({ colorHex: "#58a6ff" });
                              setIsCatModalOpen(true);
                            }}
                          >
                            Nova Categoria
                          </Button>
                        </Space>
                      </div>

                      <div className={styles.categoriesGrid}>
                        {categories.map((cat) => (
                          <div key={cat.categoryID} className={styles.categoryCard}>
                            <div className={styles.catInfo}>
                              <div
                                className={styles.colorBadge}
                                style={{ backgroundColor: cat.colorHex || "#58a6ff" }}
                              />
                              <span className={styles.catName}>{cat.name}</span>
                            </div>
                            <Space size="small">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingCategory(cat);
                                  catForm.setFieldsValue({
                                    name: cat.name,
                                    colorHex: cat.colorHex || "#58a6ff",
                                    icon: cat.icon,
                                  });
                                  setIsCatModalOpen(true);
                                }}
                              />
                              <Popconfirm
                                title="Excluir categoria?"
                                description="Tem certeza de que deseja remover esta categoria?"
                                onConfirm={() => handleDeleteCategory(cat.categoryID)}
                                okText="Sim, Excluir"
                                cancelText="Cancelar"
                              >
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ),
                },
                {
                  key: "notifications",
                  label: (
                    <span>
                      <BellOutlined /> Alertas & Notificações
                    </span>
                  ),
                  children: (
                    <Card className={styles.settingsCard} style={{ maxWidth: 700 }}>
                      <div className={styles.cardSectionTitle}>
                        <BellOutlined /> Preferências de Notificação
                      </div>
                      <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Alertas de Vencimento de Despesas</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Notificar 3 dias antes do vencimento de faturas e boletos</div>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Lembretes de Pagamento de Dívidas</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Lembretes de parcelas de empréstimos e financiamentos</div>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Acompanhamento de Rateios</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Lembretes de cobranças pendentes de despesas compartilhadas</div>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Notificações de Ritmo de Metas</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Alertar quando os gastos mensais ultrapassarem o teto planejado</div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </Space>
                    </Card>
                  ),
                },
                {
                  key: "export",
                  label: (
                    <span>
                      <DownloadOutlined /> Dados & Privacidade
                    </span>
                  ),
                  children: (
                    <Space direction="vertical" size="large" style={{ width: "100%", maxWidth: 700 }}>
                      <Card className={styles.settingsCard}>
                        <div className={styles.cardSectionTitle}>
                          <DownloadOutlined /> Exportação de Backup Financeiro
                        </div>
                        <p style={{ color: "var(--text-secondary)" }}>
                          Baixe um backup completo em JSON contendo todos os seus registros: investimentos, dívidas, rateios a receber, despesas e metas financeiras.
                        </p>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={handleExportData}
                        >
                          Exportar Backup Completo (JSON)
                        </Button>
                      </Card>

                      <Card className={styles.dangerCard}>
                        <div className={styles.dangerTitle}>
                          <WarningOutlined /> Zona de Perigo
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                          Ações irreversíveis relacionadas à sua conta e aos seus dados financeiros armazenados.
                        </p>
                        <Space>
                          <Popconfirm
                            title="Limpar todos os registros de exemplo?"
                            description="Isso removerá seus registros em todos os módulos."
                            okText="Sim, Limpar"
                            cancelText="Cancelar"
                            okButtonProps={{ danger: true }}
                          >
                            <Button danger>Redefinir Registros Financeiros</Button>
                          </Popconfirm>
                        </Space>
                      </Card>
                    </Space>
                  ),
                },
              ]}
            />

            {/* Category Create/Edit Modal */}
            <Modal
              title={editingCategory ? "Editar Categoria" : "Nova Categoria"}
              open={isCatModalOpen}
              onCancel={() => setIsCatModalOpen(false)}
              footer={null}
            >
              <Form form={catForm} layout="vertical" onFinish={handleSaveCategory}>
                <Form.Item
                  name="name"
                  label="Nome da Categoria"
                  rules={[{ required: true, message: "Insira o nome da categoria" }]}
                >
                  <Input placeholder="Ex: Supermercado, Lazer, Assinaturas, Transporte" />
                </Form.Item>

                <Form.Item name="colorHex" label="Cor de Identificação">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PRESET_COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => catForm.setFieldsValue({ colorHex: c })}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: c,
                          cursor: "pointer",
                          border: catForm.getFieldValue("colorHex") === c ? "2px solid #fff" : "1px solid var(--border-subtle)",
                        }}
                      />
                    ))}
                  </div>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                  <Space>
                    <Button onClick={() => setIsCatModalOpen(false)}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Salvar Categoria
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
