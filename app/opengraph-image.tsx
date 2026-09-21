import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "FinTrack - Gestão e Inteligência Financeira";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #090d16 0%, #111827 50%, #064e3b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            fontSize: 52,
            fontWeight: 800,
            color: "#ffffff",
            boxShadow: "0 0 40px rgba(16, 185, 129, 0.4)",
            marginBottom: 32,
          }}
        >
          F
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textAlign: "center",
            marginBottom: 16,
            color: "#f8fafc",
          }}
        >
          FinTrack
        </div>

        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Gestão e Inteligência Financeira: Investimentos, Dívidas, Despesas e Metas.
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Investimentos Multi-Moeda", "Amortização de Dívidas", "Rateio de Contas"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "#10b981",
                  padding: "8px 20px",
                  borderRadius: 999,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
