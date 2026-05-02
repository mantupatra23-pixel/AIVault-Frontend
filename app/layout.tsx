import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. GLOBAL SEO: Ye metadata poori site ke liye kaam karega
export const metadata: Metadata = {
  title: "Visora AI | World's Smartest AI Directory",
  description: "Explore 100+ verified AI tools curated for the global creative economy. Made in Bharat.",
  keywords: "AI Directory, Best AI Tools 2026, Mantu Patra, Visora AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#fcfcfc] antialiased`}>
        {/* NOTE: Humne yahan se purana <nav> aur <footer> hata diya hai. 
            Ab header aur footer seedha page.tsx se control honge.
            Isse Double Header ka issue 100% khatam ho jayega.
        */}
        
        <main>
          {children}
        </main>

        {/* Agar aapko poori site par common footer chahiye 
            toh yahan add kar sakte hain, par abhi ke liye 
            layout ko clean rakhna hi best hai.
        */}
      </body>
    </html>
  );
}
