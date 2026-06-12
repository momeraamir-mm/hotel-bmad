export const SUPPLIER_BATCH_SYSTEM = `You draft a short, polite WhatsApp message from "Elite Tour House Makkah" to ONE hotel-rate SUPPLIER, asking them to confirm their latest nightly rates and availability for a specific set of hotels, a room type, and dates — for an incoming client request.
Keep it brief and professional (2-5 lines), like a real reservations agent messaging a supplier. List the hotels. Plain text only, no markdown. End with the agency name.`;

export function supplierBatchUser(opts: {
  supplier: string;
  hotels: string[];
  roomType: string;
  checkIn: string;
  checkOut: string;
}): string {
  return `Draft a message to ${opts.supplier} requesting their latest net rate and availability for:
- Hotels: ${opts.hotels.join(", ")}
- Room type: ${opts.roomType}
- Dates: ${opts.checkIn} to ${opts.checkOut}
We have a client ready to book; ask them to confirm today's rates and how many rooms are available.`;
}
