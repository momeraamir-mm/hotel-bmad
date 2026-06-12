"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Bell,
  Calendar,
  Users,
  Clock,
  MessageSquare,
  Sparkles,
  Loader2,
  PauseCircle,
  Play,
  Send,
} from "lucide-react";
import { LEAD_STATUSES, type Lead, type LeadFlag, type LeadStatus } from "@/lib/seed/leads";

const FLAG_META: Record<NonNullable<LeadFlag>, { label: string; tone: "red" | "amber" }> = {
  "supplier-replied": { label: "Supplier replied", tone: "red" },
  approval: { label: "Needs approval", tone: "red" },
  stale: { label: "Rate going stale", tone: "amber" },
  "client-waiting": { label: "Client waiting", tone: "amber" },
};

const toneChip: Record<"red" | "amber", string> = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
};
const toneDot: Record<"red" | "amber", string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
};

function fmtAge(h: number): string {
  if (h < 1) return "just now";
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function LeadCard({
  lead,
  onOpen,
  onApproveOutreach,
  highlighted,
}: {
  lead: Lead;
  onOpen: (l: Lead) => void;
  onApproveOutreach: (id: string) => void;
  highlighted: boolean;
}) {
  const flag = lead.flag ? FLAG_META[lead.flag] : null;
  const dates =
    lead.request.checkIn && lead.request.checkOut
      ? `${lead.request.checkIn.slice(5)} → ${lead.request.checkOut.slice(5)}`
      : "dates TBC";
  const atGate = lead.status === "Awaiting approval";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(lead)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(lead);
      }}
      className={`w-full cursor-pointer rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-brand/40 hover:shadow ${
        highlighted ? "border-brand ring-2 ring-brand/40" : "border-sand"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{lead.client}</p>
          <p className="truncate text-[11px] text-ink/45">
            {lead.id} · {lead.origin}
          </p>
        </div>
        {flag && <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${toneDot[flag.tone]}`} title={flag.label} />}
      </div>

      {/* Gate A — AI drafted supplier outreach, waiting for a human to send it (FR-22). */}
      {lead.needsOutreachApproval ? (
        <div className="mt-2 rounded-md bg-red-50 px-2 py-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-red-700">
            <PauseCircle className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.aiStatus ?? "Approve to message suppliers"}</span>
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApproveOutreach(lead.id);
            }}
            className="mt-1.5 flex w-full items-center justify-center gap-1 rounded bg-brand px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-brand-dark"
          >
            <Send className="h-3 w-3" /> Approve &amp; send to suppliers
          </button>
        </div>
      ) : (
        lead.aiStatus && (
          <p
            className={`mt-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
              atGate ? "bg-red-50 text-red-700" : "bg-brand/10 text-brand-dark"
            }`}
          >
            {atGate ? (
              <PauseCircle className="h-3 w-3 shrink-0" />
            ) : (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
            )}
            <span className="truncate">{lead.aiStatus}</span>
          </p>
        )
      )}

      <p className="mt-2 flex items-start gap-1 text-[11px] leading-snug text-ink/55">
        <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-ink/30" />
        <span className="line-clamp-2">{lead.preview}</span>
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/60">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-ink/35" /> {dates}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3 text-ink/35" /> {lead.request.pax ?? "?"} pax
          {lead.request.roomType ? ` · ${lead.request.roomType}` : ""}
        </span>
      </div>

      {flag && (
        <span className={`mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${toneChip[flag.tone]}`}>
          {flag.label}
          {lead.flag === "client-waiting" ? ` ${fmtAge(lead.ageHours)}` : ""}
        </span>
      )}

      <div className="mt-2.5 flex items-center justify-between border-t border-sand pt-2">
        {lead.owner ? (
          <span className="flex items-center gap-1.5 text-[11px] text-ink/70">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-[9px] font-semibold text-brand-dark">
              {initials(lead.owner)}
            </span>
            {lead.owner}
          </span>
        ) : (
          <span className="rounded border border-dashed border-amber-400 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            Unassigned
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-ink/40">
          <Clock className="h-3 w-3" /> {fmtAge(lead.ageHours)}
        </span>
      </div>
    </div>
  );
}

const SEED_ACTIVITY = [
  "Normalized 3 supplier replies for Ahmed Family · Sourcing rates",
  "Flagged Zainab Group — rate confirmed 5d ago, re-check before sending",
];

