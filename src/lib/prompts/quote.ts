import type { Language, Quotation } from "../schemas";
import { LANGUAGE_NATIVE } from "../i18n";

export function quoteSystem(lang: Language): string {
  return `You write professional, warm, concise hotel quotations for "Elite Tour House Makkah", an Umrah travel agency.
Write the ENTIRE quotation in ${LANGUAGE_NATIVE[lang]}.
Use a clean, client-ready layout (plain text, no markdown code fences). Include a friendly greeting, the hotel and stay details, the total and per-night client price in SAR, what's included, a short validity note (rates subject to availability/change), and a courteous closing with the agency name and phone +966 56 736 8048.
Do NOT change any numbers you are given. Do NOT add fees. Keep it under ~180 words.`;
}

export function quoteUser(q: {
  hotel: string;
  city: Quotation["city"];
  roomType: Quotation["roomType"];
  checkIn: string | null;
  checkOut: string | null;
  nights: number;
  pax: number | null;
  marginPct: number;
  clientPricePerNight: number;
  totalClientPrice: number;
  inclusions: string[];
}): string {
  return `Quotation facts (use exactly, do not alter numbers):
- Hotel: ${q.hotel}${q.city ? `, ${q.city}` : ""}
- Room type: ${q.roomType ?? "Room"}
- Check-in: ${q.checkIn ?? "TBC"}  Check-out: ${q.checkOut ?? "TBC"}
- Nights: ${q.nights}
- Guests: ${q.pax ?? "TBC"}
- Client price per night: SAR ${q.clientPricePerNight}
- Total client price (${q.nights} nights): SAR ${q.totalClientPrice}
- Included: ${q.inclusions.length ? q.inclusions.join(", ") : "Room only"}`;
}
