import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Despesas",
  description: "Acompanhe e categorize suas saídas, faturas e contas recorrentes.",
};

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
