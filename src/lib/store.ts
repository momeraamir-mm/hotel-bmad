import type { Quotation, Rate } from "./schemas";
import { SEED_RATES } from "./seed/rates";

/**
 * In-memory session store (no database — demo scope). Survives HMR via globalThis.
 * Holds seeded + accepted Rates and all Quotations.
 */

type Store = {
  acceptedRates: Rate[];
  quotations: Quotation[];
  overrides: Record<string, Partial<Rate>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __hotelStore: Store | undefined;
}

function getStore(): Store {
  if (!global.__hotelStore) {
    global.__hotelStore = { acceptedRates: [], quotations: [], overrides: {} };
  }
  return global.__hotelStore;
}

/** Seeded + accepted rates, with any supplier-reply overrides (latest cost/availability) applied. */
export function getWorkingRates(): Rate[] {
  const { acceptedRates, overrides } = getStore();
  return [...SEED_RATES, ...acceptedRates].map((r) =>
    overrides[r.id] ? { ...r, ...overrides[r.id] } : r,
  );
}

/** Record updated cost/availability from a supplier's reply for this request. */
export function setRateOverride(id: string, patch: Partial<Rate>): void {
  const store = getStore();
  store.overrides[id] = { ...store.overrides[id], ...patch };
}

export function addAcceptedRates(rates: Rate[]): void {
  getStore().acceptedRates.push(...rates);
}

export function getRateById(id: string): Rate | undefined {
  return getWorkingRates().find((r) => r.id === id);
}

export function addQuotation(q: Quotation): void {
  getStore().quotations.unshift(q);
}

export function getQuotations(): Quotation[] {
  return getStore().quotations;
}

export function updateQuotation(id: string, patch: Partial<Quotation>): Quotation | undefined {
  const q = getStore().quotations.find((x) => x.id === id);
  if (q) Object.assign(q, patch);
  return q;
}
