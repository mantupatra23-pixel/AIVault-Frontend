import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { SITE_URL } from "@/lib/site-url";
import TrafficTrackerProvider from "@/components/traffic-tracker-provider";

const SITE_NAME = "AI Vault";

const DEFAULT_DESCRIPTION =
  "Discover, compare, and explore 740+ verified AI tools, developer utilities, and SaaS platforms.";

const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "AI Vault — Discover the World's Best AI Software",
    template: "%s | AI Vault",
  },

  description: DEFAULT_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "AI tools",
    "best AI tools",
    "AI software",
    "AI SaaS",
    "artificial intelligence tools",
    "AI tool directory",
    "AI tools directory",
    "AI software directory",
    "AI directory",
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
    "developer AI tools",
    "business AI tools",
  ],

  authors: [
    {
      name: SITE_NAME,
      url: SITE_URL,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  category: "technology",

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

    title: "AI Vault — Discover the World's Best AI Software",

    description: DEFAULT_DESCRIPTION,

    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "AI Vault — Discover the World's Best AI Software",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "AI Vault — Discover the World's Best AI Software",

    description: DEFAULT_DESCRIPTION,

    images: [OG_IMAGE],
  },

  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      undefined,

    other: {
      "google-site-verification":
        process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
        "",
    },
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
      <head>
        <meta
          name="robots"
          content="index, follow"
        />

        <meta
          name="googlebot"
          content="index, follow, max-image-preview:large, max-video-preview:-1, max-snippet:-1"
        />

        <meta
          name="theme-color"
          content="#ffffff"
        />

        <link
          rel="icon"
          href="/favicon.ico"
        />

        <link
          rel="canonical"
          href={SITE_URL}
        />
      </head>

      <body>
        {/* Global traffic tracking */}
        <TrafficTrackerProvider />

        {/* Existing application */}
        {children}
      </body>
    </html>
  );
}
