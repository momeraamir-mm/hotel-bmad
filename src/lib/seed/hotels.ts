import type { Hotel, Supplier } from "../schemas";

/**
 * Real Makkah 5-star inventory matching Elite Tour House / Umratrips
 * (umratrips.com/hotels). All Haram-area properties the agency actually books.
 */
export const SEED_HOTELS: Hotel[] = [
  { id: "h-fairmont", name: "Fairmont Makkah Clock Royal Tower", city: "Makkah", area: "Abraj Al Bait, Haram-facing", stars: 5 },
  { id: "h-safwa", name: "Al Safwa Royale Orchid (Dar Al-Eiman)", city: "Makkah", area: "Abraj Al Bait, Haram-facing", stars: 5 },
  { id: "h-dartawhid", name: "Dar Al Tawhid InterContinental", city: "Makkah", area: "Haram-facing, adjacent to Haram", stars: 5 },
  { id: "h-swissotel", name: "Swissôtel Makkah", city: "Makkah", area: "Abraj Al Bait, Haram-facing", stars: 5 },
  { id: "h-movenpick", name: "Mövenpick Hotel Makkah (Hajar Tower)", city: "Makkah", area: "Abraj Al Bait, Haram-facing", stars: 5 },
  { id: "h-pullman", name: "Pullman ZamZam Makkah", city: "Makkah", area: "Abraj Al Bait, Haram-facing", stars: 5 },
  { id: "h-maqam", name: "Swissôtel Al Maqam Makkah", city: "Makkah", area: "Abraj Al Bait, Haram-facing", stars: 5 },
  { id: "h-rayhaan", name: "Al Marwa Rayhaan by Rotana", city: "Makkah", area: "Abraj Al Bait, Haram-facing", stars: 5 },
  { id: "h-hilton-suites", name: "Hilton Suites Makkah", city: "Makkah", area: "100m from Haram, King Abdul Aziz Gate", stars: 5 },
  { id: "h-conrad", name: "Conrad Makkah", city: "Makkah", area: "Jabal Omar, 350m from Haram", stars: 5 },
  { id: "h-hyatt", name: "Hyatt Regency Makkah", city: "Makkah", area: "Jabal Omar, ~500m from Haram", stars: 5 },
  { id: "h-marriott", name: "Marriott Hotel Jabal Omar Makkah", city: "Makkah", area: "Jabal Omar, ~450m from Haram", stars: 5 },
  { id: "h-sheraton", name: "Makkah Sheraton Jabal Al Kaaba", city: "Makkah", area: "Jabal Omar district, ~600m from Haram", stars: 5 },
  { id: "h-lemeridien", name: "Le Méridien Makkah", city: "Makkah", area: "Jabal Omar district, ~700m from Haram", stars: 5 },
];

/** Fabricated supplier/DMC names. */
export const SEED_SUPPLIERS: Supplier[] = [
  { id: "s-haramain", name: "Al-Haramain Travels" },
  { id: "s-gateway", name: "Makkah Gateway DMC" },
  { id: "s-barakah", name: "Barakah Reservations" },
  { id: "s-tawaf", name: "Tawaf Tours" },
  { id: "s-safa", name: "Safa Hotels Network" },
];
