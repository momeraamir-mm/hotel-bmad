import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { chatJSON } from "@/lib/groq/chat";
import { extractionResultSchema, type Rate } from "@/lib/schemas";
import { EXTRACT_SYSTEM, extractUser } from "@/lib/prompts/extract";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ ok: false, error: "Supplier message is empty." }, { status: 400 });
    }

    const result = await chatJSON({
      schema: extractionResultSchema,
      system: EXTRACT_SYSTEM,
      user: extractUser(text),
      label: "extract-rates",
    });

    const rates: Rate[] = result.rates.map((r) => ({
      id: randomUUID(),
      hotel: r.hotel ?? "(unknown hotel)",
      city: r.city ?? null,
      supplier: r.supplier ?? "(unknown supplier)",
      roomType: r.roomType,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      costPrice: r.costPrice,
      inclusions: r.inclusions ?? [],
      availability: r.availability,
      source: "extracted",
      capturedAt: new Date().toISOString(), // just received from the supplier
    }));

    return NextResponse.json({ ok: true, data: { rates } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Extraction failed." },
      { status: 500 },
    );
  }
}
