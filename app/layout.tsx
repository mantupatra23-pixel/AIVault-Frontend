import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aivault.pp.ua";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AIVault — Discover the Best AI Tools",
    template: "%s | AIVault",
  },
  description: "Discover, compare and explore the best AI tools, software and services in one AI directory.",
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
