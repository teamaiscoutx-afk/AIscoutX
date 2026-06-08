import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { COMPANY } from "@/lib/company";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const productLinks: FooterLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Coming Soon", href: "/#coming-soon" },
];

const companyLinks: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  {
    label: "Email",
    href: `mailto:${COMPANY.email}`,
    external: true,
  },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Refund Policy", href: "/refund-policy" },
];

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-zinc-500 transition-colors hover:text-white"
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#030308]/95">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-10 sm:gap-12 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white"
            >
              <span className="text-glow-lime">AI</span>scoutX
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              AI Founder Operating System — from idea to first customer with
              guided execution.
            </p>
            <p className="mt-3 text-xs text-zinc-600">
              {COMPANY.founder} · {COMPANY.shortAddress}
            </p>
          </div>

          <FooterLinkList title="Product" links={productLinks} />
          <FooterLinkList title="Company" links={companyLinks} />
          <FooterLinkList title="Legal" links={legalLinks} />
        </div>

        <Separator className="my-10 bg-white/[0.06]" />

        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Stripe-ready billing · {COMPANY.email}
          </p>
        </div>
      </div>
    </footer>
  );
}
