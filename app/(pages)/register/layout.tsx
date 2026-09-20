import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastrar",
  description: "Crie sua conta no FinTrack.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
