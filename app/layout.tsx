// app/layout.tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://aivault.pp.ua";

const SITE_NAME = "AI Vault";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "AI Vault — Discover, Compare & Scale with Verified AI Tools",
    template: "%s | AI Vault",
  },

  description:
    "Comprehensive software directory and benchmarking matrix for artificial intelligence tools, SaaS platforms, and workflow automation.",

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
    description: "Discover, compare, and explore 750+ verified AI tools and software platforms.",
    url: SITE_URL,
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Vault — Discover the World's Best AI Software",
    description: "Discover, compare, and explore 750+ verified AI tools and software platforms.",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050714",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.className} min-h-screen bg-[#050714] text-slate-100 antialiased flex flex-col justify-between selection:bg-blue-600 selection:text-white`}
      >
        <div className="flex-grow">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
