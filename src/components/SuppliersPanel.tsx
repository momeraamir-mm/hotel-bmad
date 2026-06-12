"use client";

import { useState } from "react";
import { Building2, ClipboardPaste, Radio } from "lucide-react";
import type { StructuredRequest } from "@/lib/schemas";
import { SupplierExtractor } from "./SupplierExtractor";
import { SupplierAutoRequests } from "./SupplierAutoRequests";

type Tab = "paste" | "auto";

export function SuppliersPanel({
  request,
  onAccepted,
  onRefreshed,
  onReplyReceived,
  onSourced,
}: {
  request: StructuredRequest | null;
  onAccepted: (acceptedIds: string[]) => void;
  onRefreshed: () => void;
  onReplyReceived: (rateIds: string[]) => void;
  onSourced: (rateIds: string[]) => void;
}) {
  const [tab, setTab] = useState<Tab>("paste");

  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/70">
          <Building2 className="h-4 w-4 text-brand" /> 2 · Suppliers
        </h2>
        <div className="flex rounded-lg bg-sand p-0.5 text-xs">
          <button
            onClick={() => setTab("paste")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${tab === "paste" ? "bg-white shadow-sm" : "text-ink/60"}`}
          >
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste a message
          </button>
          <button
            onClick={() => setTab("auto")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${tab === "auto" ? "bg-white shadow-sm" : "text-ink/60"}`}
          >
            <Radio className="h-3.5 w-3.5" /> Auto-request rates
          </button>
        </div>
      </div>

      {tab === "paste" ? (
        <SupplierExtractor onAccepted={onAccepted} />
      ) : (
        <SupplierAutoRequests request={request} onRefreshed={onRefreshed} onReplyReceived={onReplyReceived} onSourced={onSourced} />
      )}
    </section>
  );
}
