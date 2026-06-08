import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Refund Policy — AIscoutX",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      title="Cancellation & Refund Policy"
      subtitle="Transparent billing terms for AIscoutX subscriptions."
      lastUpdated="June 2, 2026"
    >
      <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
        <p>
          This policy applies to paid subscriptions for AIscoutX, operated by{" "}
          {COMPANY.founder} ({COMPANY.email}).
        </p>

        <section>
          <h2 className="text-lg font-semibold text-white">1. 7-day money-back guarantee</h2>
          <p className="mt-2">
            New subscribers may request a full refund within 7 days of the
            initial purchase if the platform has not been heavily consumed (see
            Section 3). Contact{" "}
            <a href={`mailto:${COMPANY.email}`} className="text-[#deff9a] hover:underline">
              {COMPANY.email}
            </a>{" "}
            with your account email and payment receipt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Cancellations</h2>
          <p className="mt-2">
            You may cancel anytime from your billing portal. Cancellation stops
            future renewals. Access continues until the end of the current billing
            period.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Conditional refunds</h2>
          <p className="mt-2">
            Refunds after the 7-day window may be granted at our discretion for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Duplicate charges or billing errors</li>
            <li>Extended platform outages affecting core features</li>
            <li>Unused subscription credits where no heavy consumption occurred</li>
          </ul>
          <p className="mt-2">
            Heavy consumption includes extensive workspace generation, exported
            blueprints, or API usage beyond fair-use starter thresholds.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Non-refundable items</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Partial months after cancellation</li>
            <li>Promotional or discounted annual plans after 7 days</li>
            <li>Third-party payment processor fees</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Processing time</h2>
          <p className="mt-2">
            Approved refunds are processed within 5–10 business days to your
            original payment method via Stripe.
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
