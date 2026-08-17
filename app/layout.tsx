// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Vault — AI Intelligence Directory & Decision Engine",
  description:
    "Search, compare, and explore verified AI software platforms across productivity, coding, marketing, and creative industries.",
  metadataBase: new URL("https://aivault.pp.ua"),
  other: {
    "google-adsense-account": "ca-pub-518587791488826",
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
          content="ca-pub-518587791488826"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-518587791488826"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-screen flex-col justify-between bg-[#fafbfc] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <div className="flex-grow">{children}</div>
        <Footer />

        {/* 1. Skimlinks Auto-Monetization Script */}
        <Script
          src="https://s.skimresources.com/js/307724X1796016.skimlinks.js"
          strategy="afterInteractive"
        />

        {/* 2. Sovrn Commerce (VigLink) Auto-Monetization Script */}
        <Script id="sovrn-commerce" strategy="afterInteractive">
          {`
            var vglnk = {key: '000659666eee344dbb89f9241a1aed7f'};
            (function(d, t) {
              var s = d.createElement(t);
              s.type = 'text/javascript'; s.async = true;
              s.src = '//cdn.viglink.com/api/vglnk.js';
              var r = d.getElementsByTagName(t)[0];
              r.parentNode.insertBefore(s, r);
            }(document, 'script'));
          `}
        </Script>
      </body>
    </html>
  );
}
