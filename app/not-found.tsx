import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f8fc] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
          🔎
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-950">
          Tool Not Found
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          We couldn't find a tool matching this canonical URL.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to AI Directory
          </Link>

          <Link
            href="/ai-finder"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
          >
            Find an AI Tool
          </Link>
        </div>
      </div>
    </main>
  );
}
