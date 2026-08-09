import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeke - Your Perfect PR Partner",
  description:
    "Zeke connects creators and brands through structured deals, clear records, and creator-controlled Shield support.",
  icons: { icon: "/images/zeke-logo-mark.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-dark text-light font-sans">
        {children}
      </body>
    </html>
  );
}
