import type { Rate, RoomType, City } from "./schemas";
import { clientPrice, isRateComplete } from "./pricing";

export type CompareCriteria = {
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  city?: City | null;
  hotelPreference?: string | null;
  hotels?: string[] | null; // the hotels actually sourced from suppliers for THIS request
};

export type ComparedRow = {
  rate: Rate;
  complete: boolean;
  clientPrice: number | null;
  isBestPick: boolean;
};

export type ComparisonResult = {
  rows: ComparedRow[];
  bestPickId: string | null;
  savingsVsNext: number | null; // Client Price basis
  nextBestLabel: string | null;
};

/**
 * Deterministic matching + ranking. The cheapest COMPLETE rate (by Client Price)
 * is the Best Pick — the source of truth for "best price". The LLM only explains it.
 */
export function compareRates(
  rates: Rate[],
  criteria: CompareCriteria,
  marginPct: number,
): ComparisonResult {
  // Match on room type primarily. (Dates/city are demo-soft: we keep all rates of the
  // requested room type so the seeded scenario always has something to compare.)
  const matched = rates.filter((r) => r.roomType === criteria.roomType);

  let pool = matched.length > 0 ? matched : rates;

  // Scope to the hotels we actually sourced for this request — you only compare what
  // suppliers quoted for this requirement, not the whole inventory.
  if (criteria.hotels && criteria.hotels.length > 0) {
    pool = pool.filter((r) => criteria.hotels!.includes(r.hotel));
  }

  const rows: ComparedRow[] = pool.map((rate) => {
    const complete = isRateComplete(rate);
    return {
      rate,
      complete,
      clientPrice: rate.costPrice != null ? clientPrice(rate.costPrice, marginPct) : null,
      isBestPick: false,
    };
  });

  // Rank complete rows by client price ascending.
  const ranked = rows
    .filter((r) => r.complete && r.clientPrice != null)
    .sort((a, b) => (a.clientPrice! - b.clientPrice!));

  let bestPickId: string | null = null;
  let savingsVsNext: number | null = null;
  let nextBestLabel: string | null = null;

  if (ranked.length > 0) {
    const best = ranked[0];
    best.isBestPick = true;
    bestPickId = best.rate.id;
    if (ranked.length > 1) {
      const next = ranked[1];
      savingsVsNext = next.clientPrice! - best.clientPrice!;
      nextBestLabel = `${next.rate.hotel} / ${next.rate.supplier}`;
    }
  }

  // Sort display: best pick first, then complete by price, then incomplete last.
  rows.sort((a, b) => {
    if (a.isBestPick) return -1;
    if (b.isBestPick) return 1;
    if (a.complete !== b.complete) return a.complete ? -1 : 1;
    if (a.clientPrice == null) return 1;
    if (b.clientPrice == null) return -1;
    return a.clientPrice - b.clientPrice;
  });

  return { rows, bestPickId, savingsVsNext, nextBestLabel };
}
