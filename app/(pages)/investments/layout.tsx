import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investimentos",
  description: "Gestão patrimonial de renda fixa, variável, moedas e caixa livre.",
};

export default function InvestmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
