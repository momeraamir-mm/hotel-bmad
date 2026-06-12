import { NextResponse } from "next/server";
import { getQuotations, updateQuotation } from "@/lib/store";

export const runtime = "nodejs";

/** Approval queue (FR-18). */
export async function GET() {
  return NextResponse.json({ ok: true, data: { quotations: getQuotations() } });
}

/** Status transitions (FR-16/17): approve and send. No Draft -> Sent without approve. */
export async function PATCH(req: Request) {
  try {
    const { id, action, approver, lang, body } = await req.json();
    const q = getQuotations().find((x) => x.id === id);
    if (!q) return NextResponse.json({ ok: false, error: "Quotation not found." }, { status: 404 });

    if (action === "edit") {
      if (q.status !== "Draft") {
        return NextResponse.json(
          { ok: false, error: "Only Draft quotations can be edited (locked once approved)." },
          { status: 400 },
        );
      }
      if (typeof lang !== "string" || typeof body !== "string") {
        return NextResponse.json({ ok: false, error: "Edit requires a language and body text." }, { status: 400 });
      }
      updateQuotation(id, { bodies: { ...q.bodies, [lang]: body } });
    } else if (action === "approve") {
      if (q.status !== "Draft") {
        return NextResponse.json({ ok: false, error: "Only Draft quotations can be approved." }, { status: 400 });
      }
      updateQuotation(id, {
        status: "Approved",
        approver: approver || "Reservation Staff",
        approvedAt: new Date().toISOString(),
      });
    } else if (action === "send") {
      if (q.status !== "Approved") {
        return NextResponse.json(
          { ok: false, error: "Quotation must be Approved before sending (human approval gate)." },
          { status: 400 },
        );
      }
      updateQuotation(id, { status: "Sent", sentAt: new Date().toISOString() });
    } else {
      return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: getQuotations().find((x) => x.id === id) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Status update failed." },
      { status: 500 },
    );
  }
}
