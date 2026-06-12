import type { HistoryPoint, Rate } from "./schemas";

/** Pure pricing functions — the trustworthy money math. No LLM involved. */

export function clientPrice(costPrice: number, marginPct: number): number {
  return Math.round(costPrice * (1 + marginPct / 100));
}

export function profit(costPrice: number, marginPct: number): number {
  return clientPrice(costPrice, marginPct) - costPrice;
}

export function nights(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 1;
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  const n = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return n > 0 ? n : 1;
}

/** A rate is "complete" (usable as Best Pick) only if its key fields are present. */
export function isRateComplete(r: Rate): boolean {
  return (
    r.costPrice != null &&
    r.roomType != null &&
    r.checkIn != null &&
    r.checkOut != null
  );
}

export type TrendInfo = {
  hasHistory: boolean;
  deltaPct: number | null; // vs most recent prior week
  direction: "up" | "down" | "flat" | null;
  series: number[]; // oldest → newest, for sparkline
};

export type Freshness = {
  label: "fresh" | "aging" | "stale" | "unknown";
  ageHours: number | null;
  ageText: string;
};

/** How recently a rate was confirmed with the supplier. nowMs lets the caller pass a stable clock. */
export function freshness(capturedAt: string | null | undefined, nowMs: number): Freshness {
  if (!capturedAt) return { label: "unknown", ageHours: null, ageText: "not confirmed" };
  const ageMs = nowMs - new Date(capturedAt).getTime();
  const ageHours = Math.max(0, Math.round(ageMs / 3_600_000));
  const ageDays = ageHours / 24;
  const ageText =
    ageHours < 1 ? "just now" : ageHours < 24 ? `${ageHours}h ago` : `${Math.round(ageDays)}d ago`;
  const label = ageDays > 3 ? "stale" : ageDays >= 1 ? "aging" : "fresh";
  return { label, ageHours, ageText };
}

export function trend(history: HistoryPoint[] | undefined, current: number | null): TrendInfo {
  if (!history || history.length === 0 || current == null) {
    return { hasHistory: false, deltaPct: null, direction: null, series: [] };
  }
  const sorted = [...history].sort((a, b) => a.weekOffset - b.weekOffset); // oldest first
  const series = [...sorted.map((h) => h.costPrice), current];
  const prev = sorted[sorted.length - 1].costPrice;
  const deltaPct = prev === 0 ? 0 : Math.round(((current - prev) / prev) * 100);
  const direction = deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "flat";
  return { hasHistory: true, deltaPct, direction, series };
}
