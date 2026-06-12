import { NextResponse } from "next/server";
import { chatText } from "@/lib/groq/chat";
import { getRateById, setRateOverride } from "@/lib/store";
import { simulateSupplierReply } from "@/lib/supplierSim";
import { SUPPLIER_REPLY_SYSTEM, supplierReplyUser } from "@/lib/prompts/supplierReply";

export const runtime = "nodejs";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

// Generic words that don't distinguish one Makkah hotel from another.
const STOP = new Set([
  "makkah", "mecca", "hotel", "hotels", "tower", "towers", "the", "and", "suites",
  "royal", "clock", "house", "jabal", "omar", "kaaba", "district", "international",
]);

const hotelTokens = (hotel: string) =>
  norm(hotel)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !["al", "by"].includes(w));

/** Is this hotel still referenced in the (possibly edited) outreach message? */
const mentioned = (hotel: string, message: string) => {
  const toks = hotelTokens(hotel);
  if (toks.length === 0) return true; // can't tell → keep it
  const m = norm(message);
  return toks.some((t) => m.includes(t));
};

/**
 * One supplier's reply arriving (replies come in asynchronously, not all at once).
 * Refreshes that supplier's rates and returns their WhatsApp-style reply + changes.
 * If an edited `message` is provided, only hotels still named in it are quoted back —
 * so removing a hotel from the request removes it from the reply.
 */
export async function POST(req: Request) {
  try {
    const { supplier, rateIds, message } = (await req.json()) as {
      supplier: string;
      rateIds: string[];
      message?: string;
    };
    if (!supplier || !Array.isArray(rateIds) || rateIds.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing supplier or rates." }, { status: 400 });
    }

    // Honor an edited outreach message: drop hotels the user removed from the text.
    let effectiveIds = rateIds;
    if (typeof message === "string" && message.trim()) {
      const kept = rateIds.filter((id) => {
        const rate = getRateById(id);
        return rate ? mentioned(rate.hotel, message) : false;
      });
      if (kept.length > 0) effectiveIds = kept; // never reply with nothing
    }

    const capturedAt = new Date().toISOString();
    const changes: {
      hotel: string;
      oldCost: number;
      newCost: number;
      costDelta: number;
      oldAvail: number;
      newAvail: number;
    }[] = [];
    const lines: { hotel: string; cost: number; avail: number; incl: string[] }[] = [];
    const refreshedIds: string[] = [];
    let roomType = "Double";
    let checkIn = "";
    let checkOut = "";

    for (const id of effectiveIds) {
      const rate = getRateById(id);
      if (!rate) continue;
      refreshedIds.push(id);
      const sim = simulateSupplierReply(rate);
      setRateOverride(id, { costPrice: sim.newCost, availability: sim.newAvail, capturedAt });
      changes.push({
        hotel: rate.hotel,
        oldCost: sim.oldCost,
        newCost: sim.newCost,
        costDelta: sim.costDelta,
        oldAvail: sim.oldAvail,
        newAvail: sim.newAvail,
      });
      lines.push({ hotel: rate.hotel, cost: sim.newCost, avail: sim.newAvail, incl: rate.inclusions });
      if (rate.roomType) roomType = rate.roomType;
      if (rate.checkIn) checkIn = rate.checkIn;
      if (rate.checkOut) checkOut = rate.checkOut;
    }

    let reply = "";
    try {
      reply = await chatText({
        system: SUPPLIER_REPLY_SYSTEM,
        user: supplierReplyUser({ supplier, roomType, checkIn, checkOut, lines }),
        label: "supplier-reply",
        temperature: 0.6,
      });
    } catch {
      reply = "(reply unavailable — rates updated)";
    }

    return NextResponse.json({ ok: true, data: { supplier, reply, changes, rateIds: refreshedIds } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Reply failed." },
      { status: 500 },
    );
  }
}
