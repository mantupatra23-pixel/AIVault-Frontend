import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aivault.pp.ua"),
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
    canonical: "https://aivault.pp.ua",
  },
  openGraph: {
    title: "AIVault — Discover the Best AI Tools",
    description:
      "Discover, compare and explore the best AI tools, software and services in one AI directory.",
    url: "https://aivault.pp.ua",
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
    // PRESERVED: Keeping existing Google Search Console verification token intact
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
