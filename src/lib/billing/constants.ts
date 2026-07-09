/ Pro plan — strictly USD. Amount in cents ($12 = 1200). */
export const PRO_CURRENCY = "USD" as const;
export const PRO_PRICE_USD = 12;
export const PRO_PRICE_AMOUNT_CENTS = PRO_PRICE_USD * 100;
export const PRO_PRICE_LABEL = "$12";
export const PRO_PRICE_DISPLAY = `${PRO_PRICE_LABEL} / month`;

export const PRO_CHECKOUT = {
  name: "AIscoutX",
  description: "AI Founder OS Pro Subscription",
  themeColor: "#00FF66",
} as const;

export const PRO_MODAL_FEATURES = [
  "Full access to AI Founder OS Workspaces",
  "Daily Actionable Steps (Founder GPS Tracker)",
  "AI Mentor Chat",
] as const;
