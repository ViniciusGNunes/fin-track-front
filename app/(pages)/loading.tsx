import React from "react";
import { Spin } from "antd";

export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-canvas, #090d16)",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 700,
          color: "#fff",
          boxShadow: "0 0 24px rgba(16, 185, 129, 0.4)",
        }}
      >
        F
      </div>
      <Spin size="large" />
      <span
        style={{
          color: "var(--text-secondary, #94a3b8)",
          fontSize: "0.95rem",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        Carregando painel...
      </span>
    </div>
  );
}
