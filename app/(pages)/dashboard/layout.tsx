import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visão Geral",
  description: "Painel consolidado de inteligência financeira e indicadores-chave.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
