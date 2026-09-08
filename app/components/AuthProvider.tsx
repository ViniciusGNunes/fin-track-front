"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import { FINTRACK_THEME } from "../lib/theme";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  React.useEffect(() => {
    // Intercept input on number / decimal fields to transparently support both comma and dot
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (
        target &&
        (target.classList.contains("ant-input-number-input") ||
          target.type === "number" ||
          target.getAttribute("role") === "spinbutton")
      ) {
        if (target.value && target.value.includes(",")) {
          // Ant Design InputNumber works best with dot for its internal value representation
          // but users in pt-BR locale frequently type comma
          const curPos = target.selectionStart;
          const oldVal = target.value;
          const newVal = target.value.replace(",", ".");
          if (oldVal !== newVal) {
            target.value = newVal;
            if (curPos !== null) {
              target.setSelectionRange(curPos, curPos);
            }
            // Dispatch input event so React / AntD form state syncs immediately
            target.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      }
    };

    window.addEventListener("input", handleInput, true);
    return () => {
      window.removeEventListener("input", handleInput, true);
    };
  }, []);

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
