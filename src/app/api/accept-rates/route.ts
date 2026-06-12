import { NextResponse } from "next/server";
import { addAcceptedRates } from "@/lib/store";
import { rateSchema } from "@/lib/schemas";
import { z } from "zod";

export const runtime = "nodejs";

/** Persist user-accepted (extracted + corrected) rates into the session store. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rates = z.array(rateSchema).parse(body.rates);
    addAcceptedRates(rates);
    return NextResponse.json({ ok: true, data: { count: rates.length } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Could not accept rates." },
      { status: 400 },
    );
  }
}
