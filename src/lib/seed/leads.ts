import type { StructuredRequest } from "../schemas";

/**
 * Seed "requests board" data — many concurrent client requests at different stages,
 * the way a 12-person reservation team actually sees their day. Demo-only, plausible.
 * Ownership is intentionally LIGHT (a name or null) — lead-distribution rules are
 * deferred until we learn how the client operates. See team-board-pivot memory.
 */

export const LEAD_STATUSES = [
  "New",
  "Awaiting client",
  "Sourcing rates",
  "Ready to quote",
  "Awaiting approval",
  "Sent",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** The thing that makes a request need a human right now. */
export type LeadFlag = "supplier-replied" | "approval" | "client-waiting" | null;

export type Lead = {
  id: string;
  client: string;
  origin: string; // country the pilgrim is travelling from
  preview: string; // last inbound WhatsApp snippet
  request: StructuredRequest;
  status: LeadStatus;
  owner: string | null; // light ownership; null = unassigned
  ageHours: number; // since last activity — drives the "waiting" signal
  flag: LeadFlag;
  aiStatus?: string; // what the AI is doing on this request right now (transient)
  needsOutreachApproval?: boolean; // AI drafted supplier requests; awaiting human OK to send (FR-22)
  sourcedHotels?: string[]; // the hotel shortlist we asked suppliers about for this request
};

const r = (p: Partial<StructuredRequest>): StructuredRequest => ({
  city: "Makkah",
  hotelPreference: null,
  checkIn: null,
  checkOut: null,
  pax: null,
  roomType: null,
  notes: null,
  followUps: [],
  ...p,
});

export const SEED_LEADS: Lead[] = [
  {
    id: "L-1042",
    client: "Abdul Rahman",
    origin: "United Kingdom",
    preview: "Salam, need a hotel close to Haram for my family, last 10 days of Ramadan…",
    request: r({ pax: 4, notes: "Family with elderly mother — wheelchair access helpful." }),
    status: "New",
    owner: null,
    ageHours: 0.4,
    flag: "client-waiting",
  },
  {
    id: "L-1041",
    client: "Fatima Noor",
    origin: "Pakistan",
    preview: "Voice note (0:38) — transcribed: 2 people, 5 nights in December, double room…",
    request: r({ pax: 2, roomType: "Double", checkIn: "2026-12-18", checkOut: "2026-12-23" }),
    status: "New",
    owner: "Sana",
    ageHours: 1.2,
    flag: null,
  },
  {
    id: "L-1038",
    client: "Yousef Group",
    origin: "Malaysia",
    preview: "We are 9 people, 3 rooms. Which hotels you have? Budget around 1200/night.",
    request: r({ pax: 9, roomType: "Triple", notes: "3 triple rooms, budget ~SAR 1200/night." }),
    status: "Awaiting client",
    owner: "Imran",
    ageHours: 19,
    flag: "client-waiting",
  },
  {
    id: "L-1035",
    client: "Ahmed Family",
    origin: "India",
    preview: "Check-in 23 Dec, 4 nights, 2 rooms double. Prefer Hilton or Conrad.",
    request: r({
      pax: 4,
      roomType: "Double",
      checkIn: "2026-12-23",
      checkOut: "2026-12-27",
      hotelPreference: "Hilton Suites or Conrad",
    }),
    status: "Sourcing rates",
    owner: "Riyas",
    ageHours: 3.1,
    flag: null,
    aiStatus: "Awaiting 2 of 3 supplier replies…",
    sourcedHotels: ["Hilton Suites Makkah", "Conrad Makkah", "Pullman ZamZam Makkah"],
  },
  {
    id: "L-1034",
    client: "Bilal Khan",
    origin: "United Kingdom",
    preview: "Just the two of us, 6 nights from 2 Jan. Something Haram-facing if possible.",
    request: r({
      pax: 2,
      roomType: "Double",
      checkIn: "2027-01-02",
      checkOut: "2027-01-08",
      hotelPreference: "Haram-facing",
    }),
    status: "Sourcing rates",
    owner: "Yusuf",
    ageHours: 5.5,
    flag: null,
    aiStatus: "1 of 3 rates in · normalizing…",
    sourcedHotels: ["Swissôtel Makkah", "Pullman ZamZam Makkah", "Dar Al Tawhid InterContinental"],
  },
  {
    id: "L-1031",
    client: "Mariam Saleh",
    origin: "United States",
    preview: "Supplier (Barakah) replied: Swissôtel DBL 1407 incl breakfast, 6 rooms left.",
    request: r({
      pax: 2,
      roomType: "Double",
      checkIn: "2026-12-23",
      checkOut: "2026-12-27",
    }),
    status: "Ready to quote",
    owner: "Sana",
    ageHours: 0.7,
    flag: "supplier-replied",
    aiStatus: "3 rates compared · best pick Swissôtel",
    sourcedHotels: ["Swissôtel Makkah", "Conrad Makkah", "Hilton Suites Makkah"],
  },
  {
    id: "L-1029",
    client: "Hajj Tours Lahore",
    origin: "Pakistan",
    preview: "3 suppliers replied with rates for Pullman & Dar Al Tawhid — ready to compare.",
    request: r({
      pax: 3,
      roomType: "Triple",
      checkIn: "2026-12-20",
      checkOut: "2026-12-25",
    }),
    status: "Ready to quote",
    owner: null,
    ageHours: 2.3,
    flag: "supplier-replied",
    sourcedHotels: ["Pullman ZamZam Makkah", "Dar Al Tawhid InterContinental", "Mövenpick Hotel Makkah (Hajar Tower)"],
  },
  {
    id: "L-1024",
    client: "Omar Farooq",
    origin: "Canada",
    preview: "Draft quote ready for Fairmont — SAR 1,897/night × 4. Awaiting your approval.",
    request: r({
      pax: 2,
      roomType: "Double",
      checkIn: "2026-12-24",
      checkOut: "2026-12-28",
      hotelPreference: "Fairmont",
    }),
    status: "Awaiting approval",
    owner: "Imran",
    ageHours: 1.0,
    flag: "approval",
    sourcedHotels: ["Fairmont Makkah Clock Royal Tower", "Swissôtel Makkah", "Conrad Makkah"],
  },
  {
    id: "L-1021",
    client: "Zainab Group",
    origin: "South Africa",
    preview: "Quote drafted for Conrad. Heads up — rate last confirmed 5 days ago.",
    request: r({
      pax: 6,
      roomType: "Triple",
      checkIn: "2026-12-26",
      checkOut: "2026-12-30",
    }),
    status: "Awaiting approval",
    owner: "Riyas",
    ageHours: 8,
    flag: "approval",
    sourcedHotels: ["Conrad Makkah", "Hilton Suites Makkah", "Hyatt Regency Makkah"],
  },
  {
    id: "L-1018",
    client: "Ibrahim Sheikh",
    origin: "Australia",
    preview: "Quote sent (English + Arabic). Client reviewing with family.",
    request: r({
      pax: 2,
      roomType: "Double",
      checkIn: "2027-01-10",
      checkOut: "2027-01-15",
    }),
    status: "Sent",
    owner: "Yusuf",
    ageHours: 22,
    flag: null,
    sourcedHotels: ["Swissôtel Makkah", "Pullman ZamZam Makkah", "Conrad Makkah"],
  },
  {
    id: "L-1012",
    client: "Nadia Hassan",
    origin: "United Kingdom",
    preview: "Quote sent for Mövenpick. Client asked to hold the room — following up.",
    request: r({
      pax: 4,
      roomType: "Quad",
      checkIn: "2026-12-22",
      checkOut: "2026-12-26",
    }),
    status: "Sent",
    owner: "Sana",
    ageHours: 30,
    flag: null,
    sourcedHotels: ["Mövenpick Hotel Makkah (Hajar Tower)", "Hilton Suites Makkah", "Conrad Makkah"],
  },
];
