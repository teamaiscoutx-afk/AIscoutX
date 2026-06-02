import Link from "next/link";

import { Button } from "@/components/ui/button";
import { tryCreateServerSupabaseClient } from "@/lib/supabase";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export async function SiteHeader() {
  const supabase = tryCreateServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userLabel = user?.email ?? user?.user_metadata?.full_name ?? "Profile";
  const avatarText = (userLabel?.[0] ?? "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030308]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white transition-opacity hover:opacity-90"
        >
          <span className="text-glow-lime">AI</span>
          <span className="text-zinc-300">scout</span>
          <span className="text-white">X</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-500 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            aria-label={`Signed in as ${userLabel}`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#deff9a]/15 text-xs font-semibold text-[#deff9a]">
              {avatarText}
            </span>
            <span className="hidden max-w-[180px] truncate sm:block">{userLabel}</span>
          </Link>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/[0.02] text-zinc-300 backdrop-blur-sm hover:border-[#deff9a]/25 hover:bg-white/[0.05] hover:text-white"
            asChild
          >
            <Link href="/login">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
