export const CREDITS_UPDATED_EVENT = "aiscoutx:credits-updated";

export function dispatchCreditsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT));
}
