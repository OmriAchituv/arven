import type { Metadata, Viewport } from "next";
import { Assistant, Playfair_Display } from "next/font/google";

import "./globals.css";

/**
 * Hebrew UI face. Appendix A30 asks for a modern Hebrew sans with strong screen
 * rendering and excellent numerals; A31 rules out anything evoking government,
 * newspapers or religious publishing — which is why this is not Frank Ruhl Libre,
 * the classic Hebrew newspaper serif.
 */
const ui = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-ui",
  display: "swap",
});

/**
 * Latin only, and only for the wordmark. Appendix A1 keeps ARVEN in Latin, so
 * no Hebrew serif is needed anywhere in the product.
 */
const wordmark = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-wordmark",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARVEN",
  description: "הבריאות שלך. מובנת.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ARVEN" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F4F1" },
    { media: "(prefers-color-scheme: dark)", color: "#131614" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${ui.variable} ${wordmark.variable}`}>
      <body>{children}</body>
    </html>
  );
}
