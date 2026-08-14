import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 text-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black">
          ?
        </div>

        <h1 className="mt-6 text-3xl font-black">
          Tool Not Found
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          The requested AI tool does not exist in the AI Vault directory.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

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
            Search AI Tools
          </Link>

        </div>

      </section>
    </main>
  );
}
