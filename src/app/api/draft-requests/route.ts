import { NextResponse } from "next/server";
import { chatText } from "@/lib/groq/chat";
import { getWorkingRates } from "@/lib/store";
import { structuredRequestSchema } from "@/lib/schemas";
import { nights } from "@/lib/pricing";
import { SUPPLIER_BATCH_SYSTEM, supplierBatchUser } from "@/lib/prompts/supplierBatchRequest";

export const runtime = "nodejs";

/**
 * On a completed client request, auto-draft one rate-request per matching supplier
 * (grouped across the hotels they quote). Drafts only — nothing is "sent" here.
 */
export async function POST(req: Request) {
  try {
    const request = structuredRequestSchema.parse((await req.json()).request);
    if (!request.roomType || !request.checkIn || !request.checkOut) {
      return NextResponse.json({ ok: false, error: "Request is not complete." }, { status: 400 });
    }

    const matching = getWorkingRates().filter(
      (r) =>
        r.roomType === request.roomType &&
        (request.city ? r.city === request.city : true) &&
        r.costPrice != null,
    );

    // Group matching rates by supplier, keeping the hotel ↔ rate mapping so the UI
    // can show removable hotel chips that reliably drive what's actually requested.
    const bySupplier = new Map<string, { rateId: string; hotel: string }[]>();
    for (const r of matching) {
      if (!bySupplier.has(r.supplier)) bySupplier.set(r.supplier, []);
      bySupplier.get(r.supplier)!.push({ rateId: r.id, hotel: r.hotel });
    }

    const drafts = await Promise.all(
      [...bySupplier.entries()].map(async ([supplier, rateRows]) => {
        const hotels = [...new Set(rateRows.map((x) => x.hotel))];
        const message = await chatText({
          system: SUPPLIER_BATCH_SYSTEM,
          user: supplierBatchUser({
            supplier,
            hotels,
            roomType: request.roomType!,
            checkIn: request.checkIn!,
            checkOut: request.checkOut!,
            nights: nights(request.checkIn, request.checkOut),
            pax: request.pax,
          }),
          label: "draft-requests",
          temperature: 0.4,
        });
        return { supplier, rates: rateRows, message };
      }),
    );

    return NextResponse.json({ ok: true, data: { drafts } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Could not draft supplier requests." },
      { status: 500 },
    );
  }
}
