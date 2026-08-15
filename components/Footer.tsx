// components/Footer.tsx
import Link from "next/link";

const CATEGORIES = [
  { name: "Marketing", href: "/category/marketing" },
  { name: "Productivity", href: "/category/productivity" },
  { name: "Chatbot", href: "/category/chatbot" },
  { name: "Coding", href: "/category/coding" },
  { name: "Image", href: "/category/image" },
  { name: "Writing", href: "/category/writing" },
  { name: "Audio", href: "/category/audio" },
  { name: "Video", href: "/category/video" },
];

const PLATFORM_LINKS = [
  { name: "Directory Home", href: "/" },
  { name: "Compare Matrix", href: "/compare" },
  { name: "AI Decision Matcher", href: "/find" },
  { name: "My Saved Vault", href: "/vault" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-950">
              AI Vault<span className="text-blue-600">.</span>
            </Link>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-500">
              AI Vault is an authoritative directory and intelligence engine evaluating verified artificial intelligence software. Filter, compare, and benchmark 745+ AI platforms across productivity, coding, and marketing.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-700">745+ Verified Tools Indexed</span>
            </div>
          </div>

          {/* Navigation Hub */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              Intelligence Hub
            </h3>
            <ul className="mt-3 space-y-2 text-xs font-semibold">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-600 transition hover:text-blue-600">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories Hub */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              Browse Categories
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 text-xs font-semibold">
              {CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link href={cat.href} className="text-slate-600 transition hover:text-blue-600">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-[11px] text-slate-400 sm:flex-row">
          <p>© 2026 AI Vault. All rights reserved.</p>
          <div className="flex gap-4 font-semibold">
            <Link href="/sitemap.xml" className="hover:text-blue-600">
              Sitemap.xml
            </Link>
            <Link href="/compare" className="hover:text-blue-600">
              Compare Tools
            </Link>
            <Link href="/find" className="hover:text-blue-600">
              Tool Matcher
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
