import { z } from "zod";
import { getGroq, MODELS, withTimeout } from "./client";

/**
 * JSON-mode chat helper with zod validation + one corrective retry.
 * Enforces the PRD rule: never fabricate — if the model can't produce valid
 * structured data twice, the caller surfaces "needs review" rather than guessing.
 */
export async function chatJSON<T>(opts: {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  label?: string;
}): Promise<T> {
  const { schema, system, user, model = MODELS.smart, temperature = 0.1, label = "chatJSON" } = opts;
  const groq = getGroq();

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    const completion = await withTimeout(
      groq.chat.completions.create({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages,
      }),
      30000,
      label,
    );
    const raw = completion.choices[0]?.message?.content ?? "{}";
    // eslint-disable-next-line no-console
    console.log(`[groq] ${label} model=${model} attempt=${attempt} ${Date.now() - started}ms`);

    try {
      const parsed = JSON.parse(raw);
      return schema.parse(parsed);
    } catch (err) {
      if (attempt === 2) {
        throw new Error(`${label}: model output failed validation twice — ${(err as Error).message}`);
      }
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content:
          "That response was not valid against the required schema. Return ONLY a valid JSON object matching the schema exactly. Do not invent values — use null for anything you cannot determine.",
      });
    }
  }
  // unreachable
  throw new Error(`${label}: exhausted retries`);
}

/** Plain text chat (for free-form generation like a translated quotation body). */
export async function chatText(opts: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  label?: string;
}): Promise<string> {
  const { system, user, model = MODELS.smart, temperature = 0.3, label = "chatText" } = opts;
  const groq = getGroq();
  const started = Date.now();
  const completion = await withTimeout(
    groq.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    30000,
    label,
  );
  // eslint-disable-next-line no-console
  console.log(`[groq] ${label} model=${model} ${Date.now() - started}ms`);
  return completion.choices[0]?.message?.content ?? "";
}
