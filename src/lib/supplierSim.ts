import type { Rate } from "./schemas";

/** Deterministic simulated supplier reply (no randomness): rates drift, availability shifts. */
export function simulateSupplierReply(rate: Rate) {
  const seed = rate.id.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  const up = seed % 2 === 0;
  const factor = up ? 1.04 : 0.98; // peak rates mostly rise; some suppliers dip
  const oldCost = rate.costPrice ?? 0;
  const newCost = oldCost ? Math.round(oldCost * factor) : oldCost;
  const oldAvail = rate.availability ?? 5;
  const newAvail = Math.max(1, oldAvail + (up ? -2 : 1));
  return { oldCost, newCost, costDelta: newCost - oldCost, oldAvail, newAvail };
}
