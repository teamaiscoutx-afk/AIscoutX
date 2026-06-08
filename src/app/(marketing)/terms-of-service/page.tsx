import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Terms of Service — AIscoutX",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle="Governing rules for using the AIscoutX platform."
      lastUpdated="June 2, 2026"
    >
      <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to AIscoutX
          operated by {COMPANY.founder}, {COMPANY.address}. By using AIscoutX,
          you agree to these Terms.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-white">1. Service description</h2>
          <p className="mt-2">
            AIscoutX provides software tools for opportunity discovery, startup
            workspace management, AI-assisted execution guidance, and founder
            workflow automation. Features may evolve over time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Accounts</h2>
          <p className="mt-2">
            You are responsible for safeguarding your login credentials and all
            activity under your account. You must provide accurate registration
            information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Subscriptions & payments</h2>
          <p className="mt-2">
            Paid plans are billed via Stripe. Fees are disclosed at checkout.
            Subscriptions renew automatically unless cancelled before the renewal
            date. Taxes may apply based on your location.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Acceptable use</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>No unlawful, abusive, or fraudulent activity</li>
            <li>No scraping, reverse engineering, or unauthorized API abuse</li>
            <li>No attempts to bypass rate limits or security controls</li>
            <li>No resale of platform access without written permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Intellectual property</h2>
          <p className="mt-2">
            AIscoutX owns the platform, branding, and underlying software. You
            retain ownership of your input data. AI-generated workspace outputs
            are licensed to you for business use, but we may use anonymized usage
            patterns to improve the product.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Disclaimers</h2>
          <p className="mt-2">
            AIscoutX is provided &quot;as is.&quot; We do not guarantee business
            outcomes, revenue results, or market performance. AI outputs are
            advisory and require your independent judgment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Limitation of liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, AIscoutX shall not be liable
            for indirect, incidental, or consequential damages. Our aggregate
            liability is limited to fees paid in the prior 12 months.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Contact</h2>
          <p className="mt-2">
            {COMPANY.founder} —{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[#deff9a] hover:underline">
              {COMPANY.email}
            </a>
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
