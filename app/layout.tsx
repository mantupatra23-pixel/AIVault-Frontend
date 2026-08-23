import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aivault.pp.ua"),
  title: "AI Vault — AI Intelligence Directory & Decision Engine",
  description:
    "Search, compare, and explore 830+ verified AI software platforms across productivity, coding, marketing, and creative industries.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: ["/icon.png"],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/logo.png" },
    ],
  },
  openGraph: {
    title: "AI Vault — AI Intelligence Engine",
    description:
      "Search & compare 830+ verified AI tools across productivity, coding, and marketing.",
    url: "https://www.aivault.pp.ua",
    siteName: "AI Vault",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "AI Vault Brand Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  other: {
    "google-adsense-account": "ca-pub-518587791488826",
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
      <body className="flex min-h-screen flex-col justify-between bg-[#0a0a0c] text-slate-100 antialiased selection:bg-[#00FF66] selection:text-black">
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
