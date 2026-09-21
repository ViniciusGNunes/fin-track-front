import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["antd", "@ant-design/icons", "dayjs"],
  },
};

export default nextConfig;

