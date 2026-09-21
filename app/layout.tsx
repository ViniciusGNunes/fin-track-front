import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fintrack.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FinTrack - Gestão e Inteligência Financeira",
    template: "%s | FinTrack",
  },
  description:
    "Consolide investimentos, amortização de dívidas, despesas compartilhadas e fluxo de caixa em um único painel.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "FinTrack - Gestão e Inteligência Financeira",
    description:
      "Consolide investimentos, amortização de dívidas, despesas compartilhadas e fluxo de caixa em um único painel.",
    url: siteUrl,
    siteName: "FinTrack",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinTrack - Gestão e Inteligência Financeira",
    description:
      "Consolide investimentos, amortização de dívidas, despesas compartilhadas e fluxo de caixa em um único painel.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FinTrack",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
  },
  description:
    "Consolide investimentos, amortização de dívidas, despesas compartilhadas e fluxo de caixa em um único painel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
