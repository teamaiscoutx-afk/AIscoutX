import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Privacy Policy — AIscoutX",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="How AIscoutX collects, uses, and protects your data."
      lastUpdated="June 2, 2026"
    >
      <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
        <p>
          AIscoutX (&quot;we&quot;, &quot;us&quot;) is operated by{" "}
          {COMPANY.founder}, {COMPANY.address}. This Privacy Policy explains how
          we handle personal data when you use our platform.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-white">1. Data we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account data: email, authentication identifiers (via Supabase Auth)</li>
            <li>Profile data: persona, goals, niche focus, workspace preferences</li>
            <li>Workspace data: startup workspaces, tasks, execution progress</li>
            <li>Usage data: pages visited, feature interactions, device/browser metadata</li>
            <li>Payment data: processed by Stripe; we do not store full card numbers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. How we use data</h2>
          <p className="mt-2">
            We use your data to authenticate you, personalize your founder
            workspace, improve product performance, provide support, and comply
            with legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Storage & security</h2>
          <p className="mt-2">
            Data is stored in Supabase (PostgreSQL) with row-level security,
            encrypted transport (TLS), and industry-standard access controls.
            Authentication tokens are managed via secure HTTP-only cookies through
            Supabase SSR.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. GDPR / CCPA rights</h2>
          <p className="mt-2">
            Depending on your jurisdiction, you may request access, correction,
            deletion, portability, or restriction of your personal data. Contact{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[#deff9a] hover:underline">
              {COMPANY.email}
            </a>{" "}
            to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Data retention</h2>
          <p className="mt-2">
            We retain account and workspace data while your account is active. You
            may request deletion at any time. Some records may be retained where
            required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Contact</h2>
          <p className="mt-2">
            {COMPANY.founder}
            <br />
            {COMPANY.email}
            <br />
            {COMPANY.address}
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
