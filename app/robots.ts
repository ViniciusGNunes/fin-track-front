import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fintrack.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/investments",
          "/expenses",
          "/debts",
          "/receivables",
          "/goals",
          "/calendar",
          "/settings",
          "/oauth/",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
