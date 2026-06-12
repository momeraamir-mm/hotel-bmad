import Groq from "groq-sdk";

/**
 * Server-only Groq client singleton + model registry + timeout wrapper.
 * NEVER import this from a client component — it reads the secret key.
 */

declare global {
  // eslint-disable-next-line no-var
  var __groqClient: Groq | undefined;
}

export function getGroq(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set. Copy .env.example to .env.local and add your key.");
  }
  if (!global.__groqClient) {
    global.__groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return global.__groqClient;
}

/** Model registry — verified live against the Groq account (2026-06-11). */
export const MODELS = {
  /** Extraction, best-pick rationale, quotation generation/translation. */
  smart: "llama-3.3-70b-versatile",
  /** Light inquiry parsing. */
  fast: "llama-3.1-8b-instant",
  /** Voice transcription. */
  whisper: "whisper-large-v3",
} as const;

/** Wrap a promise with a timeout so a hung model call never blocks the demo. */
export async function withTimeout<T>(p: Promise<T>, ms = 30000, label = "groq"): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
