"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Building2, ChevronDown, ChevronRight, Check, Radio, Clock, Pencil } from "lucide-react";
import type { StructuredRequest } from "@/lib/schemas";

type Draft = { supplier: string; hotels: string[]; rateIds: string[]; message: string };
type Change = {
  hotel: string;
  oldCost: number;
  newCost: number;
  costDelta: number;
  oldAvail: number;
  newAvail: number;
};
type Reply = { supplier: string; reply: string; changes: Change[] };

// Deterministic per-supplier delay so replies trickle in over a few seconds (not all at once).
function replyDelay(supplier: string, index: number): number {
  const hash = supplier.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 900 + index * 1300 + (hash % 1000);
}

export function SupplierAutoRequests({
  request,
  onRefreshed,
}: {
  request: StructuredRequest | null;
  onRefreshed: () => void;
}) {
  const complete = !!(request?.roomType && request?.checkIn && request?.checkOut);
  const key = complete
    ? `${request!.city ?? "any"}|${request!.roomType}|${request!.checkIn}|${request!.checkOut}`
    : "";

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [pending, setPending] = useState<string[]>([]); // suppliers awaiting reply
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const lastKey = useRef<string>("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  useEffect(() => {
    if (!complete || key === lastKey.current) return;
    lastKey.current = key;
    clearTimers();
    setReplies([]);
    setPending([]);
    setDrafts([]);
    setOpen(false);
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/draft-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request }),
        });
        const json = await res.json();
        if (json.ok) {
          setDrafts(json.data.drafts);
          setOpen(true); // surface the drafts so they can be reviewed/edited before sending
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [complete, key, request]);

  useEffect(() => clearTimers, []);

  async function fetchReply(draft: Draft) {
    try {
      const res = await fetch("/api/supplier-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier: draft.supplier, rateIds: draft.rateIds }),
      });
      const json = await res.json();
      if (json.ok) {
        setReplies((r) => [...r, json.data]);
        onRefreshed();
      }
    } finally {
      setPending((p) => p.filter((s) => s !== draft.supplier));
    }
  }

  /** A supplier is "sent" once it's awaiting a reply or has already replied. */
  function isSent(supplier: string) {
    return pending.includes(supplier) || replies.some((r) => r.supplier === supplier);
  }

  function editDraft(supplier: string, message: string) {
    setDrafts((ds) => ds.map((d) => (d.supplier === supplier ? { ...d, message } : d)));
  }

  function sendOne(draft: Draft) {
    if (isSent(draft.supplier)) return;
    setOpen(true);
    setPending((p) => [...p, draft.supplier]);
    const t = setTimeout(() => fetchReply(draft), replyDelay(draft.supplier, 0));
    timers.current.push(t);
  }

  function sendAll() {
    const remaining = drafts.filter((d) => !isSent(d.supplier));
    if (remaining.length === 0) return;
    setOpen(true);
    setPending((p) => [...p, ...remaining.map((d) => d.supplier)]);
    remaining.forEach((d, i) => {
      const t = setTimeout(() => fetchReply(d), replyDelay(d.supplier, i));
      timers.current.push(t);
    });
  }

  const supplierCount = drafts.length;
  const hotelCount = new Set(drafts.flatMap((d) => d.hotels)).size;
  const replyFor = (supplier: string) => replies.find((r) => r.supplier === supplier);
  const isPending = (supplier: string) => pending.includes(supplier);
  const totalUpdated = replies.reduce((n, r) => n + r.changes.length, 0);
  const unsentCount = drafts.filter((d) => !isSent(d.supplier)).length;
  const sentCount = supplierCount - unsentCount;
  const allDone = supplierCount > 0 && unsentCount === 0 && pending.length === 0;

  if (!complete) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink/40">
        <Radio className="h-4 w-4" />
        Complete the client request (city, dates, room type) — the AI will then auto-draft rate-requests to matching
        suppliers.
      </p>
    );
  }

  return (
    <div>
      {loading && (
        <p className="flex items-center gap-2 text-sm text-ink/60">
          <Loader2 className="h-4 w-4 animate-spin" /> The AI is drafting rate-requests to matching suppliers…
        </p>
      )}

      {!loading && drafts.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink/80">
              Auto-drafted <strong>{supplierCount}</strong> request{supplierCount > 1 ? "s" : ""} covering{" "}
              <strong>{hotelCount}</strong> hotel{hotelCount > 1 ? "s" : ""}.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {pending.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800">
                  <Clock className="h-4 w-4 animate-pulse" /> Awaiting {pending.length} repl{pending.length > 1 ? "ies" : "y"}…
                </span>
              )}
              {allDone && (
                <span className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
                  <Check className="h-4 w-4" /> {replies.length} replies · {totalUpdated} rates updated
                </span>
              )}
              {unsentCount > 0 && (
                <button
                  onClick={sendAll}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white"
                >
                  <Send className="h-4 w-4" /> Send {unsentCount === supplierCount ? "all" : `remaining (${unsentCount})`}
                </button>
              )}
            </div>
          </div>

          <button onClick={() => setOpen((o) => !o)} className="mt-2 flex items-center gap-1 text-xs text-brand-dark">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {open ? "Hide" : "Show"} conversation{sentCount > 0 ? " & responses" : " (drafts)"}
          </button>

          {open && (
            <div className="mt-2 space-y-3">
              {drafts.map((d) => {
                const r = replyFor(d.supplier);
                const waiting = isPending(d.supplier);
                const editable = !waiting && !r; // still a draft → editable + sendable
                return (
                  <div key={d.supplier} className="rounded-lg border border-sand bg-cream/30 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                      <Building2 className="h-3.5 w-3.5 text-brand" /> {d.supplier}
                      {waiting && <span className="font-normal text-amber-700">· awaiting reply…</span>}
                      {r && <span className="font-normal text-green-700">· sent</span>}
                    </p>
                    <div className="flex justify-end">
                      <div className="w-[85%] rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-[11px] text-white">
                        <span className="mb-0.5 flex items-center justify-between text-[9px] uppercase tracking-wide text-white/50">
                          <span>Elite → supplier</span>
                          {editable && (
                            <span className="flex items-center gap-1 normal-case tracking-normal text-white/60">
                              <Pencil className="h-3 w-3" /> editable
                            </span>
                          )}
                        </span>
                        {editable ? (
                          <textarea
                            value={d.message}
                            onChange={(e) => editDraft(d.supplier, e.target.value)}
                            rows={Math.max(3, d.message.split("\n").length)}
                            aria-label={`Edit message to ${d.supplier}`}
                            className="w-full resize-y rounded-md border border-white/15 bg-white/5 px-2 py-1.5 font-sans text-[11px] leading-snug text-white outline-none transition focus:border-white/40"
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans">{d.message}</pre>
                        )}
                        {editable && (
                          <div className="mt-1.5 flex justify-end">
                            <button
                              onClick={() => sendOne(d)}
                              className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-white/25"
                            >
                              <Send className="h-3 w-3" /> Send to {d.supplier.split(" ")[0]}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {waiting && (
                      <div className="mt-2 flex justify-start">
                        <span className="rounded-2xl bg-white px-3 py-1.5 text-xs text-ink/40 shadow-sm">
                          <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> typing…
                        </span>
                      </div>
                    )}
                    {r && (
                      <div className="mt-2 flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[11px] text-ink shadow-sm">
                          <span className="mb-0.5 block text-[9px] uppercase tracking-wide text-ink/40">{d.supplier} replied</span>
                          <pre className="whitespace-pre-wrap font-sans">{r.reply}</pre>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {r.changes.map((c, i) => (
                              <span key={i} className="rounded bg-sand px-1.5 py-0.5 text-[10px] text-ink/70">
                                {c.hotel.split(" ").slice(0, 2).join(" ")}: {c.oldCost}→
                                <span className={c.costDelta > 0 ? "text-red-600" : c.costDelta < 0 ? "text-green-700" : ""}>
                                  {c.newCost}
                                </span>{" "}
                                · {c.oldAvail}→{c.newAvail} rms
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-2 text-[11px] italic text-ink/45">
            AI drafts → you review &amp; edit → send. Edit any message above before sending. Replies come back over time
            (here simulated with realistic delays); each reply refreshes that supplier&apos;s rates in the comparison below.
          </p>
        </div>
      )}

      {!loading && drafts.length === 0 && (
        <p className="text-sm text-ink/40">No matching suppliers found for this request yet.</p>
      )}
    </div>
  );
}
