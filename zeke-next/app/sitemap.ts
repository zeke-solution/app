import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const LAST_SIGNIFICANT_UPDATE = new Date("2026-08-13T00:00:00+04:00");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/shield`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