export function RequestsBoard({
  leads: initialLeads,
  onOpen,
  onNew,
}: {
  leads: Lead[];
  onOpen: (l: Lead) => void;
  onNew: () => void;
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activity, setActivity] = useState<string[]>(SEED_ACTIVITY);
  const [justMoved, setJustMoved] = useState<string | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const simSeq = useRef(1049);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const patch = (id: string, p: Partial<Lead>) =>
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const log = (line: string) => setActivity((a) => [line, ...a].slice(0, 6));
  const move = (id: string, p: Partial<Lead>) => {
    patch(id, p);
    setJustMoved(id);
  };
  const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  /**
   * The "watch it work" moment, in two phases with a human gate at each outward step.
   * Phase 1 (auto): parse the request, draft supplier outreach → STOP at Gate A.
   * Phase 2 (after a human approves outreach): source + normalize + compare + draft
   * the client quote → STOP at Gate B (the quote approval).
   */
  function runSimulation() {
    if (simRunning) return;
    setSimRunning(true);
    const id = `L-${(simSeq.current += 1)}`;
    const lead: Lead = {
      id,
      client: "Aisha Begum",
      origin: "Pakistan",
      preview: "Voice note (0:41, Urdu) — incoming on WhatsApp…",
      request: { city: "Makkah", hotelPreference: null, checkIn: null, checkOut: null, pax: null, roomType: null, notes: null, followUps: [] },
      status: "New",
      owner: null,
      ageHours: 0,
      flag: null,
      aiStatus: "Transcribing Urdu voice note…",
    };
    setLeads((ls) => [lead, ...ls]);
    setJustMoved(id);
    log("New WhatsApp from Aisha Begum (Urdu voice note)");

    at(1500, () => {
      patch(id, {
        request: { ...lead.request, pax: 3, roomType: "Double", checkIn: "2026-12-23", checkOut: "2026-12-27" },
        aiStatus: "Drafting requests to 4 suppliers…",
      });
      log("Parsed → 3 pax · Double · 23–27 Dec · Makkah");
    });
    // Gate A — AI has drafted the outreach; it does NOT message suppliers on its own.
    at(3000, () => {
      patch(id, { aiStatus: "4 supplier requests drafted — approve to send", needsOutreachApproval: true });
      log("⏸ 4 supplier requests drafted — awaiting your approval to send");
      setSimRunning(false);
    });
    at(4800, () => setJustMoved(null));
  }

  /** Human approved Gate A → the AI sources rates, compares, and drafts the quote. */
  function approveOutreach(id: string) {
    setSimRunning(true);
    move(id, { status: "Sourcing rates", needsOutreachApproval: false, owner: "You", aiStatus: "Messaging 4 suppliers…" });
    log("Approved → outreach sent to 4 suppliers");

    at(1500, () => {
      patch(id, { aiStatus: "2 of 4 rates in · normalizing…" });
      log("Barakah → Swissôtel DBL 1407 incl breakfast (normalized)");
    });
    at(2800, () => {
      patch(id, { aiStatus: "4 of 4 rates normalized" });
      log("Tawaf → Conrad 1320 · Gateway → Pullman 1390 (normalized)");
    });
    at(4200, () => {
      move(id, {
        status: "Ready to quote",
        flag: "supplier-replied",
        aiStatus: "Compared 4 rates · best pick Conrad (Haram 350m)",
        sourcedHotels: ["Conrad Makkah", "Swissôtel Makkah", "Pullman ZamZam Makkah", "Dar Al Tawhid InterContinental"],
      });
      log("Compared rates → best value: Conrad SAR 1320/night");
    });
    at(5700, () => {
      patch(id, { aiStatus: "Drafting quote (English + Arabic)…" });
      log("Drafting client quote with 15% margin…");
    });
    at(7300, () => {
      move(id, { status: "Awaiting approval", flag: "approval", aiStatus: "Quote ready for your approval — your move" });
      log("⏸ Draft quote ready — stopped for your approval");
      setSimRunning(false);
    });
    at(9200, () => setJustMoved(null));
  }

  const byStatus = (s: LeadStatus) => leads.filter((l) => l.status === s);

  const metrics = [
    { label: "Approve outreach", count: leads.filter((l) => l.needsOutreachApproval).length, tone: "red" as const },
    { label: "Supplier replies", count: leads.filter((l) => l.flag === "supplier-replied").length, tone: "red" as const },
    { label: "Awaiting approval", count: leads.filter((l) => l.flag === "approval").length, tone: "red" as const },
    { label: "Rates going stale", count: leads.filter((l) => l.flag === "stale").length, tone: "amber" as const },
    { label: "Unassigned", count: leads.filter((l) => l.owner === null).length, tone: "amber" as const },
  ].filter((m) => m.count > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Requests</h2>
          <p className="text-sm text-ink/60">
            Every client request in flight — the AI works each one in the background and flags the ones that need you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runSimulation}
            disabled={simRunning}
            className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand/15 disabled:opacity-60"
          >
            {simRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {simRunning ? "AI working…" : "Watch the AI work"}
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm"
          >
            <Plus className="h-4 w-4" /> New request
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Attention strip */}
        {metrics.length > 0 && (
          <div className="flex flex-wrap content-start items-center gap-2 rounded-xl border border-sand bg-white/60 px-4 py-3 lg:col-span-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-ink/50">
              <Bell className="h-4 w-4 text-brand" /> Needs attention
            </span>
            {metrics.map((m) => (
              <span
                key={m.label}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${toneChip[m.tone]}`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white ${toneDot[m.tone]}`}>
                  {m.count}
                </span>
                {m.label}
              </span>
            ))}
          </div>
        )}

        {/* AI activity feed — proof the board populates itself */}
        <div className="rounded-xl border border-sand bg-white/60 px-4 py-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink/50">
            <Sparkles className="h-4 w-4 text-brand" /> AI activity
          </p>
          <ul className="space-y-1">
            {activity.map((line, i) => (
              <li key={i} className={`flex items-start gap-1.5 text-[11px] leading-snug ${i === 0 ? "text-ink/80" : "text-ink/45"}`}>
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand/60" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pipeline lanes */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {LEAD_STATUSES.map((status) => {
          const items = byStatus(status);
          return (
            <div key={status} className="flex w-64 shrink-0 flex-col rounded-xl bg-sand/40 p-2">
              <div className="flex items-center justify-between px-1.5 py-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink/70">{status}</span>
                <span className="rounded-full bg-white px-1.5 text-[11px] font-medium text-ink/50">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2 px-0.5 pt-1">
                {items.length === 0 ? (
                  <p className="px-2 py-3 text-center text-[11px] text-ink/30">—</p>
                ) : (
                  items.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onOpen={onOpen}
                      onApproveOutreach={approveOutreach}
                      highlighted={justMoved === lead.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
