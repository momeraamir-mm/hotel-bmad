import type { ComparedRow } from "../compare";

export const BEST_PICK_SYSTEM = `You are a reservation analyst. The system has ALREADY computed the cheapest valid option (the Best Pick) — do not change it.
Your only job is to explain, in 1-2 short sentences, WHY it is a good choice, citing concrete factors (price, inclusions, availability, hotel/location tier).
If the top two options are very close in price, acknowledge the tradeoff briefly.

Return ONLY JSON:
{ "rateId": string, "rationale": string, "tradeoff": string | null }
- rateId MUST equal the provided bestPickId.
- Keep it concrete and professional. No markdown.`;

export function bestPickUser(rows: ComparedRow[], bestPickId: string): string {
  const lines = rows
    .filter((r) => r.complete)
    .map(
      (r) =>
        `- id=${r.rate.id} | ${r.rate.hotel} (${r.rate.city ?? "?"}) | supplier=${r.rate.supplier} | clientPrice=SAR ${r.clientPrice}/night | inclusions=[${r.rate.inclusions.join(", ")}] | rooms=${r.rate.availability ?? "?"}${r.isBestPick ? "  <-- BEST PICK" : ""}`,
    )
    .join("\n");
  return `Options (already ranked; cheapest valid = Best Pick):\n${lines}\n\nbestPickId = ${bestPickId}`;
}
