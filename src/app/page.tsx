import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 px-6 text-center">

      {/* Logo */}
      <div className="mb-8 flex items-center gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-white">QUANT</span>
        <span className="text-3xl font-bold tracking-tight text-zinc-400">HECHTON</span>
      </div>

      {/* Headline */}
      <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white">
        Survive inflation.<br />Outlast the crash.
      </h1>
      <p className="mt-4 max-w-md text-base text-zinc-400">
        A personal finance tool built to help you understand your real purchasing power,
        model economic downturns, and stay ahead of rising costs.
      </p>

      {/* CTAs */}
      <div className="mt-10 flex items-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Sign In
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          Register
        </Link>
      </div>

    </div>
  );
}