import { NextResponse } from "next/server";
import { chatText } from "@/lib/groq/chat";
import { getRateById, setRateOverride } from "@/lib/store";
import { SUPPLIER_REQUEST_SYSTEM, supplierRequestUser } from "@/lib/prompts/supplierRequest";
import { simulateSupplierReply } from "@/lib/supplierSim";

export const runtime = "nodejs";

/**
 * Simulated supplier re-check (FR for rate freshness). The AI drafts the real
 * rate-request message to the supplier; the "reply" is simulated deterministically
 * (rates drift, availability changes) and the rate is refreshed + re-timestamped.
 */
export async function POST(req: Request) {
  try {
    const { rateId } = await req.json();
    const rate = getRateById(rateId);
    if (!rate) {
      return NextResponse.json({ ok: false, error: "Rate not found." }, { status: 404 });
    }

    // 1. AI drafts the supplier rate-request message (the "AI drafts supplier messages" capability).
    const draftMessage = await chatText({
      system: SUPPLIER_REQUEST_SYSTEM,
      user: supplierRequestUser(rate),
      label: "supplier-request",
      temperature: 0.4,
    });

    // 2. Simulated supplier reply (deterministic drift), then refresh the rate.
    const sim = simulateSupplierReply(rate);
    const capturedAt = new Date().toISOString();
    setRateOverride(rateId, { costPrice: sim.newCost, availability: sim.newAvail, capturedAt });

    return NextResponse.json({ ok: true, data: { draftMessage, change: sim } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Re-check failed." },
      { status: 500 },
    );
  }
}
