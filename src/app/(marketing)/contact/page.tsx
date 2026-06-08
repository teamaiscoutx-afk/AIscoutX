import { ContactForm } from "@/components/legal/contact-form";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { COMPANY } from "@/lib/company";
import { Mail, MapPin } from "lucide-react";

export const metadata = {
  title: "Contact — AIscoutX",
};

export default function ContactPage() {
  return (
    <LegalPageShell
      title="Contact Us"
      subtitle="Reach the AIscoutX team for support, partnerships, or billing."
      lastUpdated="June 2, 2026"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-sm font-semibold text-white">Founder</p>
            <p className="mt-1 text-sm text-zinc-400">{COMPANY.founder}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Mail className="h-4 w-4 text-[#deff9a]" />
              Email
            </p>
            <a
              href={`mailto:${COMPANY.email}`}
              className="mt-2 block text-sm text-[#deff9a] hover:underline"
            >
              {COMPANY.email}
            </a>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <MapPin className="h-4 w-4 text-[#deff9a]" />
              Address
            </p>
            <p className="mt-2 text-sm text-zinc-400">{COMPANY.address}</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </LegalPageShell>
  );
}
