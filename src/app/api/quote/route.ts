import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { chatText } from "@/lib/groq/chat";
import { getRateById, addQuotation, getQuotations, updateQuotation } from "@/lib/store";
import { clientPrice, nights } from "@/lib/pricing";
import { quoteSystem, quoteUser } from "@/lib/prompts/quote";
import { languageSchema, type Language, type Quotation } from "@/lib/schemas";

export const runtime = "nodejs";

async function generateBody(q: Quotation, lang: Language): Promise<string> {
  const perNight = clientPrice(q.costPrice, q.marginPct);
  const total = perNight * q.nights;
  return chatText({
    system: quoteSystem(lang),
    user: quoteUser({
      hotel: q.hotel,
      city: q.city,
      roomType: q.roomType,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      nights: q.nights,
      pax: q.pax,
      marginPct: q.marginPct,
      clientPricePerNight: perNight,
      totalClientPrice: total,
      inclusions: q.inclusions,
    }),
    label: `quote-${lang}`,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lang: Language = languageSchema.parse(body.lang ?? "en");

    // Toggle language on an existing quotation.
    if (body.quotationId) {
      const existing = getQuotations().find((q) => q.id === body.quotationId);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Quotation not found." }, { status: 404 });
      }
      if (!existing.bodies[lang]) {
        existing.bodies[lang] = await generateBody(existing, lang);
        updateQuotation(existing.id, { bodies: existing.bodies });
      }
      return NextResponse.json({ ok: true, data: existing });
    }

    // Create a new quotation from a rate.
    const rate = getRateById(body.rateId);
    if (!rate || rate.costPrice == null) {
      return NextResponse.json({ ok: false, error: "Rate not found or incomplete." }, { status: 400 });
    }
    const marginPct = typeof body.marginPct === "number" ? body.marginPct : 15;
    const n = nights(rate.checkIn, rate.checkOut);
    const perNight = clientPrice(rate.costPrice, marginPct);

    const q: Quotation = {
      id: randomUUID(),
      rateId: rate.id,
      hotel: rate.hotel,
      city: rate.city ?? null,
      supplier: rate.supplier,
      roomType: rate.roomType,
      checkIn: rate.checkIn,
      checkOut: rate.checkOut,
      nights: n,
      pax: typeof body.pax === "number" ? body.pax : null,
      costPrice: rate.costPrice,
      marginPct,
      clientPrice: perNight,
      rateCapturedAt: rate.capturedAt ?? null,
      inclusions: rate.inclusions,
      bodies: {},
      status: "Draft",
      approver: null,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      sentAt: null,
    };
    q.bodies[lang] = await generateBody(q, lang);
    addQuotation(q);
    return NextResponse.json({ ok: true, data: q });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Could not generate quotation." },
      { status: 500 },
    );
  }
}
