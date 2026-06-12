"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Copy, Check, Printer, ShieldCheck, Send, FileText, AlertTriangle, Pencil, X } from "lucide-react";
import type { Language, Quotation } from "@/lib/schemas";
import { LANGUAGE_LABELS, dirFor, isRTL } from "@/lib/i18n";
import { freshness } from "@/lib/pricing";

const LANGS: Language[] = ["en", "ar", "ur"];

export function QuotationView({
  quotation,
  setQuotation,
}: {
  quotation: Quotation;
  setQuotation: (q: Quotation) => void;
}) {
  const [lang, setLang] = useState<Language>("en");
  const [loadingLang, setLoadingLang] = useState<Language | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftBody, setDraftBody] = useState("");

  const body = quotation.bodies[lang];
  const canEdit = quotation.status === "Draft";

  function startEdit() {
    setDraftBody(body ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quotation.id, action: "edit", lang, body: draftBody }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setQuotation(json.data);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function switchLang(target: Language) {
    setEditing(false); // discard any in-progress edit when changing language
    setLang(target);
    if (quotation.bodies[target]) return;
    setLoadingLang(target);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId: quotation.id, lang: target }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setQuotation(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingLang(null);
    }
  }

  async function transition(action: "approve" | "send") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quotation.id, action }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setQuotation(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!body) return;
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const rateFresh = freshness(quotation.rateCapturedAt, Date.now());
  const rateStale = rateFresh.label === "stale" && quotation.status !== "Sent";

  const steps: { key: Quotation["status"]; label: string; done: boolean }[] = [
    { key: "Draft", label: "Draft", done: true },
    { key: "Approved", label: "Approved", done: quotation.status === "Approved" || quotation.status === "Sent" },
    { key: "Sent", label: "Sent", done: quotation.status === "Sent" },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand px-5 py-4 no-print">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/80">
          <FileText className="h-4 w-4 text-brand" /> 4 · Quotation
        </h2>
        <div className="flex rounded-lg bg-sand p-0.5 text-xs">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${lang === l ? "bg-white shadow-sm" : "text-ink/60"}`}
            >
              {loadingLang === l && <Loader2 className="h-3 w-3 animate-spin" />}
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Status timeline */}
      <div className="flex items-center gap-2 px-5 py-3 no-print">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                s.done ? "bg-brand/15 text-brand-dark" : "bg-sand text-ink/40"
              }`}
            >
              {s.done && <Check className="h-3 w-3" />} {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-5 bg-sand" />}
          </div>
        ))}
        <span className="ml-auto text-[11px] text-ink/45">
          {quotation.approver ? `Approved by ${quotation.approver}` : "Awaiting approval"}
        </span>
      </div>

      {/* Printable quotation */}
      <div className="px-5 pb-4">
        <div id="print-quote" className="rounded-xl border border-sand bg-white p-6">
          <div className="mb-4 flex items-center justify-between border-b border-sand pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-sand">
                <Image src="/brand/elite-logo.png" alt="Elite Tour House" width={44} height={44} className="object-cover" />
              </div>
              <div>
                <p className="font-semibold text-ink">Elite Tour House Makkah</p>
                <p className="text-xs text-ink/50">+966 56 736 8048</p>
              </div>
            </div>
            <span className="rounded bg-sand px-2 py-1 text-[11px] uppercase text-ink/50">Quotation</span>
          </div>
          {loadingLang === lang ? (
            <p className="flex items-center gap-2 py-8 text-sm text-ink/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating {LANGUAGE_LABELS[lang]} quotation…
            </p>
          ) : editing ? (
            <div className="no-print">
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-dark">
                <Pencil className="h-3 w-3" /> Editing the client-facing message — Save before approving.
              </p>
              <textarea
                dir={dirFor(lang)}
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={Math.max(8, draftBody.split("\n").length + 1)}
                aria-label="Edit quotation message"
                className={`w-full resize-y rounded-md border border-brand/30 bg-cream/30 p-3 text-sm leading-relaxed text-ink outline-none transition focus:border-brand ${
                  isRTL(lang) ? (lang === "ur" ? "font-urdu text-right" : "font-arabic text-right") : "font-sans"
                }`}
              />
            </div>
          ) : body ? (
            <pre
              dir={dirFor(lang)}
              className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-ink ${
                isRTL(lang) ? (lang === "ur" ? "font-urdu text-right" : "font-arabic text-right") : "font-sans"
              }`}
            >
              {body}
            </pre>
          ) : (
            <p className="py-8 text-sm text-ink/40">No content.</p>
          )}
        </div>
      </div>

      {error && <p className="px-5 pb-2 text-xs text-red-600 no-print">{error}</p>}

      {rateStale && (
        <div className="mx-5 mb-1 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 no-print">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This rate was last confirmed {rateFresh.ageText} — hotel rates change fast. Re-check it with the supplier in the
          comparison before sending.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-sand px-5 py-4 no-print">
        <button onClick={copy} disabled={!body || editing} className="flex items-center gap-1.5 rounded-lg border border-sand px-3 py-2 text-sm text-ink/80 hover:bg-sand disabled:opacity-40">
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={() => window.print()} disabled={!body || editing} className="flex items-center gap-1.5 rounded-lg border border-sand px-3 py-2 text-sm text-ink/80 hover:bg-sand disabled:opacity-40">
          <Printer className="h-4 w-4" /> Print / PDF
        </button>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-sand px-3 py-2 text-sm text-ink/80 hover:bg-sand disabled:opacity-40">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button onClick={saveEdit} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-40">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button onClick={startEdit} disabled={busy || !body} className="flex items-center gap-1.5 rounded-lg border border-sand px-3 py-2 text-sm text-ink/80 hover:bg-sand disabled:opacity-40">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              )}
              {quotation.status === "Draft" && (
                <button onClick={() => transition("approve")} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-40">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Approve
                </button>
              )}
            </>
          )}
          {quotation.status === "Approved" && (
            <button onClick={() => transition("send")} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-40">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send (simulated)
            </button>
          )}
          {quotation.status === "Sent" && (
            <span className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
              <Check className="h-4 w-4" /> Sent
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
