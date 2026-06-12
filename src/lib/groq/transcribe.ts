import { getGroq, MODELS, withTimeout } from "./client";

/** Transcribe an uploaded audio file via Groq Whisper. */
export async function transcribeAudio(file: File): Promise<string> {
  const groq = getGroq();
  const started = Date.now();
  const result = await withTimeout(
    groq.audio.transcriptions.create({
      file,
      model: MODELS.whisper,
      response_format: "text",
    }) as Promise<unknown>,
    45000,
    "transcribe",
  );
  // eslint-disable-next-line no-console
  console.log(`[groq] transcribe model=${MODELS.whisper} ${Date.now() - started}ms`);
  // With response_format "text" the SDK returns a string; be defensive.
  if (typeof result === "string") return result;
  const obj = result as { text?: string };
  return obj.text ?? "";
}
