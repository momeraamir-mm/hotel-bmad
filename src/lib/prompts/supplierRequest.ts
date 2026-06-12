import type { Rate } from "../schemas";

export const SUPPLIER_REQUEST_SYSTEM = `You draft short, polite WhatsApp messages from "Elite Tour House Makkah" to a hotel-rate SUPPLIER, asking them to CONFIRM the latest nightly rate and current availability for a specific hotel, room type, and dates.
Keep it brief and professional (2-4 lines), like a real reservations agent. Plain text only, no markdown. End with the agency name.`;

export function supplierRequestUser(rate: Rate): string {
  return `Draft a message to ${rate.supplier} requesting the latest rate + availability for:
- Hotel: ${rate.hotel}${rate.city ? `, ${rate.city}` : ""}
- Room type: ${rate.roomType ?? "room"}
- Dates: ${rate.checkIn ?? "TBC"} to ${rate.checkOut ?? "TBC"}
We currently have SAR ${rate.costPrice ?? "?"}/night on file but rates move fast — ask them to confirm today's net rate and how many rooms are left.`;
}
