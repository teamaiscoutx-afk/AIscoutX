import { logServerError } from "@/lib/server/safe-action";

/**
 * Transactional email router — Resend REST API.
 * Set RESEND_API_KEY and EMAIL_FROM in env.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function dispatch(payload: EmailPayload): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      logServerError("email.dispatch", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    logServerError("email.dispatch", err);
    return false;
  }
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#030308;font-family:-apple-system,Segoe UI,Roboto,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="color:#00FF66;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;">AIscoutX</p>
      <h1 style="color:#ffffff;font-size:22px;margin:16px 0 0;">${title}</h1>
      <div style="color:#a1a1aa;font-size:15px;line-height:1.7;margin-top:16px;">
        ${body}
      </div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0;" />
      <p style="color:#52525b;font-size:12px;margin:0;">
        You're receiving this because you have an AIscoutX account.
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiscoutx.com"}/dashboard/discover" style="color:#00FF66;text-decoration:none;">Open your dashboard</a>
      </p>
    </div>
  </body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#00FF66;color:#030308;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">${label}</a>`;
}

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiscoutx.com";

/** Trigger A — welcome email on first sign-up. */
export async function sendWelcomeEmail(to: string): Promise<boolean> {
  return dispatch({
    to,
    subject: "Welcome to AIscoutX — your Founder OS is ready",
    html: layout(
      "Welcome to the AIscoutX Founder OS",
      `<p>You just joined a workspace built for founders who want clarity, not noise.</p>
       <p>Here's how to get value in your first session:</p>
       <ul style="padding-left:18px;">
         <li><strong>Discover</strong> — scan live signals in your niche</li>
         <li><strong>Blueprint</strong> — turn ideas into shippable plans</li>
         <li><strong>Founder GPS</strong> — get daily actionable next steps</li>
       </ul>
       <p>Your dashboard is ready. Sign in anytime to pick up where you left off.</p>
       ${ctaButton("Open my dashboard", `${SITE()}/dashboard/discover`)}`
    ),
  });
}

/** Trigger B — Pro upgrade confirmed after Razorpay verification. */
export async function sendSubscriptionSuccessEmail(
  to: string,
  input?: { amountLabel?: string; orderId?: string | null }
): Promise<boolean> {
  const amount = input?.amountLabel ?? "₹799 / month";
  const receipt = input?.orderId
    ? `<p style="color:#71717a;font-size:13px;">Receipt reference: <strong>${input.orderId}</strong></p>`
    : "";

  return dispatch({
    to,
    subject: "Payment received — AIscoutX Pro is now active",
    html: layout(
      "Pro access activated",
      `<p>We've received your payment of <strong>${amount}</strong>. Your account is now on <strong>Pro</strong>.</p>
       ${receipt}
       <p>Premium access now includes:</p>
       <ul style="padding-left:18px;">
         <li>Full AI Founder OS Workspaces</li>
         <li>Daily Actionable Steps (Founder GPS Tracker)</li>
         <li>Unlimited AI Mentor Chat</li>
       </ul>
       <p>No extra setup needed — refresh your dashboard and everything is unlocked.</p>
       ${ctaButton("Go to my dashboard", `${SITE()}/dashboard/discover`)}`
    ),
  });
}

/** Trigger C — subscription renewal reminder email. */
export async function sendSubscriptionRenewalWarningEmail(
  to: string,
  input: { renewalDate: string; amountLabel: string }
): Promise<boolean> {
  const formatted = new Date(input.renewalDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return dispatch({
    to,
    subject: "Your AIscoutX Pro plan is renewing soon",
    html: layout(
      "Renewal reminder",
      `<p>Your Pro plan (<strong>${input.amountLabel}</strong>) is scheduled to renew on <strong>${formatted}</strong>.</p>
       <p>To keep uninterrupted access to workspaces, Founder GPS, and AI Mentor Chat, make sure your payment method is up to date.</p>
       <p>If you've already renewed, you can ignore this message.</p>
       ${ctaButton("Review my plan", `${SITE()}/dashboard/discover`)}`
    ),
  });
}

/** Niche signal alert — includes source link when available. */
export async function sendNicheAlertEmail(
  to: string,
  input: {
    nicheFocus: string;
    painPoint: string;
    solutionHint: string;
    sourceLink?: string;
    workspaceId?: string;
  }
): Promise<boolean> {
  const workspaceUrl = input.workspaceId
    ? `${SITE()}/dashboard/workspace/${input.workspaceId}`
    : `${SITE()}/dashboard/discover`;

  const sourceBlock = input.sourceLink
    ? `<p style="margin-top:12px;font-size:13px;">Source: <a href="${input.sourceLink}" style="color:#00FF66;">View original signal</a></p>`
    : "";

  return dispatch({
    to,
    subject: `New signal in ${input.nicheFocus}`,
    html: layout(
      `Fresh update in ${input.nicheFocus}`,
      `<p>We spotted a meaningful shift in your tracked niche:</p>
       <blockquote style="border-left:3px solid #00FF66;margin:16px 0;padding:8px 16px;color:#d4d4d8;background:rgba(0,255,102,0.05);">
         ${input.painPoint}
       </blockquote>
       <p><strong>Suggested move:</strong> ${input.solutionHint}</p>
       ${sourceBlock}
       ${ctaButton("Open your workspace", workspaceUrl)}`
    ),
  });
}
