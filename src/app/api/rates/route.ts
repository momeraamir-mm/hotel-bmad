import { NextResponse } from "next/server";
import { getWorkingRates } from "@/lib/store";
import { HISTORY_BY_RATE } from "@/lib/seed/rates";

export const runtime = "nodejs";

/** Working rates (seed + accepted this session) + history map for trend. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    data: { rates: getWorkingRates(), history: HISTORY_BY_RATE },
  });
}
