import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/mypage/", "/api/", "/dashboard/"],
      },
    ],
    sitemap: "https://denshi-kessan-koukoku.com/sitemap.xml",
  };
}
