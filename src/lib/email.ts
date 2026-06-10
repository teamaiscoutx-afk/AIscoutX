import { logServerError } from "@/lib/server/safe-action";

/**
 * Transactional email router — Resend REST API (no SDK dependency).
 * Set RESEND_API_KEY and EMAIL_FROM in env. All sends are fire-safe:
 * failures are logged server-side and never break the calling flow.
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
  <body style="margin:0;padding:0;background:#030308;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="color:#deff9a;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0;">AIscoutX</p>
      <h1 style="color:#ffffff;font-size:22px;margin:16px 0 0;">${title}</h1>
      <div style="color:#a1a1aa;font-size:15px;line-height:1.7;margin-top:16px;">
        ${body}
      </div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0;" />
      <p style="color:#52525b;font-size:12px;margin:0;">
        You're getting this because you have an AIscoutX account.
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiscoutx.com"}" style="color:#deff9a;text-decoration:none;">Open dashboard</a>
      </p>
    </div>
  </body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#deff9a;color:#030308;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">${label}</a>`;
}

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiscoutx.com";

/** 1. Fires on first signup. */
export async function sendWelcomeEmail(to: string): Promise<boolean> {
  return dispatch({
    to,
    subject: "Welcome to AIscoutX — your scout is live",
    html: layout(
      "Your scout is live",
      `<p>You now have an engine that watches Reddit, X, Google, and YouTube for startup signals — so you don't have to.</p>
       <p>Three things to do in your first 10 minutes:</p>
       <ul style="padding-left:18px;">
         <li>Open <strong>Discover</strong> and pick your niche</li>
         <li>Click any signal to see why it's moving</li>
         <li>Save the ones worth building</li>
       </ul>
       ${ctaButton("Open Discover", `${SITE()}/dashboard/discover`)}`
    ),
  });
}

/** 2. Fires from the Stripe webhook on successful Pro purchase. */
export async function sendSubscriptionSuccessEmail(to: string): Promise<boolean> {
  return dispatch({
    to,
    subject: "Pro unlocked — full engine access is live",
    html: layout(
      "Access unlocked",
      `<p>Payment confirmed. Your account is now on <strong>Pro</strong>.</p>
       <p>What just opened up:</p>
       <ul style="padding-left:18px;">
         <li>Unlimited Generate Blueprint runs</li>
         <li>Deep Dive specs with cited market gaps</li>
         <li>Founder GPS progress tracking</li>
         <li>Priority niche alerts straight to this inbox</li>
       </ul>
       <p>No setup needed — everything is already active.</p>
       ${ctaButton("Generate your first blueprint", `${SITE()}/dashboard/discover`)}`
    ),
  });
}

/** 3. Fires when the scraper finds a high-priority signal in a tracked niche. */
export async function sendNicheAlertEmail(
  to: string,
  input: {
    nicheFocus: string;
    painPoint: string;
    solutionHint: string;
    workspaceId?: string;
  }
): Promise<boolean> {
  const workspaceUrl = input.workspaceId
    ? `${SITE()}/dashboard/workspace/${input.workspaceId}`
    : `${SITE()}/dashboard/discover`;

  return dispatch({
    to,
    subject: `New pain point in ${input.nicheFocus} — solution attached`,
    html: layout(
      `Fresh signal in ${input.nicheFocus}`,
      `<p>Our scraper just caught a live pain point in your tracked niche:</p>
       <blockquote style="border-left:3px solid #deff9a;margin:16px 0;padding:8px 16px;color:#d4d4d8;background:rgba(222,255,154,0.05);">
         ${input.painPoint}
       </blockquote>
       <p><strong>Suggested play:</strong> ${input.solutionHint}</p>
       ${ctaButton("Open your workspace", workspaceUrl)}`
    ),
  });
}
