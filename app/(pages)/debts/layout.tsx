import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dívidas",
  description: "Gestão e simulação de amortização e liquidação de dívidas.",
};

export default function DebtsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
