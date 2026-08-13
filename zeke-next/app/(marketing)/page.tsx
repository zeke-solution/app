import { Hero } from "@/components/marketing/Hero";
import { LandingSections } from "@/components/marketing/LandingSections";
import { CtaBanner } from "@/components/marketing/CtaBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  INSTAGRAM_URL,
  LOGO_PATH,
  SITE_NAME,
  SITE_URL,
  TAGLINE,
  absoluteUrl,
  createPageMetadata,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      slogan: TAGLINE,
      description: DEFAULT_DESCRIPTION,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(LOGO_PATH),
        contentUrl: absoluteUrl(LOGO_PATH),
        width: 512,
        height: 512,
      },
      email: "hello@zeke.global",
      telephone: "+971523542485",
      sameAs: [INSTAGRAM_URL],
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <JsonLd data={homeStructuredData} />
      <div>
        <Hero />
        <LandingSections />
        <CtaBanner />
      </div>
    </>
  );
}
