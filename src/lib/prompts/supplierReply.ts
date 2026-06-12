export const SUPPLIER_REPLY_SYSTEM = `You role-play a hotel-rate SUPPLIER replying on WhatsApp to a travel agency's rate request.
Write a SHORT, casual, slightly messy confirmation like a real supplier would: a brief greeting, then each hotel with its nightly rate (SAR) and rooms left. Plain text, no markdown. Abbreviations are fine (DBL, bf, pax). 2-5 lines total. Do NOT add commentary or change the numbers you are given.`;

export function supplierReplyUser(opts: {
  supplier: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  lines: { hotel: string; cost: number; avail: number; incl: string[] }[];
}): string {
  const items = opts.lines
    .map((l) => `${l.hotel}: SAR ${l.cost}/night, ${l.avail} rooms${l.incl.length ? ", " + l.incl.join("+") : ", room only"}`)
    .join("\n");
  return `You are ${opts.supplier}. Room type: ${opts.roomType}, dates ${opts.checkIn} to ${opts.checkOut}.
Confirm these (already updated) rates in your reply:
${items}`;
}
