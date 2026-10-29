export const EMERGENCY_BUFFER_CREDITS = 20;

export type CreditAction = "chat" | "blueprint";

export const CREDIT_COST: Record<CreditAction, number> = {
  chat: 1,
  blueprint: 2,
};

export function creditCostForAction(action: CreditAction): number {
  return CREDIT_COST[action];
}
