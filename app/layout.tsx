import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AIVault - The Smartest AI Tools Directory",
  description: "Discover, compare and master the best AI tools in 2026. Automated reviews powered by AI.",
  // ✅ GOOGLE VERIFICATION ID YAHAN HAI
  verification: {
    google: "5pWbW0oMklroG1SOUP3ZO2TcOuhyiNOwDb4pduL-Ae4",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
