"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Type, Loader2, MessageSquareQuote, Wand2, Upload, Square, MessagesSquare, Send, Check } from "lucide-react";
import { ROOM_TYPES, CITIES, type StructuredRequest, type RoomType, type City } from "@/lib/schemas";
import { SAMPLE_INQUIRY_TEXT, SAMPLE_INQUIRY_VAGUE } from "@/lib/seed/samples";

type ChatTurn = { role: "assistant" | "customer"; content: string };

type Props = {
  request: StructuredRequest | null;
  setRequest: (r: StructuredRequest | null) => void;
};

const empty: StructuredRequest = {
  city: "Makkah",
  hotelPreference: null,
  checkIn: null,
  checkOut: null,
  pax: null,
  roomType: null,
  notes: null,
  followUps: [],
};

export function InquiryIntake({ request, setRequest }: Props) {
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [answer, setAnswer] = useState("");
  const [chatting, setChatting] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDone, setChatDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function pickMime(): { mime: string; ext: string } {
    const candidates = [
      { mime: "audio/webm", ext: "webm" },
      { mime: "audio/ogg", ext: "ogg" },
      { mime: "audio/mp4", ext: "mp4" },
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) return c;
    }
    return { mime: "", ext: "webm" };
  }

  async function startRecording() {
    setError(null);
    setTranscript(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mime, ext } = pickMime();
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || mime || "audio/webm" });
        const file = new File([blob], `recording.${ext}`, { type: blob.type });
        transcribe(file);
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access was denied or is unavailable. You can upload an audio file instead.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function parseText() {
    setLoading(true);
    setError(null);
    resetChat();
    try {
      const res = await fetch("/api/parse-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setRequest(json.data.request);
      setSummary(json.data.summary);
      await maybeFollowUp(json.data.request);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function transcribe(file: File) {
    setLoading(true);
    setError(null);
    setTranscript(null);
    resetChat();
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setTranscript(json.data.transcript);
      if (json.data.parse) {
        setRequest(json.data.parse.request);
        setSummary(json.data.parse.summary);
        await maybeFollowUp(json.data.parse.request);
      } else {
        setError("Transcribed, but could not parse a request. Edit fields manually below.");
        setRequest(empty);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof StructuredRequest>(key: K, value: StructuredRequest[K]) {
    if (!request) return;
    setRequest({ ...request, [key]: value });
  }

  function requiredMissing(r: StructuredRequest): boolean {
    return r.city == null || r.checkIn == null || r.checkOut == null || r.pax == null || r.roomType == null;
  }

  function resetChat() {
    setChat([]);
    setChatting(false);
    setChatDone(false);
    setAnswer("");
  }

  /** Kick off the conversational follow-up loop if required fields are missing. */
  async function maybeFollowUp(r: StructuredRequest) {
    if (!requiredMissing(r)) return;
    setChatting(true);
    setChatLoading(true);
    try {
      const res = await fetch("/api/inquiry-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: r, history: [] }),
      });
      const json = await res.json();
      if (json.ok) {
        setRequest(json.data.request);
        setSummary(json.data.summary);
        if (json.data.nextQuestion) setChat([{ role: "assistant", content: json.data.nextQuestion }]);
        if (json.data.done) {
          setChatDone(true);
          setChatting(false);
        }
      }
    } finally {
      setChatLoading(false);
    }
  }

  async function sendAnswer() {
    if (!answer.trim() || !request) return;
    const history = [...chat, { role: "customer", content: answer.trim() } as ChatTurn];
    setChat(history);
    setAnswer("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/inquiry-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, history }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        return;
      }
      setRequest(json.data.request);
      setSummary(json.data.summary);
      if (json.data.done) {
        setChat((c) => [...c, { role: "assistant", content: "Perfect — I have everything I need. Let me find the best options." }]);
        setChatDone(true);
        setChatting(false);
      } else if (json.data.nextQuestion) {
        setChat((c) => [...c, { role: "assistant", content: json.data.nextQuestion }]);
      }
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/70">
          <MessageSquareQuote className="h-4 w-4 text-brand" /> 1 · Client Inquiry
        </h2>
        <div className="flex rounded-lg bg-sand p-0.5 text-xs">
          <button
            onClick={() => setMode("text")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${mode === "text" ? "bg-white shadow-sm" : "text-ink/60"}`}
          >
            <Type className="h-3.5 w-3.5" /> Text
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${mode === "voice" ? "bg-white shadow-sm" : "text-ink/60"}`}
          >
            <Mic className="h-3.5 w-3.5" /> Voice
          </button>
        </div>
      </div>

      {mode === "text" ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Paste the client's message…"
            className="w-full resize-none rounded-lg border border-sand bg-cream/50 p-3 text-sm outline-none focus:border-brand"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={parseText}
              disabled={loading || !text.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Understand request
            </button>
            <button onClick={() => setText(SAMPLE_INQUIRY_TEXT)} className="text-xs text-brand-dark underline">
              full sample
            </button>
            <button onClick={() => setText(SAMPLE_INQUIRY_VAGUE)} className="text-xs text-brand-dark underline">
              vague sample (triggers follow-ups)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm,.mp4"
            onChange={(e) => e.target.files?.[0] && transcribe(e.target.files[0])}
            className="hidden"
          />
          {recording ? (
            <button
              onClick={stopRecording}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-red-300 bg-red-50 px-3 py-6 text-sm font-medium text-red-700"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              <Square className="h-4 w-4 fill-red-600 text-red-600" />
              Recording… {fmtTime(recSeconds)} — click to stop
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={startRecording}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-brand/40 bg-cream/40 px-3 py-6 text-sm text-ink/70 hover:bg-cream disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5 text-brand" />}
                Record now
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand/40 bg-cream/40 px-3 py-6 text-sm text-ink/70 hover:bg-cream disabled:opacity-40"
              >
                <Upload className="h-5 w-5 text-brand" />
                Upload file
              </button>
            </div>
          )}
          <p className="text-[11px] text-ink/40">
            Record a voice note in the browser, or upload mp3 / m4a / wav / ogg / webm.
          </p>
          {transcript && (
            <p className="rounded-lg bg-sand/60 p-2 text-xs italic text-ink/70">“{transcript}”</p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {summary && (
        <p className="mt-3 rounded-lg border-l-2 border-brand bg-brand/5 px-3 py-2 text-sm text-ink/80">
          <span className="font-medium">Summary:</span> {summary}
        </p>
      )}

      {chatting && (
        <div className="mt-3 rounded-lg border border-brand/30 bg-brand/5 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-brand-dark">
            <MessagesSquare className="h-3.5 w-3.5" /> AI is collecting the missing details from the client
            <button onClick={() => setChatting(false)} className="ml-auto text-[11px] font-normal text-ink/50 underline">
              fill manually
            </button>
          </p>
          <div className="space-y-2">
            {chat.map((t, i) => (
              <div key={i} className={`flex ${t.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <span
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                    t.role === "assistant" ? "bg-white text-ink shadow-sm" : "bg-ink text-white"
                  }`}
                >
                  {t.content}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <span className="rounded-2xl bg-white px-3 py-1.5 text-sm text-ink/40 shadow-sm">
                  <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
              placeholder="Type the client's reply…"
              className="flex-1 rounded-lg border border-sand bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={sendAnswer}
              disabled={chatLoading || !answer.trim()}
              className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {chatDone && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          <Check className="h-4 w-4" /> Request complete — ready to compare.
        </p>
      )}

      {request && (
        <div className="mt-4 border-t border-sand pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="City" needsReview={request.city == null}>
              <select
                value={request.city ?? ""}
                onChange={(e) => update("city", (e.target.value || null) as City | null)}
                className="field"
              >
                <option value="">—</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Room type" needsReview={request.roomType == null}>
              <select
                value={request.roomType ?? ""}
                onChange={(e) => update("roomType", (e.target.value || null) as RoomType | null)}
                className="field"
              >
                <option value="">—</option>
                {ROOM_TYPES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Guests" needsReview={request.pax == null}>
              <input
                type="number"
                min={1}
                value={request.pax ?? ""}
                onChange={(e) => update("pax", e.target.value ? Number(e.target.value) : null)}
                className="field"
              />
            </Field>
            <Field label="Check-in" needsReview={request.checkIn == null}>
              <input
                type="date"
                value={request.checkIn ?? ""}
                onChange={(e) => update("checkIn", e.target.value || null)}
                className="field"
              />
            </Field>
            <Field label="Check-out" needsReview={request.checkOut == null}>
              <input
                type="date"
                value={request.checkOut ?? ""}
                onChange={(e) => update("checkOut", e.target.value || null)}
                className="field"
              />
            </Field>
            <Field label="Hotel pref." needsReview={false}>
              <input
                value={request.hotelPreference ?? ""}
                onChange={(e) => update("hotelPreference", e.target.value || null)}
                className="field"
                placeholder="any"
              />
            </Field>
          </div>

          {request.followUps?.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <p className="mb-1 font-medium">Suggested follow-up questions:</p>
              <ul className="list-inside list-disc space-y-0.5">
                {request.followUps.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        :global(.field) {
          width: 100%;
          border: 1px solid var(--color-sand);
          border-radius: 0.5rem;
          padding: 0.4rem 0.5rem;
          font-size: 0.8rem;
          background: #fff;
          outline: none;
        }
        :global(.field:focus) {
          border-color: var(--color-brand);
        }
      `}</style>
    </section>
  );
}

function Field({ label, needsReview, children }: { label: string; needsReview: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-ink/50">
        {label}
        {needsReview && <span className="rounded bg-amber-200 px-1 text-[9px] text-amber-800">needs review</span>}
      </span>
      {children}
    </label>
  );
}
