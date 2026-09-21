import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendário",
  description: "Visão cronológica de vencimentos, despesas e fluxos futuros.",
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
