import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AIVault — Discover the Best AI Tools",
    template: "%s | AIVault",
  },
  description:
    "Discover, compare and explore the best AI tools, software and services in one AI directory.",
  keywords: [
    "AI tools",
    "Artificial Intelligence",
    "AI directory",
    "Machine Learning",
    "AI software",
    "AIVault",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "AIVault — Discover the Best AI Tools",
    description:
      "Discover, compare and explore the best AI tools, software and services in one AI directory.",
    url: SITE_URL,
    siteName: "AIVault",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIVault — Discover the Best AI Tools",
    description:
      "Discover, compare and explore the best AI tools, software and services in one AI directory.",
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
