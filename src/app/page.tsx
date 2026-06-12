"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { FlowStepper, type FlowStep } from "@/components/FlowStepper";
import { InquiryIntake } from "@/components/InquiryIntake";
import { SuppliersPanel } from "@/components/SuppliersPanel";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { QuotationView } from "@/components/QuotationView";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import type { HistoryPoint, Quotation, Rate, StructuredRequest } from "@/lib/schemas";

export default function Home() {
  const [request, setRequest] = useState<StructuredRequest | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryPoint[]>>({});
  const [marginPct, setMarginPct] = useState(15);
  const [generatingRateId, setGeneratingRateId] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeStep, setActiveStep] = useState<"intake" | "compare" | "quote">("intake");

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

  const requestComplete = !!(request?.roomType && request?.checkIn && request?.checkOut && request?.pax);
  const steps: FlowStep[] = [
    { id: "intake", label: "Intake", done: requestComplete },
    { id: "compare", label: "Compare", done: !!quotation },
    { id: "quote", label: "Quote", done: quotation?.status === "Sent" },
  ];

  return (
    <div className="min-h-screen">
      <BrandHeader />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <FlowStepper steps={steps} active={activeStep} onSelect={(id) => setActiveStep(id as typeof activeStep)} />
        <div className="rounded-xl border border-sand bg-white/60 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">From supplier messages to a sent quotation — in seconds.</h2>
          <p className="text-sm text-ink/60">
            Capture the client request, paste supplier rates, compare across hotels &amp; suppliers, and send a
            multilingual quote — with human approval at the end.
          </p>
          <p className="mt-1.5 text-xs font-medium text-brand-dark">
            A co-pilot for your reservation team — the AI drafts, your staff review and approve. It assists them, it
            doesn&apos;t replace them.
          </p>
        </div>

        {/* Stage 1 · Intake — client request + supplier rates, worked together. */}
        <div className={activeStep === "intake" ? "grid gap-5 lg:grid-cols-2" : "hidden"}>
          <InquiryIntake request={request} setRequest={setRequest} />
          <SuppliersPanel request={request} onAccepted={loadRates} onRefreshed={loadRates} />
        </div>

        {/* Stage 2 · Compare. Kept mounted so live supplier updates persist across tabs. */}
        <div className={activeStep === "compare" ? "" : "hidden"}>
          <ComparisonPanel
            rates={rates}
            history={history}
            request={request}
            marginPct={marginPct}
            setMarginPct={setMarginPct}
            onGenerateQuote={onGenerateQuote}
            generatingRateId={generatingRateId}
            onRechecked={loadRates}
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
