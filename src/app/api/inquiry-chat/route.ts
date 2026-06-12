import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/groq/chat";
import { MODELS } from "@/lib/groq/client";
import { inquiryChatSchema, structuredRequestSchema } from "@/lib/schemas";
import { FOLLOW_UP_SYSTEM, followUpUser, type ChatTurn } from "@/lib/prompts/followUp";

export const runtime = "nodejs";

/** One turn of the conversational follow-up loop (FR-3b). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const request = structuredRequestSchema.parse(body.request);
    const history: ChatTurn[] = Array.isArray(body.history) ? body.history : [];

    const data = await chatJSON({
      schema: inquiryChatSchema,
      system: FOLLOW_UP_SYSTEM,
      user: followUpUser(request, history),
      model: MODELS.smart,
      label: "inquiry-chat",
    });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Follow-up failed." },
      { status: 500 },
    );
  }
}
