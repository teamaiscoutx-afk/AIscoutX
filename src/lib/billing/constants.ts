/** Pro plan — strictly INR. Amount in paise (₹799 = 79900). */
export const PRO_CURRENCY = "INR" as const;
export const PRO_PRICE_INR = 799;
export const PRO_AMOUNT_PAISE = PRO_PRICE_INR * 100;
export const PRO_PRICE_LABEL = "₹799";
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
