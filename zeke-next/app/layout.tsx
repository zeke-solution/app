import type { Metadata } from "next";
import localFont from "next/font/local";
import logoMark from "@/public/images/zeke-logo-mark.png";
import "./globals.css";

const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter-loaded",
  display: "swap",
  preload: true,
  weight: "100 900",
  style: "normal",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

const sora = localFont({
  src: "../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
  variable: "--font-sora-loaded",
  display: "swap",
  preload: true,
  weight: "100 800",
  style: "normal",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "Zeke - Your Perfect PR Partner",
  description:
    "Zeke connects creators and brands through structured deals, clear records, and creator-controlled Shield support.",
  icons: { icon: logoMark.src },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-dark text-light font-sans">
        {children}
      </body>
    </html>
  );
}
