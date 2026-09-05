"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import { FINTRACK_THEME } from "../lib/theme";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const content = (
    <ConfigProvider locale={ptBR} theme={FINTRACK_THEME}>
      {children}
    </ConfigProvider>
  );

  if (!googleClientId) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {content}
    </GoogleOAuthProvider>
  );
}
