import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "./globals.css";

// Same inline SVG favicon ("z" on a rounded dark square) as every legacy
// HTML page's <link rel="icon">.
const FAVICON_SVG =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230D0B16'/><text y='.9em' font-size='80' x='10' fill='white'>z</text></svg>";

export const metadata: Metadata = {
  title: "Zeke - Your Perfect PR Partner",
  description:
    "Zeke connects content creators with brands through structured, legally protected deals.",
  icons: { icon: FAVICON_SVG },
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
