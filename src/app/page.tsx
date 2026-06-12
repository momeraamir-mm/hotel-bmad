"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { FlowStepper, type FlowStep } from "@/components/FlowStepper";
import { InquiryIntake } from "@/components/InquiryIntake";
import { SuppliersPanel } from "@/components/SuppliersPanel";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { QuotationView } from "@/components/QuotationView";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import { RequestsBoard } from "@/components/RequestsBoard";
import { SEED_LEADS, type Lead } from "@/lib/seed/leads";
import { ArrowLeft } from "lucide-react";
import type { HistoryPoint, Quotation, Rate, StructuredRequest } from "@/lib/schemas";

export default function Home() {
  const [view, setView] = useState<"board" | "detail">("board");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [request, setRequest] = useState<StructuredRequest | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryPoint[]>>({});
  const [marginPct, setMarginPct] = useState(15);
  const [generatingRateId, setGeneratingRateId] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeStep, setActiveStep] = useState<"intake" | "compare" | "quote">("intake");
  // Every supplier rate we sourced (asked for) on the open request — the Compare universe.
  const [sourcedRateIds, setSourcedRateIds] = useState<string[]>([]);
  // The subset that has actually replied so far. Compare shows the full sourced set, with
  // the not-yet-replied ones marked "awaiting reply" — it never waits for all of them.
  const [receivedRateIds, setReceivedRateIds] = useState<string[]>([]);

  const loadRates = useCallback(async () => {
    const res = await fetch("/api/rates");
    const json = await res.json();
    if (json.ok) {
      setRates(json.data.rates);
      setHistory(json.data.history);
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    const res = await fetch("/api/quotations");
    const json = await res.json();
    if (json.ok) setQuotations(json.data.quotations);
  }, []);

  useEffect(() => {
    loadRates();
    refreshQueue();
  }, [loadRates, refreshQueue]);

  async function onGenerateQuote(rateId: string) {
    setGeneratingRateId(rateId);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rateId, marginPct, pax: request?.pax ?? null }),
      });
      const json = await res.json();
      if (json.ok) {
        setQuotation(json.data);
        await refreshQueue();
        setActiveStep("quote"); // advance to the quotation stage once it's generated
      }
    } finally {
      setGeneratingRateId(null);
    }
  }

  function onQuotationChange(q: Quotation) {
    setQuotation(q);
    refreshQueue();
  }

  function openQuotation(q: Quotation) {
    setQuotation(q);
    setActiveStep("quote");
  }

  function isComplete(req: StructuredRequest | null): boolean {
    return !!(req?.roomType && req?.checkIn && req?.checkOut && req?.pax);
  }

  function addReceived(ids: string[]) {
    setReceivedRateIds((prev) => [...new Set([...prev, ...ids])]);
  }

  /** Manually pasted + accepted supplier rates: reload the inventory, then add them to
   *  both the sourced universe and the replied set so they show, priced, in Compare. */
  async function onRatesAccepted(ids: string[]) {
    await loadRates();
    setSourcedRateIds((prev) => [...new Set([...prev, ...ids])]);
    setReceivedRateIds((prev) => [...new Set([...prev, ...ids])]);
  }

  /** New-request flow only: the live drafts define the sourced universe. For an opened
   *  lead the universe is fixed at open time, so we ignore this to avoid clobbering it. */
  function onLiveSourced(ids: string[]) {
    if (activeLead === null) setSourcedRateIds(ids);
  }

  /** Every supplier rate we asked for on this lead = its sourced hotels × requested room. */
  function universeForLead(lead: Lead): Rate[] {
    if (!lead.sourcedHotels) return [];
    return rates.filter(
      (r) => lead.sourcedHotels!.includes(r.hotel) && r.roomType === lead.request.roomType,
    );
  }

  /** Which of the sourced rates have replied: all once past sourcing; partway through
   *  sourcing, the earlier hotels are in and the last is still awaiting. */
  function receivedForLead(lead: Lead, universe: Rate[]): string[] {
    const allIn = ["Ready to quote", "Awaiting approval", "Sent"];
    if (allIn.includes(lead.status)) return universe.map((r) => r.id);
    if (lead.status === "Sourcing rates" && lead.sourcedHotels && lead.sourcedHotels.length > 0) {
      const pendingHotel = lead.sourcedHotels[lead.sourcedHotels.length - 1];
      return universe.filter((r) => r.hotel !== pendingHotel).map((r) => r.id);
    }
    return [];
  }

  function openLead(lead: Lead) {
    const universe = universeForLead(lead);
    const received = receivedForLead(lead, universe);
    setActiveLead(lead);
    setRequest(lead.request);
    setSourcedRateIds(universe.map((r) => r.id));
    setReceivedRateIds(received);
    setQuotation(null);
    // Land where the work is: once rates are sourced, open Compare even if some suppliers
    // are still pending; only fall back to Intake when nothing has been sourced yet.
    setActiveStep(universe.length > 0 ? "compare" : "intake");
    setView("detail");
  }

  function newRequest() {
    setActiveLead(null);
    setRequest(null);
    setSourcedRateIds([]);
    setReceivedRateIds([]);
    setQuotation(null);
    setActiveStep("intake");
    setView("detail");
  }

  const requestComplete = isComplete(request);
  const steps: FlowStep[] = [
    { id: "intake", label: "Intake", done: requestComplete },
    { id: "compare", label: "Compare", done: !!quotation },
    { id: "quote", label: "Quote", done: quotation?.status === "Sent" },
  ];

  if (view === "board") {
    return (
      <div className="min-h-screen">
        <BrandHeader />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <RequestsBoard leads={SEED_LEADS} onOpen={openLead} onNew={newRequest} />
          <footer className="pb-6 pt-6 text-center text-xs text-ink/40">
            Demo · Elite Tour House Makkah · Powered by Groq · The AI works every request; your team decides &amp; approves.
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BrandHeader />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setView("board")}
            className="flex items-center gap-1.5 rounded-lg border border-sand px-3 py-1.5 text-sm text-ink/70 transition hover:bg-sand"
          >
            <ArrowLeft className="h-4 w-4" /> All requests
          </button>
          {activeLead && (
            <span className="text-sm text-ink/60">
              <strong className="text-ink">{activeLead.client}</strong> · {activeLead.id} · {activeLead.origin}
            </span>
          )}
        </div>

        <FlowStepper steps={steps} active={activeStep} onSelect={(id) => setActiveStep(id as typeof activeStep)} />

        {/* Stage 1 · Intake — client request + supplier rates, worked together. */}
        <div className={activeStep === "intake" ? "grid gap-5 lg:grid-cols-2" : "hidden"}>
          <InquiryIntake request={request} setRequest={setRequest} />
          <SuppliersPanel
            request={request}
            onAccepted={onRatesAccepted}
            onRefreshed={loadRates}
            onReplyReceived={addReceived}
            onSourced={onLiveSourced}
          />
        </div>

        {/* Stage 2 · Compare. Kept mounted so live supplier updates persist across tabs. */}
        <div className={activeStep === "compare" ? "" : "hidden"}>
          <ComparisonPanel
            rates={rates}
            history={history}
            request={request}
            sourcedRateIds={sourcedRateIds}
            receivedRateIds={receivedRateIds}
            marginPct={marginPct}
            setMarginPct={setMarginPct}
            onGenerateQuote={onGenerateQuote}
            generatingRateId={generatingRateId}
          />
        </div>

        {/* Stage 3 · Quote + approval queue. */}
        <div className={activeStep === "quote" ? "space-y-5" : "hidden"}>
          {quotation ? (
            <QuotationView quotation={quotation} setQuotation={onQuotationChange} />
          ) : (
            <p className="card px-5 py-8 text-center text-sm text-ink/50">
              No quotation selected yet. Generate one from the <strong>Compare</strong> stage, or open a recent one below.
            </p>
          )}
          <ApprovalQueue quotations={quotations} onOpen={openQuotation} />
        </div>

        <footer className="pb-6 pt-2 text-center text-xs text-ink/40">
          Demo · Elite Tour House Makkah · Powered by Groq · AI drafts → human approves → sent
        </footer>
      </main>
    </div>
  );
}
