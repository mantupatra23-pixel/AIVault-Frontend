import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

// SEO Metadata: Google AdSense aur Ranking ke liye sabse zaroori
export const metadata: Metadata = {
  title: "AIVault | The Smartest AI Tool Directory by Mantu Patra",
  description: "Explore 1000+ AI tools curated for creators and developers. Find the best AI solutions for Video, Coding, and Writing.",
  keywords: "AI Directory, Best AI Tools 2026, Mantu Patra, AIVault, Artificial Intelligence Tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#fcfcfc] text-gray-900 antialiased`}>
        
        {/* PREMIUM STICKY NAVIGATION */}
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-[100]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              {/* Minimalist Tech Logo */}
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:rotate-12 transition-transform duration-300">
                <rect width="100" height="100" rx="22" fill="#2563EB"/>
                <path d="M30 70V30L50 50L70 30V70" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-2xl font-black tracking-tighter text-gray-900 group-hover:text-blue-600 transition-colors">
                AI<span className="text-blue-600">Vault</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              <Link href="/" className="hover:text-blue-600 transition-colors">Directory</Link>
              <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
              <span className="text-gray-900 italic font-bold">By Mantu Patra</span>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main>{children}</main>

        {/* PREMIUM GLOBAL FOOTER */}
        <footer className="bg-white border-t border-gray-100 py-24 mt-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-12">
              
              {/* Footer Brand Section */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                   <div className="w-6 h-6 bg-blue-600 rounded-md"></div>
                   <span className="text-xl font-black tracking-tighter">AIVault<span className="text-blue-600">.</span></span>
                </div>
                <p className="text-gray-400 text-sm max-w-xs font-medium leading-relaxed">
                  Empowering 10Cr+ creators with the world's most advanced AI tool directory.
                </p>
              </div>

              {/* Legal & Navigation Links (Very Important for AdSense) */}
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                <div className="flex flex-col gap-4 text-center md:text-left">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Platform</span>
                  <Link href="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Directory</Link>
                  <Link href="/about" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Mission</Link>
                </div>
                
                <div className="flex flex-col gap-4 text-center md:text-left">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Legal</span>
                  <Link href="/privacy" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Privacy Policy</Link>
                  <Link href="/contact" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Terms of Use</Link>
                </div>

                <div className="flex flex-col gap-4 text-center md:text-left">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Support</span>
                  <Link href="/contact" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Contact Us</Link>
                  <a href="mailto:support@aivault.app" className="text-sm font-bold text-blue-600">Business Inquiry</a>
                </div>
              </div>
            </div>

            {/* Bottom Credit */}
            <div className="mt-24 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
                © 2026 AI VAULT ENGINE • BHARAT
              </div>
              <div className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">
                Optimized for High-Speed Global Traffic
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
