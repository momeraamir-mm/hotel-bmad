import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/groq/transcribe";
import { chatJSON } from "@/lib/groq/chat";
import { MODELS } from "@/lib/groq/client";
import { inquiryParseSchema } from "@/lib/schemas";
import { PARSE_INQUIRY_SYSTEM, parseInquiryUser } from "@/lib/prompts/parseInquiry";

export const runtime = "nodejs";

const ALLOWED = ["mp3", "m4a", "wav", "ogg", "mpeg", "mpga", "webm", "flac", "mp4"];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "No audio file provided." }, { status: 400 });
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext && !ALLOWED.includes(ext)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported audio type ".${ext}". Use mp3, m4a, wav, or ogg.` },
        { status: 400 },
      );
    }

    const transcript = await transcribeAudio(file);
    if (!transcript.trim()) {
      return NextResponse.json(
        { ok: true, data: { transcript: "", parse: null, error: "Could not detect speech in the audio." } },
      );
    }

    // Resilience: if parsing fails, still return the transcript.
    let parse = null;
    try {
      parse = await chatJSON({
        schema: inquiryParseSchema,
        system: PARSE_INQUIRY_SYSTEM,
        user: parseInquiryUser(transcript),
        model: MODELS.fast,
        label: "transcribe-parse",
      });
    } catch {
      parse = null;
    }

    return NextResponse.json({ ok: true, data: { transcript, parse } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Transcription failed." },
      { status: 500 },
    );
  }
}
