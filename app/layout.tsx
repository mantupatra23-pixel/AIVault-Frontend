import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AIVault | The World's Smartest AI Directory",
  description: "Discover, compare, and leverage 1000+ AI tools curated by Mantu Patra. Build the future with the best AI ecosystem.",
  keywords: "AI tools, AI directory, Best AI 2026, Mantu Patra, AI Vault, SaaS tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#fcfcfc]`}>
        {/* GLOBAL NAVIGATION / LOGO BAR */}
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-[100]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              {/* Premium SVG Logo */}
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:rotate-12 transition-transform duration-300">
                <rect width="100" height="100" rx="20" fill="#2563EB"/>
                <path d="M30 70V30L50 50L70 30V70" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-2xl font-black tracking-tighter text-gray-900 group-hover:text-blue-600 transition-colors">
                AI<span className="text-blue-600">Vault</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              <Link href="/" className="hover:text-blue-600 transition-colors">Directory</Link>
              <span className="text-gray-200">|</span>
              <span className="text-gray-900 italic">By Mantu Patra</span>
            </div>
          </div>
        </nav>

        {children}

        {/* Global Footer */}
        <footer className="bg-white border-t border-gray-100 py-20 mt-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
             <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-4">
               AIVault Infrastructure • Bharat 2026
             </div>
             <p className="text-sm text-gray-400 font-medium">Built to empower 10Cr+ creators with Artificial Intelligence.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
