import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Preferências de perfil, categorias e dados da conta.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
