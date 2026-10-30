export const FREEMIUM_WELCOME_CREDITS = 20;

export const FREEMIUM_WELCOME_ALLOWANCE = 20;

export const OUT_OF_CREDITS_EVENT = "aiscoutx:out-of-credits";

export function dispatchOutOfCredits(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OUT_OF_CREDITS_EVENT));
}
