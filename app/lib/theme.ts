import { ThemeConfig, theme } from "antd";

export const FINTRACK_THEME: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#10b981", // Emerald Fintech Primary
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b", // Warm Amber
    colorError: "#f43f5e",   // Rose Red
    colorInfo: "#38bdf8",    // Sky Blue
    colorBgBase: "#090d16",  // Canvas background
    colorBgContainer: "#111827", // Card surface
    colorBgElevated: "#182234",  // Modal & dropdown surface
    colorBgLayout: "#090d16",
    colorBorder: "#243042",      // Crisp border
    colorBorderSecondary: "#1e293b",
    colorText: "#f8fafc",
    colorTextSecondary: "#94a3b8",
    borderRadius: 8,
    fontFamily:
      "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      colorPrimary: "#10b981",
      controlHeight: 36,
      borderRadius: 6,
      fontWeight: 500,
    },
    Card: {
      colorBgContainer: "#111827",
      colorBorderSecondary: "#1e293b",
      paddingLG: 20,
    },
    Table: {
      colorBgContainer: "#111827",
      headerBg: "#0f172a",
      borderColor: "#1e293b",
      headerColor: "#94a3b8",
      rowHoverBg: "rgba(255, 255, 255, 0.02)",
    },
    Modal: {
      contentBg: "#111827",
      headerBg: "#111827",
    },
    Segmented: {
      trackBg: "#0f172a",
      itemSelectedBg: "#1e293b",
      itemSelectedColor: "#f8fafc",
    },
    Input: {
      colorBgContainer: "#0f172a",
      colorBorder: "#26354a",
    },
    Select: {
      colorBgContainer: "#0f172a",
      colorBorder: "#26354a",
    },
    DatePicker: {
      colorBgContainer: "#0f172a",
      colorBorder: "#26354a",
    },
  },
};
