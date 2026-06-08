import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "About — AIscoutX",
  description: "AIscoutX mission and founder story.",
};

export default function AboutPage() {
  return (
    <LegalPageShell
      title="About AIscoutX"
      subtitle="Eliminating information overload for modern builders."
      lastUpdated="June 2, 2026"
    >
      <section className="space-y-4 text-sm leading-relaxed text-zinc-400">
        <p>
          <strong className="text-white">AIscoutX</strong> is an AI Founder
          Operating System built to help founders, creators, agencies, and
          solopreneurs move from idea to first revenue — without drowning in
          noise.
        </p>
        <p>
          We replace passive opportunity scanning with guided execution:
          validation, MVP build, launch, and growth — powered by Founder GPS,
          startup workspaces, and contextual AI mentorship.
        </p>
        <h2 className="text-lg font-semibold text-white">Our mission</h2>
        <p>
          Modern builders don&apos;t need more data. They need a system that
          converts signal into daily action. AIscoutX automates the founder
          pipeline so you ship faster, validate smarter, and reach your first
          customer with clarity.
        </p>
        <h2 className="text-lg font-semibold text-white">Founded by</h2>
        <p>
          {COMPANY.founder}
          <br />
          {COMPANY.address}
          <br />
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-[#deff9a] hover:underline"
          >
            {COMPANY.email}
          </a>
        </p>
      </section>
    </LegalPageShell>
  );
}
