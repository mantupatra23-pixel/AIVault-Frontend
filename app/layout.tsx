import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.aivault.pp.ua";

const SITE_NAME = "AI Vault";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "AI Vault — Discover the World's Best AI Software",
    template: "%s | AI Vault",
  },

  description:
    "Discover, compare, and explore 740+ verified AI tools, developer utilities, and SaaS platforms.",

  applicationName: SITE_NAME,

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

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: "AI Vault — Discover the World's Best AI Software",
    description:
      "Discover, compare, and explore 740+ verified AI tools.",
    url: SITE_URL,
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Vault — Discover the World's Best AI Software",
    description:
      "Discover, compare, and explore 740+ verified AI tools.",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
