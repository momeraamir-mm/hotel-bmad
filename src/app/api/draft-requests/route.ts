import { NextResponse } from "next/server";
import { chatText } from "@/lib/groq/chat";
import { getWorkingRates } from "@/lib/store";
import { structuredRequestSchema } from "@/lib/schemas";
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

    // Group matching rates by supplier.
    const bySupplier = new Map<string, { hotels: Set<string>; rateIds: string[] }>();
    for (const r of matching) {
      if (!bySupplier.has(r.supplier)) bySupplier.set(r.supplier, { hotels: new Set(), rateIds: [] });
      const g = bySupplier.get(r.supplier)!;
      g.hotels.add(r.hotel);
      g.rateIds.push(r.id);
    }

    const drafts = await Promise.all(
      [...bySupplier.entries()].map(async ([supplier, g]) => {
        const hotels = [...g.hotels];
        const message = await chatText({
          system: SUPPLIER_BATCH_SYSTEM,
          user: supplierBatchUser({
            supplier,
            hotels,
            roomType: request.roomType!,
            checkIn: request.checkIn!,
            checkOut: request.checkOut!,
          }),
          label: "draft-requests",
          temperature: 0.4,
        });
        return { supplier, hotels, rateIds: g.rateIds, message };
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
