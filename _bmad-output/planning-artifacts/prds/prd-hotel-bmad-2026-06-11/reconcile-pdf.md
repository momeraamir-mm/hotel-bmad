# PRD ↔ Source Reconciliation

**Source:** "AI Automation Plan for Makkah Tourism & Hotel Booking Company" (PDF)
**PRD:** `_bmad-output/planning-artifacts/prds/prd-hotel-bmad-2026-06-11/prd.md`
**Date:** 2026-06-11
**Method:** Each meaningful source capability/idea below is classified COVERED (cite FR/§), INTENTIONALLY-DEFERRED (cite Non-Goals §5 / Out-of-scope §6.2), or GAP (in source, not addressed anywhere).

Context note: The PRD is explicitly scoped as a **clickable demo to win the client**, not the full production system. Several Phase 2/3 source items are therefore legitimately deferred — but the test here is whether the PRD *captured* them as deferred/roadmap rather than silently dropping them.

---

## Goals (source)

| Source goal | Verdict | Where |
|---|---|---|
| Speed up quotations | COVERED | Vision §1, SM-3 (<~30s), whole UJ-1 chain |
| Compare supplier rates automatically | COVERED | FR-8, FR-9 (HERO §4.4) |
| Reduce manual work | COVERED | Vision §1, JTBD §2.1 |
| Improve follow-up with clients & suppliers | **GAP (partial)** | See "follow-up / status updates" and "supplier-side drafting" below |
| Scalable reservation workflow | COVERED-as-narrative | Vision §1, JTBD "keep up during peak"; production scalability explicitly a Non-Goal (§5 "not a production system") — fine for a demo |

---

## Phase 1 — ChatGPT-for-staff quoting

| Source capability | Verdict | Where |
|---|---|---|
| AI assistant for staff | COVERED | Whole product framing §1; staff dashboard §6.1 |
| Paste supplier WhatsApp messages | COVERED | FR-4 (paste Supplier Message) |
| Extract hotel/room/dates/rates | COVERED | FR-4 + Rate schema in Glossary §3 |
| Compare suppliers | COVERED | FR-8 |
| Calculate margins | COVERED | FR-10 |
| Generate quotations in English, Arabic, Tamil, Urdu | **PARTIAL — Tamil dropped, captured as roadmap** | FR-13 covers En/Ar/Ur. Tamil explicitly deferred: §5 ("Not supporting Tamil … — roadmap"), §6.2 ("Tamil and additional languages — roadmap"). INTENTIONALLY-DEFERRED, correctly flagged. |

---

## Phase 2 — Central rate database & trends

| Source capability | Verdict | Where |
|---|---|---|
| Central rate DB (Hotel, Supplier, Date, Room Type, Cost Price, Availability) | COVERED (as seeded store) | FR-6/FR-7 Rate Store; schema in Glossary §3. Production DB itself deferred §6.2 ("in-memory/seed file") — appropriate for demo. |
| Analyze trends | COVERED | FR-12 (trend insight, delta vs prior history, sparkline) |

---

## Phase 3 — WhatsApp integration

| Source capability | Verdict | Where |
|---|---|---|
| Real WhatsApp Business API integration (read msgs / send) | INTENTIONALLY-DEFERRED | §5 "Not integrating the real WhatsApp Business API — no live message send/receive." Demo simulates "Sent" (FR-16) and copy-to-clipboard (FR-14). Correctly scoped. |
| AI reads msgs → extracts → stores → generates draft → translates | COVERED (manual-paste path) | FR-4/5 (extract+store), FR-8–12 (compare), FR-13 (generate+translate). The *automation/transport* layer is the deferred part; the *intelligence* is in scope. |
| Draft client confirmations | **GAP** | See "draft confirmations" below. |

---

## Client interaction (source)

| Source capability | Verdict | Where |
|---|---|---|
| Receive client inquiries (text + voice) | COVERED | FR-1, FR-2 |
| Ask follow-up questions (when info missing) | **PARTIAL → near-GAP** | PRD handles missing info by **flagging fields `needs review`** for the *staff* to fill (FR-3), and the §4.1 description says the system "asking for or flagging anything missing." But the source intent is the AI **asking the client a follow-up question** ("What dates? How many guests?") to complete the inquiry. The PRD reframes this as internal staff-side field correction, not an outward client-facing follow-up. UJ-1 even narrates the AI generating clarifying questions back to a client is **absent**. Flag as a soft gap — the capability is *partially* met (gap detection exists) but the "ask the client" behavior is not an FR. |
| Prepare quotation drafts | COVERED | FR-13, FR-16 (starts as Draft) |
| Send status updates to clients | **GAP** | Source explicitly lists "send status updates" to clients. PRD has an internal Status lifecycle (FR-16) and an approval queue (FR-18) — but those are *staff/owner-facing* statuses. There is **no FR for composing or sending a status update message to the client** (e.g., "your booking is confirmed", "still sourcing rates"). Not in Non-Goals either. True GAP — though arguably folded under the deferred WhatsApp transport; not captured as roadmap explicitly. |

