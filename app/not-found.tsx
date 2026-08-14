import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          🔎
        </div>

        <h1 className="mt-6 text-3xl font-black">
          Tool Not Found
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          We could not find a tool matching this
          canonical URL.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to AI Directory
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
          >
            Search AI Tools
          </Link>
        </div>
      </div>
    </main>
  );
}
