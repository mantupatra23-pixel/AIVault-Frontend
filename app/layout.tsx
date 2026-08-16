// app/layout.tsx
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Vault — AI Intelligence Directory & Decision Engine",
  description:
    "Search, compare, and explore 750+ verified AI software platforms across productivity, coding, marketing, and creative industries.",
  metadataBase: new URL("https://aivault.pp.ua"),
  other: {
    "google-adsense-account": "ca-pub-5180387791450326",
  },
  icons: {
    icon: [{ url: "/logo.png" }, { url: "/favicon.ico" }],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-5180387791450326"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5180387791450326"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-screen flex-col justify-between bg-[#fafbfc] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <div className="flex-grow">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
