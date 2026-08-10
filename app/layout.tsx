import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AI Vault — Discover the Best AI Tools & Software",
    template: "%s | AI Vault",
  },
  description:
    "Discover, compare and explore 740+ AI tools across Chatbots, Image Generation, Video, Coding, Marketing and Productivity. Find the right AI software faster with AI Vault.",
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
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "AI Vault — Discover the Best AI Tools & Software",
    description:
      "Discover, compare and explore 740+ AI tools across Chatbots, Image Generation, Video, Coding, Marketing and Productivity.",
    url: SITE_URL,
    siteName: "AI Vault",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AI Vault Directory Logo and Hero Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Vault — Discover the Best AI Tools & Software",
    description:
      "Discover, compare and explore 740+ AI tools across Chatbots, Image Generation, Video, Coding, Marketing and Productivity.",
    images: [`${SITE_URL}/og-image.png`],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
