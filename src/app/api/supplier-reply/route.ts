import { NextResponse } from "next/server";
import { chatText } from "@/lib/groq/chat";
import { getRateById, setRateOverride } from "@/lib/store";
import { simulateSupplierReply } from "@/lib/supplierSim";
import { SUPPLIER_REPLY_SYSTEM, supplierReplyUser } from "@/lib/prompts/supplierReply";

export const runtime = "nodejs";

/**
 * One supplier's reply arriving (replies come in asynchronously, not all at once).
 * Refreshes that supplier's rates and returns their WhatsApp-style reply + changes.
 */
export async function POST(req: Request) {
  try {
    const { supplier, rateIds } = (await req.json()) as { supplier: string; rateIds: string[] };
    if (!supplier || !Array.isArray(rateIds) || rateIds.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing supplier or rates." }, { status: 400 });
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
    let roomType = "Double";
    let checkIn = "";
    let checkOut = "";

    for (const id of rateIds) {
      const rate = getRateById(id);
      if (!rate) continue;
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

    return NextResponse.json({ ok: true, data: { supplier, reply, changes } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Reply failed." },
      { status: 500 },
    );
  }
}
