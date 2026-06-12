"use client";

import { ListChecks } from "lucide-react";
import type { Quotation } from "@/lib/schemas";

const sar = (n: number) => `SAR ${n.toLocaleString()}`;

const STATUS_STYLE: Record<Quotation["status"], string> = {
  Draft: "bg-sand text-ink/60",
  Approved: "bg-amber-100 text-amber-800",
  Sent: "bg-green-100 text-green-800",
};

export function ApprovalQueue({
  quotations,
  onOpen,
}: {
  quotations: Quotation[];
  onOpen: (q: Quotation) => void;
}) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/70">
        <ListChecks className="h-4 w-4 text-brand" /> 5 · Approval Queue
        <span className="ml-1 rounded-full bg-sand px-2 text-xs text-ink/50">{quotations.length}</span>
      </h2>
      {quotations.length === 0 ? (
        <p className="py-4 text-sm text-ink/40">No quotations yet. Generate one from the comparison above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink/45">
                <th className="px-2 py-2">Hotel</th>
                <th className="px-2 py-2">Client / night</th>
                <th className="px-2 py-2">Margin</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Approver</th>
                <th className="px-2 py-2">When</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id} className="border-t border-sand">
                  <td className="px-2 py-2">
                    <div className="font-medium text-ink">{q.hotel}</div>
                    <div className="text-[11px] text-ink/50">{q.supplier} · {q.roomType}</div>
                  </td>
                  <td className="px-2 py-2 font-semibold text-ink">{sar(q.clientPrice)}</td>
                  <td className="px-2 py-2 text-ink/60">{q.marginPct}%</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[11px] text-ink/60">{q.approver ?? "—"}</td>
                  <td className="px-2 py-2 text-[11px] text-ink/50">
                    {new Date(q.sentAt ?? q.approvedAt ?? q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => onOpen(q)} className="rounded-md border border-sand px-2 py-1 text-xs text-ink/70 hover:bg-sand">
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