---

## Supplier interaction (source)

| Source capability | Verdict | Where |
|---|---|---|
| AI drafts messages requesting rates from suppliers | INTENTIONALLY-DEFERRED | §6.2 "Supplier-side automation (AI drafting rate-request messages) — roadmap." Correctly captured as roadmap. (Note: this is a real reduction from the source's "improve follow-up with suppliers" goal, but it is explicitly acknowledged, so not a silent drop.) |
| Organizes supplier replies | COVERED | FR-4/5 (extraction structures the replies); FR-8 organizes them into a comparison. |

---

## Cross-cutting capabilities (source)

| Source capability | Verdict | Where |
|---|---|---|
| Safety model: AI drafts → human approval → sent | COVERED (strongly) | §4.6, FR-16/17/18, §11 Safety, SM-C2. This is treated as the core invariant. Excellent fidelity. |
| Voice messages: **transcribe** | COVERED | FR-2 (Groq Whisper `whisper-large-v3`) |
| Voice messages: **summarize** | **GAP** | Source says "transcribe **and summarize** voice messages." PRD transcribes (FR-2) and then *parses into a Structured Request* — which is arguably a structured summarization for inquiries. But there is no general "summarize this voice note" capability, and notably **supplier voice notes** are not handled at all (FR-2 is client-inquiry only; FR-4 supplier ingestion is text-paste only). If a supplier sends a voice note with rates, the demo has no path. Flag as GAP: (a) no explicit summarize verb, (b) supplier-side voice unaddressed and not deferred. |
| Privacy: protect customer data, restrict access, company-controlled | COVERED (demo-appropriate) | §11 Privacy (fabricated data, no real PII, server-side key); real access-control/roles deferred §6.2 ("Real auth/users/roles — auth stubbed"). |
| Tech stack: WhatsApp Business API | DEFERRED | §5 (see WhatsApp row) |
| Tech stack: OpenAI API | NOTE — substituted | PRD uses **Groq** (Whisper + Llama) throughout instead of OpenAI. A deliberate tech substitution; same capability. Worth confirming the client is OK with the model-provider swap, but not a capability gap. |
| Tech stack: database | DEFERRED | §6.2 in-memory/seed |
| Tech stack: admin dashboard | COVERED | Staff dashboard §6.1, §12 |
| Tech stack: approval workflow | COVERED | §4.6 |
| Expected result: "functions like an additional reservation agent" | COVERED (north star) | Vision §1, §2 framing verbatim ("AI reservation agent", "extra reservation agent"). |

---

## Summary of findings

### GAPS (in source, not adequately addressed)
1. **[gap] Send status updates to clients** — source lists it; PRD only has internal staff/owner status lifecycle (FR-16/18). No FR to compose/send a client-facing status update, and it is not listed in Non-Goals/roadmap. Silent drop.
2. **[gap] Summarize voice messages** — source says transcribe *and summarize*; PRD transcribes only (FR-2). For client inquiries, parsing ≈ summarization, but the explicit summarize verb is gone.
3. **[gap] Supplier-side voice notes** — FR-2 voice handling is client-inquiry only; FR-4 supplier ingestion is text-paste only. A supplier voice note with rates has no path, and this isn't flagged as out-of-scope.
4. **[gap/partial] AI asking the client follow-up questions** — source wants the AI to ask the client clarifying questions; PRD reframes as staff-side `needs review` field flagging (FR-3). The outward client-facing follow-up is absent.

### Deferrals (correctly captured)
5. **[deferred-ok] Tamil language** — explicitly roadmapped (§5, §6.2). Good catch by the PRD.
6. **[deferred-ok] Supplier-side rate-request drafting & real WhatsApp Business API** — both explicitly roadmapped/Non-Goal (§6.2, §5).

### Notes
7. **[note] OpenAI → Groq substitution** — source named OpenAI API; PRD standardizes on Groq (Whisper + Llama). Capability-equivalent but a provider swap the client should be told about.
8. **[note] "Improve follow-up with clients & suppliers" goal** is the weakest-covered source *goal* overall — its client side (status updates, follow-up questions) and supplier side (rate-request drafting) are the cluster where the gaps/deferrals concentrate.
