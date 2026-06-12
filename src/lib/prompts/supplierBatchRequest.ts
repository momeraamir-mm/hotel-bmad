export const SUPPLIER_BATCH_SYSTEM = `You draft a short, professional WhatsApp message from "Elite Tour House Makkah" to ONE hotel-rate SUPPLIER, requesting a quote for an incoming client booking.
The message MUST spell out every booking detail so the supplier can quote precisely: the hotel name(s), the exact room type, the check-in date, the check-out date, and the number of nights. Explicitly ask the supplier to quote their best NET rate PER ROOM PER NIGHT for that room type, and to confirm how many rooms are available for those dates.
Keep it brief and businesslike (3-6 lines), like a real reservations agent. Plain text only, no markdown. End with the agency name "Elite Tour House Makkah".`;

export function supplierBatchUser(opts: {
  supplier: string;
  hotels: string[];
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pax?: number | null;
}): string {
  return `Draft a rate-request message to ${opts.supplier}. Include these exact details:
- Hotel(s): ${opts.hotels.join(", ")}
- Room type: ${opts.roomType}
- Check-in: ${opts.checkIn}
- Check-out: ${opts.checkOut}
- Nights: ${opts.nights}${opts.pax ? `\n- Guests: ${opts.pax}` : ""}
Ask them to quote, for the ${opts.roomType} room: their best net rate per room per night, and how many rooms are available for these dates. We have a client ready to book.`;
}
