import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { SITE_URL } from "@/lib/site-url";

const SITE_NAME = "AI Vault";

const DEFAULT_DESCRIPTION =
  "Discover, compare and explore 740+ AI tools, software, developer utilities, productivity apps, creative tools and SaaS platforms.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "AI Vault — Discover the Best AI Tools",
    template: "%s | AI Vault",
  },

  description: DEFAULT_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "AI tools",
    "best AI tools",
    "AI software",
    "artificial intelligence tools",
    "AI tool directory",
    "AI tools directory",
    "ChatGPT alternatives",
    "AI productivity tools",
    "AI coding tools",
    "AI image generators",
    "AI video generators",
    "AI marketing tools",
    "AI writing tools",
    "AI automation tools",
    "AI agents",
    "AI SaaS",
  ],

  authors: [
    {
      name: "AI Vault",
      url: SITE_URL,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,

    url: SITE_URL,

    title: "AI Vault — Discover the Best AI Tools",

    description: DEFAULT_DESCRIPTION,

    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AI Vault — Discover the Best AI Tools",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "AI Vault — Discover the Best AI Tools",

    description: DEFAULT_DESCRIPTION,

    images: [`${SITE_URL}/og-image.png`],
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },

  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
