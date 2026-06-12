"use client";

import { useMemo, useState } from "react";
import { Loader2, Trophy, TrendingUp, TrendingDown, Minus, Sparkles, FileText, Lock, RefreshCw, MessageSquare, X } from "lucide-react";
import type { HistoryPoint, Rate, StructuredRequest } from "@/lib/schemas";
import { compareRates, type CompareCriteria } from "@/lib/compare";
import { profit, trend, nights, freshness, type Freshness } from "@/lib/pricing";
import { Sparkline } from "./Sparkline";

const FRESH_STYLE: Record<Freshness["label"], string> = {
  fresh: "bg-green-100 text-green-700",
  aging: "bg-amber-100 text-amber-700",
  stale: "bg-red-100 text-red-700",
  unknown: "bg-sand text-ink/50",
};

type Props = {
  rates: Rate[];
  history: Record<string, HistoryPoint[]>;
  request: StructuredRequest | null;
  marginPct: number;
  setMarginPct: (n: number) => void;
  onGenerateQuote: (rateId: string) => void;
  generatingRateId: string | null;
  onRechecked: () => void;
};

const sar = (n: number | null) => (n == null ? "—" : `SAR ${n.toLocaleString()}`);

export function ComparisonPanel({
  rates,
  history,
  request,
  marginPct,
  setMarginPct,
  onGenerateQuote,
  generatingRateId,
  onRechecked,
}: Props) {
  const [ran, setRan] = useState(false);
  const [rationale, setRationale] = useState<string | null>(null);
  const [tradeoff, setTradeoff] = useState<string | null>(null);
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<
    | { message: string; hotel: string; supplier: string; costDelta: number; oldAvail: number; newAvail: number }
    | null
  >(null);

  const nowMs = Date.now();

  async function recheck(rate: Rate) {
    setRecheckingId(rate.id);
    try {
      const res = await fetch("/api/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rateId: rate.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setDraft({
          message: json.data.draftMessage,
          hotel: rate.hotel,
          supplier: rate.supplier,
          costDelta: json.data.change.costDelta,
          oldAvail: json.data.change.oldAvail,
          newAvail: json.data.change.newAvail,
        });
        onRechecked();
      }
    } finally {
      setRecheckingId(null);
    }
  }

  const canRun = !!(request?.roomType && request?.checkIn && request?.checkOut);

  const criteria: CompareCriteria | null = canRun
    ? {
        roomType: request!.roomType!,
        checkIn: request!.checkIn!,
        checkOut: request!.checkOut!,
        city: request!.city,
        hotelPreference: request!.hotelPreference,
      }
    : null;

  const result = useMemo(
    () => (criteria ? compareRates(rates, criteria, marginPct) : null),
    [rates, criteria, marginPct],
  );

  const stayNights = useMemo(
    () => nights(request?.checkIn ?? null, request?.checkOut ?? null),
    [request?.checkIn, request?.checkOut],
  );

  async function run() {
    if (!result) return;
    setRan(true);
    setLoadingRationale(true);
    setRationale(null);
    setTradeoff(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: result.rows, bestPickId: result.bestPickId }),
      });
      const json = await res.json();
      if (json.ok) {
        setRationale(json.data.rationale);
        setTradeoff(json.data.tradeoff ?? null);
      }
    } finally {
      setLoadingRationale(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand bg-gradient-to-r from-brand/10 to-transparent px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/80">
          <Trophy className="h-4 w-4 text-brand" /> 3 · Rate Comparison Intelligence
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-ink/70">
            Margin
            <input
              type="range"
              min={0}
              max={40}
              value={marginPct}
              onChange={(e) => setMarginPct(Number(e.target.value))}
              className="accent-brand"
            />
            <span className="w-9 font-semibold text-ink">{marginPct}%</span>
          </label>
          <button
            onClick={run}
            disabled={!canRun}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" /> Run comparison
          </button>
        </div>
      </div>

      {!canRun && (
        <div className="flex items-center gap-2 px-5 py-8 text-sm text-ink/50">
          <Lock className="h-4 w-4" />
          Resolve the client request first — <strong className="mx-1">Room type</strong> and{" "}
          <strong className="mx-1">dates</strong> are required before comparing.
        </div>
      )}

      {canRun && result && (
        <div className="px-3 py-3 sm:px-5">
          {/* Savings + best pick rationale banner */}
          {ran && result.bestPickId && (
            <div className="mb-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Trophy className="h-4 w-4 text-brand" /> Best Pick recommended
                </p>
                {result.savingsVsNext != null && result.savingsVsNext > 0 && (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                    Save {sar(result.savingsVsNext)}/night vs {result.nextBestLabel}
                  </span>
                )}
              </div>
              {loadingRationale ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> analyzing options…
                </p>
              ) : (
                rationale && <p className="mt-1 text-sm text-ink/80">{rationale}</p>
              )}
              {!loadingRationale && tradeoff && (
                <p className="mt-1 text-xs italic text-ink/55">Tradeoff: {tradeoff}</p>
              )}
            </div>
          )}

          {draft && (
            <div className="mb-3 rounded-xl border border-ink/15 bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink">
                <MessageSquare className="h-4 w-4 text-brand" /> Rate-request drafted for {draft.supplier} — {draft.hotel}
                <button onClick={() => setDraft(null)} className="ml-auto text-ink/40 hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-cream/60 p-2.5 text-xs text-ink/80">{draft.message}</pre>
              <p className="mt-2 text-xs text-ink/70">
                <span className="font-medium">Supplier confirmed (simulated):</span> rate{" "}
                <span className={draft.costDelta > 0 ? "text-red-600" : draft.costDelta < 0 ? "text-green-700" : ""}>
                  {draft.costDelta > 0 ? "+" : ""}{draft.costDelta === 0 ? "unchanged" : `SAR ${draft.costDelta}/night`}
                </span>
                , availability {draft.oldAvail} → {draft.newAvail} rooms. Rate refreshed just now.
              </p>
              <p className="mt-1 text-[11px] italic text-ink/45">
                In production this message is sent to the supplier on WhatsApp after human approval; here the reply is simulated.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink/45">
                  <th className="px-2 py-2">Hotel / Supplier</th>
                  <th className="px-2 py-2">Cost</th>
                  <th className="px-2 py-2">Client / night</th>
                  <th className="px-2 py-2">Total ({stayNights}n)</th>
                  <th className="px-2 py-2">Profit/n</th>
                  <th className="px-2 py-2">Incl.</th>
                  <th className="px-2 py-2">Rooms</th>
                  <th className="px-2 py-2">Trend</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => {
                  const t = trend(history[row.rate.id], row.rate.costPrice);
                  const best = row.isBestPick;
                  return (
                    <tr
                      key={row.rate.id}
                      className={`border-t border-sand ${best ? "bg-brand/10" : row.complete ? "" : "opacity-60"}`}
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5 font-medium text-ink">
                          {best && <Trophy className="h-3.5 w-3.5 text-brand" />}
                          {row.rate.hotel}
                        </div>
                        <div className="text-[11px] text-ink/50">
                          {row.rate.supplier}
                          {row.rate.city ? ` · ${row.rate.city}` : ""}
                          {row.rate.source === "extracted" ? " · new" : ""}
                        </div>
                        {(() => {
                          const f = freshness(row.rate.capturedAt, nowMs);
                          return (
                            <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${FRESH_STYLE[f.label]}`}>
                              {f.label === "stale" ? "stale" : f.label} · {f.ageText}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-2 text-ink/70">{sar(row.rate.costPrice)}</td>
                      <td className="px-2 py-2 font-semibold text-ink">{sar(row.clientPrice)}</td>
                      <td className="px-2 py-2 text-ink/70">
                        {row.clientPrice != null ? sar(row.clientPrice * stayNights) : "—"}
                      </td>
                      <td className="px-2 py-2 text-green-700">
                        {row.rate.costPrice != null ? sar(profit(row.rate.costPrice, marginPct)) : "—"}
                      </td>
                      <td className="px-2 py-2 text-[11px] text-ink/60">
                        {row.rate.inclusions.length ? row.rate.inclusions.join(", ") : "room only"}
                      </td>
                      <td className="px-2 py-2 text-ink/70">{row.rate.availability ?? "—"}</td>
                      <td className="px-2 py-2">
                        {t.hasHistory ? (
                          <div className="flex items-center gap-1.5">
                            <Sparkline series={t.series} />
                            <span
                              className={`flex items-center text-[11px] ${
                                t.direction === "up" ? "text-red-600" : t.direction === "down" ? "text-green-700" : "text-ink/50"
                              }`}
                            >
                              {t.direction === "up" ? <TrendingUp className="h-3 w-3" /> : t.direction === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {t.deltaPct != null && `${t.deltaPct > 0 ? "+" : ""}${t.deltaPct}%`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-ink/40">no history</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => recheck(row.rate)}
                            disabled={recheckingId === row.rate.id}
                            title="Re-check rate & availability with supplier"
                            className="flex items-center gap-1 rounded-md border border-sand px-2 py-1 text-xs text-ink/60 hover:bg-sand"
                          >
                            {recheckingId === row.rate.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Re-check
                          </button>
                          {row.complete && (
                            <button
                              onClick={() => onGenerateQuote(row.rate.id)}
                              disabled={generatingRateId === row.rate.id}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                                best ? "bg-ink text-white" : "border border-sand text-ink/70 hover:bg-sand"
                              }`}
                            >
                              {generatingRateId === row.rate.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FileText className="h-3.5 w-3.5" />
                              )}
                              Quote
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!ran && (
            <p className="mt-2 px-2 text-xs text-ink/45">
              Showing {result.rows.length} matching rates. Click <strong>Run comparison</strong> for the AI Best-Pick rationale.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
