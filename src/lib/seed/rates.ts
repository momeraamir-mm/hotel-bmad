import type { HistoryPoint, Rate, RoomType } from "../schemas";
import { SEED_HOTELS, SEED_SUPPLIERS } from "./hotels";

/**
 * Deterministically generated seed rates so the demo opens with a rich, credible
 * comparison set — and a repeatable scenario (no randomness). Each hotel is quoted
 * by 3 suppliers for the headline dates; each rate carries 3 weeks of history.
 */

const HEADLINE_CHECKIN = "2026-12-23";
const HEADLINE_CHECKOUT = "2026-12-27";

// Base nightly cost (SAR) per hotel for a Double — peak December pricing.
const BASE_COST: Record<string, number> = {
  "h-fairmont": 1650,
  "h-safwa": 1480,
  "h-dartawhid": 1520,
  "h-swissotel": 1450,
  "h-movenpick": 1400,
  "h-pullman": 1390,
  "h-maqam": 1300,
  "h-rayhaan": 1350,
  "h-hilton-suites": 1180,
  "h-conrad": 1320,
  "h-hyatt": 1200,
  "h-marriott": 1250,
  "h-sheraton": 1150,
  "h-lemeridien": 1100,
};

// Room-type multipliers relative to Double.
const ROOM_MULT: Record<RoomType, number> = {
  Single: 0.82,
  Double: 1,
  Triple: 1.28,
  Quad: 1.5,
  Suite: 2.1,
};

// Every room type is quotable — for any requested room, each supplier returns a rate
// specific to that room (no standing price list, no "default to Double").
const ALL_ROOM_TYPES: RoomType[] = ["Single", "Double", "Triple", "Quad", "Suite"];
const ROOM_CODE: Record<RoomType, string> = {
  Single: "sgl",
  Double: "dbl",
  Triple: "trp",
  Quad: "quad",
  Suite: "ste",
};

// Each hotel is offered by 3 suppliers; supplier index → cost multiplier (rate spread).
const HOTEL_SUPPLIERS: Record<string, string[]> = {
  "h-fairmont": ["s-haramain", "s-barakah", "s-safa"],
  "h-safwa": ["s-gateway", "s-haramain", "s-tawaf"],
  "h-dartawhid": ["s-safa", "s-gateway", "s-haramain"],
  "h-swissotel": ["s-haramain", "s-barakah", "s-safa"],
  "h-movenpick": ["s-barakah", "s-tawaf", "s-gateway"],
  "h-pullman": ["s-gateway", "s-haramain", "s-tawaf"],
  "h-maqam": ["s-tawaf", "s-safa", "s-barakah"],
  "h-rayhaan": ["s-safa", "s-haramain", "s-gateway"],
  "h-hilton-suites": ["s-barakah", "s-safa", "s-gateway"],
  "h-conrad": ["s-haramain", "s-tawaf", "s-barakah"],
  "h-hyatt": ["s-gateway", "s-barakah", "s-haramain"],
  "h-marriott": ["s-tawaf", "s-gateway", "s-safa"],
  "h-sheraton": ["s-barakah", "s-haramain", "s-tawaf"],
  "h-lemeridien": ["s-safa", "s-tawaf", "s-gateway"],
};

const SUPPLIER_SPREAD = [0.97, 1.0, 1.05]; // 1st supplier cheapest, etc.
const INCLUSION_SETS = [["Breakfast"], ["Breakfast", "Dinner"], []];
const AVAILABILITY = [6, 12, 3];

function supplierName(id: string): string {
  return SEED_SUPPLIERS.find((s) => s.id === id)?.name ?? id;
}

function makeHistory(finalCost: number): HistoryPoint[] {
  // Rising trend into peak: -3w cheaper, -1w close to current.
  return [
    { weekOffset: -3, costPrice: Math.round(finalCost * 0.86) },
    { weekOffset: -2, costPrice: Math.round(finalCost * 0.91) },
    { weekOffset: -1, costPrice: Math.round(finalCost * 0.96) },
  ];
}

export type SeededRate = Rate & { history: HistoryPoint[] };

function buildRates(): SeededRate[] {
  const out: SeededRate[] = [];
  for (const hotel of SEED_HOTELS) {
    const base = BASE_COST[hotel.id];
    const suppliers = HOTEL_SUPPLIERS[hotel.id];
    // Each of the 3 suppliers quotes every room type — so whatever room the client
    // needs, the comparison shows that exact room priced by all suppliers.
    for (const roomType of ALL_ROOM_TYPES) {
      const roomBase = base * ROOM_MULT[roomType];
      suppliers.forEach((supId, i) => {
        const cost = Math.round(roomBase * SUPPLIER_SPREAD[i]);
        out.push({
          id: `${hotel.id}-${supId}-${ROOM_CODE[roomType]}`,
          hotel: hotel.name,
          city: hotel.city,
          supplier: supplierName(supId),
          roomType,
          checkIn: HEADLINE_CHECKIN,
          checkOut: HEADLINE_CHECKOUT,
          costPrice: cost,
          inclusions: INCLUSION_SETS[i],
          availability: AVAILABILITY[i],
          source: "seed",
          capturedAt: null,
          history: makeHistory(cost),
        });
      });
    }
  }
  return out;
}

export const SEED_RATES_WITH_HISTORY: SeededRate[] = buildRates();

/** History lookup by rate id (kept separate from the Rate object the UI passes around). */
export const HISTORY_BY_RATE: Record<string, HistoryPoint[]> = Object.fromEntries(
  SEED_RATES_WITH_HISTORY.map((r) => [r.id, r.history]),
);

// Strip history for the Rate[] the rest of the app uses.
export const SEED_RATES: Rate[] = SEED_RATES_WITH_HISTORY.map(({ history: _h, ...rate }) => rate);
