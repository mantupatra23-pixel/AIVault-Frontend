import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 – Tool Not Found | AI Vault",
  description: "The requested AI tool could not be found in the AI Vault directory.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <span className="text-6xl font-black text-blue-600 font-serif">404</span>
        <h1 className="text-3xl font-bold tracking-tight">AI Asset Not Found</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          The requested tool specification or slug does not exist in our verified database index.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-full transition shadow-md"
          >
            ← Return to AI Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
