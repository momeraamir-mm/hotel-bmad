import { z } from "zod";

/**
 * Domain schemas (zod) — single source of truth for validation across API routes
 * and UI. Mirrors the PRD Glossary. Inferred TS types are exported at the bottom.
 */

export const ROOM_TYPES = ["Double", "Triple", "Quad", "Suite", "Single"] as const;
export const roomTypeSchema = z.enum(ROOM_TYPES);

export const CITIES = ["Makkah"] as const;
export const citySchema = z.enum(CITIES);

export const LANGUAGES = ["en", "ar", "ur"] as const;
export const languageSchema = z.enum(LANGUAGES);

export const STATUSES = ["Draft", "Approved", "Sent"] as const;
export const statusSchema = z.enum(STATUSES);

/** A structured rate. Fields that could not be parsed are null → surfaced as "needs review". */
export const rateSchema = z.object({
  id: z.string(),
  hotel: z.string(),
  city: citySchema.nullable().optional(),
  supplier: z.string(),
  roomType: roomTypeSchema.nullable(),
  checkIn: z.string().nullable(), // ISO date (YYYY-MM-DD)
  checkOut: z.string().nullable(),
  costPrice: z.number().nullable(), // SAR per room per night
  inclusions: z.array(z.string()).default([]),
  availability: z.number().nullable(), // rooms left
  source: z.enum(["seed", "extracted"]).default("extracted"),
  capturedAt: z.string().nullable().default(null), // ISO timestamp the rate was last confirmed with the supplier
});

/** What the AI returns when extracting from a supplier message (no id/source yet). */
export const extractedRateSchema = z.object({
  hotel: z.string().nullable(),
  city: citySchema.nullable().optional(),
  supplier: z.string().nullable(),
  roomType: roomTypeSchema.nullable(),
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  costPrice: z.number().nullable(),
  inclusions: z.array(z.string()).default([]),
  availability: z.number().nullable(),
});

export const extractionResultSchema = z.object({
  rates: z.array(extractedRateSchema),
});

/** Parsed client inquiry. Unknown fields are null. */
export const structuredRequestSchema = z.object({
  city: citySchema.nullable(),
  hotelPreference: z.string().nullable(),
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  pax: z.number().nullable(),
  roomType: roomTypeSchema.nullable(),
  notes: z.string().nullable(),
  followUps: z.array(z.string()).default([]),
});

export const inquiryParseSchema = z.object({
  request: structuredRequestSchema,
  summary: z.string(),
});

/** Conversational follow-up turn: merged request + the next question (or done). */
export const inquiryChatSchema = z.object({
  request: structuredRequestSchema,
  nextQuestion: z.string().nullable(),
  done: z.boolean(),
  summary: z.string(),
});

/** AI Best Pick rationale payload. */
export const bestPickRationaleSchema = z.object({
  rateId: z.string(),
  rationale: z.string(),
  tradeoff: z.string().nullable().optional(),
});

/** A history point for trend. */
export const historyPointSchema = z.object({
  weekOffset: z.number(), // 0 = current, -1 = last week, ...
  costPrice: z.number(),
});

export const hotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: citySchema,
  area: z.string(), // e.g. "Haram-facing", "200m from Haram"
  stars: z.number(),
});

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const quotationSchema = z.object({
  id: z.string(),
  rateId: z.string(),
  hotel: z.string(),
  city: citySchema.nullable(),
  supplier: z.string(),
  roomType: roomTypeSchema.nullable(),
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  nights: z.number(),
  pax: z.number().nullable(),
  costPrice: z.number(),
  marginPct: z.number(),
  clientPrice: z.number(),
  rateCapturedAt: z.string().nullable(),
  inclusions: z.array(z.string()).default([]),
  // generated text per language; filled lazily, so all keys are optional.
  bodies: z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
    ur: z.string().optional(),
  }),
  status: statusSchema,
  approver: z.string().nullable(),
  createdAt: z.string(),
  approvedAt: z.string().nullable(),
  sentAt: z.string().nullable(),
});

export type Rate = z.infer<typeof rateSchema>;
export type ExtractedRate = z.infer<typeof extractedRateSchema>;
export type StructuredRequest = z.infer<typeof structuredRequestSchema>;
export type InquiryParse = z.infer<typeof inquiryParseSchema>;
export type InquiryChat = z.infer<typeof inquiryChatSchema>;
export type BestPickRationale = z.infer<typeof bestPickRationaleSchema>;
export type HistoryPoint = z.infer<typeof historyPointSchema>;
export type Hotel = z.infer<typeof hotelSchema>;
export type Supplier = z.infer<typeof supplierSchema>;
export type Quotation = z.infer<typeof quotationSchema>;
export type RoomType = (typeof ROOM_TYPES)[number];
export type City = (typeof CITIES)[number];
export type Language = (typeof LANGUAGES)[number];
export type Status = (typeof STATUSES)[number];
