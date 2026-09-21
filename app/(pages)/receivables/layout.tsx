import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A Receber",
  description: "Controle de rateios e despesas compartilhadas a receber.",
};

export default function ReceivablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
