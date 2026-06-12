import Link from "next/link";

import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { getUserMenuContext } from "@/lib/auth/user-menu";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export async function SiteHeader() {
  const menu = await getUserMenuContext();

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

        <div className="flex items-center gap-2 sm:gap-3">
          {!menu.isAuthenticated && (
            <Link
              href="/login?mode=signin"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Login
            </Link>
          )}
          <UserAvatarMenu menu={menu} />
        </div>
      </div>
    </header>
  );
}
