import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/groq/chat";
import { MODELS } from "@/lib/groq/client";
import { inquiryParseSchema } from "@/lib/schemas";
import { PARSE_INQUIRY_SYSTEM, parseInquiryUser } from "@/lib/prompts/parseInquiry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ ok: false, error: "Inquiry text is empty." }, { status: 400 });
    }
    const data = await chatJSON({
      schema: inquiryParseSchema,
      system: PARSE_INQUIRY_SYSTEM,
      user: parseInquiryUser(text),
      model: MODELS.fast,
      label: "parse-inquiry",
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Failed to parse inquiry." },
      { status: 500 },
    );
  }
}
