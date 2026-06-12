"use client";

import { useState } from "react";
import { Loader2, PackageCheck, AlertTriangle } from "lucide-react";
import { ROOM_TYPES, type Rate, type RoomType } from "@/lib/schemas";
import { SAMPLE_SUPPLIER_MESSAGES } from "@/lib/seed/samples";

export function SupplierExtractor({ onAccepted }: { onAccepted: (acceptedIds: string[]) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [accepted, setAccepted] = useState(0);

  async function extract() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setRates((prev) => [...prev, ...json.data.rates]);
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function edit(id: string, patch: Partial<Rate>) {
    setRates((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function incomplete(r: Rate) {
    return r.costPrice == null || r.roomType == null || r.checkIn == null || r.checkOut == null;
  }

  async function acceptAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accept-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const acceptedIds = rates.map((r) => r.id);
      setAccepted((n) => n + rates.length);
      setRates([]);
      onAccepted(acceptedIds); // surface them in Compare (sourced + replied)
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-ink/50">Paste an unsolicited supplier rate message — the AI extracts structured rates.</p>
        {accepted > 0 && <span className="text-xs text-green-700">{accepted} added to comparison</span>}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Paste a supplier's WhatsApp rate message…"
        className="w-full resize-none rounded-lg border border-sand bg-cream/50 p-3 text-sm outline-none focus:border-brand"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={extract}
          disabled={loading || !text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
          Extract rates
        </button>
        <span className="text-xs text-ink/50">samples:</span>
        {SAMPLE_SUPPLIER_MESSAGES.map((m, i) => (
          <button
            key={i}
            onClick={() => setText(m.text)}
            className="rounded-full border border-sand px-2 py-1 text-[11px] text-brand-dark hover:bg-sand"
          >
            {m.label.split(" (")[0]}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {rates.length > 0 && (
        <div className="mt-4 space-y-2">
          {rates.map((r) => (
            <div key={r.id} className="rounded-lg border border-sand bg-cream/40 p-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Cell label="Hotel">
                  <input className="rcell" value={r.hotel} onChange={(e) => edit(r.id, { hotel: e.target.value })} />
                </Cell>
                <Cell label="Supplier">
                  <input className="rcell" value={r.supplier} onChange={(e) => edit(r.id, { supplier: e.target.value })} />
                </Cell>
                <Cell label="Room" review={r.roomType == null}>
                  <select
                    className="rcell"
                    value={r.roomType ?? ""}
                    onChange={(e) => edit(r.id, { roomType: (e.target.value || null) as RoomType | null })}
                  >
                    <option value="">—</option>
                    {ROOM_TYPES.map((rt) => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </Cell>
                <Cell label="Cost SAR/night" review={r.costPrice == null}>
                  <input
                    type="number"
                    className="rcell"
                    value={r.costPrice ?? ""}
                    onChange={(e) => edit(r.id, { costPrice: e.target.value ? Number(e.target.value) : null })}
                  />
                </Cell>
                <Cell label="Check-in" review={r.checkIn == null}>
                  <input type="date" className="rcell" value={r.checkIn ?? ""} onChange={(e) => edit(r.id, { checkIn: e.target.value || null })} />
                </Cell>
                <Cell label="Check-out" review={r.checkOut == null}>
                  <input type="date" className="rcell" value={r.checkOut ?? ""} onChange={(e) => edit(r.id, { checkOut: e.target.value || null })} />
                </Cell>
                <Cell label="Rooms">
                  <input
                    type="number"
                    className="rcell"
                    value={r.availability ?? ""}
                    onChange={(e) => edit(r.id, { availability: e.target.value ? Number(e.target.value) : null })}
                  />
                </Cell>
                <Cell label="Inclusions">
                  <input
                    className="rcell"
                    value={r.inclusions.join(", ")}
                    onChange={(e) => edit(r.id, { inclusions: e.target.value ? e.target.value.split(",").map((s) => s.trim()) : [] })}
                  />
                </Cell>
              </div>
              {incomplete(r) && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
                  <AlertTriangle className="h-3 w-3" /> needs review — complete the highlighted fields to use as Best Pick
                </p>
              )}
            </div>
          ))}
          <button
            onClick={acceptAll}
            disabled={loading}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            Accept {rates.length} rate{rates.length > 1 ? "s" : ""} into comparison
          </button>
        </div>
      )}
      <style jsx>{`
        :global(.rcell) {
          width: 100%;
          border: 1px solid var(--color-sand);
          border-radius: 0.4rem;
          padding: 0.3rem 0.4rem;
          font-size: 0.75rem;
          background: #fff;
          outline: none;
        }
        :global(.rcell:focus) { border-color: var(--color-brand); }
      `}</style>
    </div>
  );
}

function Cell({ label, review, children }: { label: string; review?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 flex items-center gap-1 text-[10px] uppercase text-ink/45">
        {label}
        {review && <span className="rounded bg-amber-200 px-1 text-[8px] text-amber-800">!</span>}
      </span>
      {children}
    </label>
  );
}
