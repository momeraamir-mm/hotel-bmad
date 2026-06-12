import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/groq/chat";
import { bestPickRationaleSchema } from "@/lib/schemas";
import { BEST_PICK_SYSTEM, bestPickUser } from "@/lib/prompts/bestPick";
import type { ComparedRow } from "@/lib/compare";

export const runtime = "nodejs";

/** Returns the AI rationale for an already-computed Best Pick. */
export async function POST(req: Request) {
  try {
    const { rows, bestPickId } = (await req.json()) as {
      rows: ComparedRow[];
      bestPickId: string | null;
    };
    if (!bestPickId || !rows?.length) {
      return NextResponse.json({ ok: false, error: "Nothing to compare." }, { status: 400 });
    }

    const data = await chatJSON({
      schema: bestPickRationaleSchema,
      system: BEST_PICK_SYSTEM,
      user: bestPickUser(rows, bestPickId),
      label: "best-pick",
      temperature: 0.2,
    });

    // Guard: never let the model swap the pick.
    data.rateId = bestPickId;
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Could not generate rationale." },
      { status: 500 },
    );
  }
}
