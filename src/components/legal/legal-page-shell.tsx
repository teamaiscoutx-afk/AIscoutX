import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type LegalPageShellProps = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPageShell({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(222,255,154,0.08),transparent_70%)] blur-3xl"
      />
      <Link
        href="/"
        className="relative inline-flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-[#deff9a]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>
      <header className="relative mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#deff9a]/80">
          AIscoutX
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-zinc-500">{subtitle}</p>
        <p className="mt-2 text-xs text-zinc-600">Last updated: {lastUpdated}</p>
      </header>
      <article className="legal-prose relative mt-10 space-y-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
        {children}
      </article>
    </div>
  );
}
