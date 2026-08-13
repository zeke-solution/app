import type { Metadata } from "next";

export const SITE_NAME = "Zeke";
export const SITE_URL = "https://zekesolution.com";
export const TAGLINE = "Create. Collaborate. Get paid.";
export const DEFAULT_TITLE = `${SITE_NAME} | ${TAGLINE}`;
export const DEFAULT_DESCRIPTION =
  "Create. Collaborate. Get paid. Zeke helps creators and brands structure deals, record deliverables, and manage payments with creator-controlled support.";
export const SOCIAL_IMAGE_PATH = "/images/zeke-social-share.png";
export const LOGO_PATH = "/images/zeke-logo-square.png";
export const INSTAGRAM_URL = "https://www.instagram.com/zeke.global/";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
