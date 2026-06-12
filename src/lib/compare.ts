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
  received: boolean; // has this supplier actually replied yet? (pending = still awaiting)
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
  receivedIds?: string[], // ids that have replied; undefined = treat all as replied
): ComparisonResult {
  // Only the requested room type — suppliers quote the exact room the client needs,
  // so the comparison is apples-to-apples and never mixes in other room types.
  let pool = rates.filter((r) => r.roomType === criteria.roomType);

  // Scope to the hotels we actually sourced for this request — you only compare what
  // suppliers quoted for this requirement, not the whole inventory.
  if (criteria.hotels && criteria.hotels.length > 0) {
    pool = pool.filter((r) => criteria.hotels!.includes(r.hotel));
  }

  const isReceived = (id: string) => (receivedIds ? receivedIds.includes(id) : true);

  const rows: ComparedRow[] = pool.map((rate) => {
    const received = isReceived(rate.id);
    const complete = isRateComplete(rate);
    return {
      rate,
      complete,
      received,
      // Only price rows that have actually replied — pending rows show no figures.
      clientPrice: received && rate.costPrice != null ? clientPrice(rate.costPrice, marginPct) : null,
      isBestPick: false,
    };
  });

  // Rank only replied, complete rows — a still-pending supplier can't be the Best Pick.
  const ranked = rows
    .filter((r) => r.received && r.complete && r.clientPrice != null)
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

  // Sort display: best pick first, then replied complete by price, then pending last.
  rows.sort((a, b) => {
    if (a.isBestPick) return -1;
    if (b.isBestPick) return 1;
    if (a.received !== b.received) return a.received ? -1 : 1; // pending rows sink to the bottom
    if (a.complete !== b.complete) return a.complete ? -1 : 1;
    if (a.clientPrice == null) return 1;
    if (b.clientPrice == null) return -1;
    return a.clientPrice - b.clientPrice;
  });

  return { rows, bestPickId, savingsVsNext, nextBestLabel };
}
