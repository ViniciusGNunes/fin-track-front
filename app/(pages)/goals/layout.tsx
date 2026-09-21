import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metas",
  description: "Defina e acompanhe objetivos e marcos financeiros.",
};

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
