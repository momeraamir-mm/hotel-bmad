---
title: "Makkah Tourism AI Quotation Assistant"
status: final
created: 2026-06-11
updated: 2026-06-11
---

# PRD: Makkah Tourism AI Quotation Assistant

*Demo build. Builds on the approved brief at `_bmad-output/planning-artifacts/briefs/brief-hotel-bmad-2026-06-11/brief.md` — this PRD does not duplicate it.*

## 0. Document Purpose

This PRD is for the PM, the implementing engineer (BMad Dev), and the architect. It turns the approved brief into implementable requirements for a **working, clickable demo** whose purpose is to win the Makkah Tourism & Hotel Booking company as a client. Vocabulary is anchored in the Glossary (§3); features are grouped with globally numbered Functional Requirements (FR-N) nested under them; non-functional requirements are cross-cutting (§10); assumptions are tagged inline `[ASSUMPTION]` and indexed (§9). Technical "how" (frameworks, model IDs, file layout) is deliberately deferred to the architecture phase, except where a capability constraint depends on it (e.g., Groq Whisper for transcription).

## 1. Vision

The Makkah agency runs its pricing on WhatsApp: suppliers send messy text rates, clients ask by voice and text, and reservation staff manually read, compare, mark up, translate, and retype quotations — slowest and most error-prone exactly during the Hajj/Ramadan/December peaks that drive the year.

This product is an **AI reservation agent** in a single staff dashboard. Staff drop in a client request (text or a voice note) and the supplier rate messages they've received; the system extracts structured rates, lines every supplier up for the same hotel and dates, picks the best deal and explains why, applies the agency's margin, and produces a polished client-ready quotation in English, Arabic, or Urdu — with nothing leaving the building until a human approves it.

For the demo, it must feel real (real Makkah hotels, realistic messy messages, live Groq calls) and prove one thing in five minutes: *this is an extra reservation agent that makes you faster and more profitable at peak, while you stay in control.*

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** Turn a pile of supplier rate messages into one correct, compared, marked-up, client-ready quotation — fast.
- **Functional:** Understand a client's request even when it arrives as a rambling voice note.
- **Functional:** Quote in the client's language without retyping or hand-translating.
- **Emotional:** Trust the numbers — not fear a fat-fingered rate or stale availability reached the client.
- **Social/contextual:** Keep up during peak season without burning out or adding headcount.
- **Managerial (owner):** Protect margin, reduce errors, keep an auditable "who approved what" trail.

### 2.2 Non-Users (demo)

- The end client/pilgrim does not directly operate the system in the demo (no public client portal). They are represented by their inquiry (text/voice) that staff bring in.
- Suppliers do not log in; they are represented by the rate messages they send.

### 2.3 Key User Journeys

- **UJ-1. Amir turns a chaotic morning into a sent quote in under a minute.**
  - **Persona + context:** Amir, a reservation agent during the December rush, has four supplier WhatsApp messages for the same hotel and a client voice note asking for options.
  - **Entry state:** Logged into the staff dashboard (auth is stubbed for the demo).
  - **Path:** (1) He uploads the client's **voice note**; the AI transcribes it and shows a structured request (Makkah area, 23–27 Dec, 3 guests, double). (2) He pastes several **supplier text messages** spanning a few nearby hotels; each becomes a structured rate card. (3) He opens the **comparison panel** — every hotel and supplier side by side for the same dates/room.
  - **Climax:** The AI highlights the **Best Pick (Hotel + Supplier)**, explains why ("cheapest with breakfast included and closest tier, 6 rooms available"), shows **Margin at 15% → Client Price**, a **"save SAR X vs next option"** callout, and a **"rate up 12% vs last week"** trend note.
  - **Resolution:** He clicks **Generate Quotation**, toggles it to **Arabic**, reviews, clicks **Approve** then **Send** → Status moves **Draft → Approved → Sent**; he **copies** it to paste into WhatsApp. Realizes UJ-1 end to end.
  - **Edge case:** A supplier message is ambiguous (missing room type); the system flags the field as **needs review** rather than guessing, and Amir fills it inline.

- **UJ-2. Sara (owner) checks that nothing risky went out.**
  - Sara, the owner, opens the **approval queue**, sees each Quotation's Status, the Margin applied, and which staffer approved it — an auditable trail. In one sentence: *she trusts the gate held.*

## 3. Glossary

- **Supplier** — A hotel-rate provider who sends rates to the agency as text messages. Has a name; not a system user.
- **Supplier Message** — Raw, unstructured text from a Supplier containing one or more rates. Input to extraction.
- **Rate** — A structured price record extracted from a Supplier Message or seeded into the Rate Store. Fields: Hotel, Supplier, Room Type, check-in/check-out Dates, Cost Price (SAR), Inclusions, Availability. Belongs to exactly one Supplier and one Hotel.
- **Hotel** — A real Makkah or Madinah property (e.g., Swissôtel Makkah; Anwar Al Madinah Mövenpick). Has many Rates across Suppliers.
- **Room Type** — Normalized room category (e.g., Double, Triple, Quad, Suite).
- **Rate Store** — The central seeded collection of Rates (incl. ~2–4 weeks of history) the demo reasons over.
- **Client Inquiry** — A request from a prospective client, arriving as text or a voice note. Parsed into a Structured Request.
- **Structured Request** — The normalized client need: area/hotel preference, Dates, guests (pax), Room Type, notes.
- **Comparison** — The side-by-side evaluation of Rates across one or more Hotels and their Suppliers for the same Dates + Room Type, producing a Best Pick. A single Comparison may span multiple Hotels.
- **Best Pick** — The Rate (Hotel + Supplier) the AI recommends, with a rationale, for a Comparison.
- **Margin** — The markup percentage (default 15%) applied to a Rate's Cost Price to produce the Client Price.
- **Client Price** — Cost Price × (1 + Margin). What the client pays.
- **Quotation** — The client-ready document generated from a Best Pick (or chosen Rate) + Margin, renderable in English/Arabic/Urdu, with a Status.
- **Status** — A Quotation's lifecycle state: `Draft` → `Approved` → `Sent`. (Approval gate.)
- **Approval** — The human action moving a Quotation from `Draft` to `Approved`/`Sent`.

## 4. Features

### 4.1 Client Inquiry Intake

**Description:** Staff bring a Client Inquiry into the dashboard as pasted text or an uploaded audio file (voice note). The system transcribes voice (Groq Whisper) and parses the inquiry into a Structured Request, asking for or flagging anything missing. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Submit a text Client Inquiry
Staff can paste free-text client inquiry and submit it. Realizes UJ-1.
**Consequences (testable):**
- Submitting non-empty text returns a Structured Request with fields {area/hotel, dates, pax, room type, notes}, each either filled or explicitly marked `unknown`.
- Empty input is rejected with a validation message; no LLM call is made.

#### FR-2: Submit a voice Client Inquiry (transcription)
Staff can upload an audio file; the system transcribes it before parsing. Realizes UJ-1.
**Consequences (testable):**
- A supported audio file (mp3/m4a/wav/ogg) is transcribed via Groq Whisper (`whisper-large-v3`) and the transcript is shown to the user.
- The transcript is then parsed into a Structured Request identical in shape to FR-1's output.
- The system also shows a one-line plain-language **summary** of the inquiry (the source asks to transcribe *and* summarize voice messages).
- An unsupported or empty file is rejected with a clear error; no spurious quotation is created.

#### FR-3: Review and correct the Structured Request
Staff can edit any field of the parsed Structured Request before proceeding.
**Consequences (testable):**
- Fields marked `unknown` are visually flagged as **needs review**.
- For each `unknown`/ambiguous field, the AI suggests a clarifying **follow-up question** staff can ask the client (e.g., "Which hotel tier or nightly budget?", "Confirm exact check-in/out dates?").
- A Comparison (FR-8) cannot be run until **Dates** and **Room Type** are resolved (not `unknown`).
- Edits persist into the downstream Comparison step.

#### FR-3b: Conversational follow-up loop (auto-complete the request)
When required fields are missing, the AI conducts a back-and-forth conversation to collect them, behaving like a reservation agent messaging the client. Realizes UJ-1. `[Demo: the client side is typed in-dashboard — this is the seam a future WhatsApp integration would plug into; no live external channel (Non-Goal).]`
**Consequences (testable):**
- If any required field (city, check-in, check-out, pax, room type) is `unknown` after intake, the system opens a chat thread and asks **one** focused follow-up question at a time.
- Each client answer is merged into the Structured Request (fields fill in live); the model never fabricates — only what the client states is recorded.
- The loop ends when all required fields are resolved (a "ready" state), or when staff dismiss it to fill fields manually.
- When complete, the request flows into Comparison (FR-8) with no `unknown` blockers.

### 4.2 Supplier Rate Ingestion & Extraction

**Description:** Staff paste one or more raw Supplier Messages; the LLM extracts structured Rates. Messages are messy and inconsistent across suppliers; extraction must be robust and must never silently invent missing data. `[ASSUMPTION: image/screenshot OCR via a vision model is a stretch goal, not part of core MVP.]`

**Functional Requirements:**

#### FR-4: Extract Rates from a Supplier Message
Staff can paste a Supplier Message and receive one or more structured Rates. Realizes UJ-1.
**Consequences (testable):**
- Extraction returns Rate objects with all Glossary fields; unparseable fields are set to `null`/`needs review`, never fabricated.
- A single message containing multiple room types yields multiple Rate rows.
- Extraction uses Groq with JSON-structured output and is validated against the Rate schema before display.

#### FR-5: Confirm/correct extracted Rates
Staff can edit extracted Rate fields and accept them into the working comparison set.
**Consequences (testable):**
- `needs review` Rates cannot be selected as a Best Pick until resolved.
- Accepted Rates are normalized (Room Type mapped to Glossary categories; currency = SAR).

### 4.3 Central Rate Store (Seeded)

**Description:** A seeded store of Rates over real Makkah hotels and fabricated suppliers, including ~2–4 weeks of price history, so Comparison and trend insight look real out of the box. `[ASSUMPTION: demo persistence is in-memory/seed file; no production database.]`

**Functional Requirements:**

#### FR-6: Seeded hotels, suppliers, rates, and history
The system ships with realistic seed data the demo can run on with zero setup.
**Consequences (testable):**
- ≥6 real hotels spanning **Makkah and Madinah**, ≥3 fabricated suppliers each, with SAR rates and **≥3 weekly prior data points** per supplier/hotel so the trend sparkline (FR-12) is credible.
- Seed includes ≥3 realistic messy Supplier Message samples and ≥1 sample client voice/text inquiry for the demo script.

#### FR-7: Newly extracted Rates join the working set
Rates accepted from FR-5 are merged with seeded Rates for Comparison within the session.
**Consequences (testable):**
- A freshly extracted Rate for a seeded hotel appears alongside seeded Rates in the same Comparison.

### 4.4 Rate Comparison Intelligence *(HERO)*

**Description:** Given Dates + Room Type and one or more Hotels (from the Structured Request or chosen manually), the system lines up every matching Rate — across multiple Hotels and their Suppliers — and produces the decision: Best Pick + rationale, Margin math, savings, availability, and trend. A Comparison may span several Hotels at once so staff can answer "which Hotel + Supplier is the best option for this client?". This is the demo's centerpiece. Realizes UJ-1.

**Functional Requirements:**

#### FR-8: Multi-hotel, multi-supplier comparison table
Staff can view all Rates matching the Dates + Room Type across the selected Hotels and their Suppliers in one table.
**Consequences (testable):**
- The Comparison can include Rates from multiple Hotels simultaneously; rows are grouped or sortable by Hotel and by Supplier.
- Table shows, per row: Hotel, Supplier, Cost Price (SAR), Inclusions, Availability, and (after FR-10) Client Price.
- Rates with `needs review` fields are visually distinct and excluded from Best Pick.
- Staff can sort/filter (e.g., by Client Price) across the full multi-hotel set.
- A Comparison requires a resolved Dates + Room Type (FR-3); it does not run on `unknown` request fields.

#### FR-9: AI Best Pick with rationale
The system recommends a Best Pick (Hotel + Supplier) across the full multi-hotel comparison and explains why in one or two sentences.
**Consequences (testable):**
- Best Pick is highlighted; rationale references concrete factors (price, inclusions, availability) and, when relevant, why this Hotel over another.
- If two Rates are within a small threshold, the rationale acknowledges the tradeoff rather than implying a false clear winner.

#### FR-10: Margin and Client Price
Staff can set a Margin % (default 15%, editable per quote); the system computes Client Price and profit.
**Consequences (testable):**
- Changing Margin updates Client Price and profit per room/night live.
- Profit = Client Price − Cost Price, shown per the chosen Best Pick (and optionally per row).

#### FR-11: Savings callout
The system shows the saving from choosing the Best Pick over the next-best option in the comparison.
**Consequences (testable):**
- Savings use a single consistent basis — **Client Price**: X = next-best option's Client Price − Best Pick's Client Price, shown as "Save SAR X vs {next hotel/supplier}".
- Cost basis and profit (FR-10) are displayed separately and never mixed into the savings figure.
- Hidden gracefully when only one Rate matches.

#### FR-12: Trend insight
The system shows each Supplier's recent price movement for the Hotel/Room Type.
**Consequences (testable):**
- Shows a delta vs the most recent prior history point (e.g., "+12% vs last week") and a small sparkline.
- Absent history → "no recent history" rather than a fabricated trend.

### 4.5 Quotation Generation & Output

**Description:** From a Best Pick (or staff-chosen Rate) + Margin, the system generates a polished, client-ready Quotation renderable in English/Arabic/Urdu (RTL-aware for Arabic/Urdu), with copy and PDF output. Realizes UJ-1.

**Functional Requirements:**

#### FR-13: Generate a multilingual Quotation
Staff can generate a Quotation and toggle its language between English, Arabic, and Urdu.
**Consequences (testable):**
- Quotation includes hotel, room type, dates, nights, pax, Client Price, inclusions, validity caveat, and agency branding placeholder.
- Arabic and Urdu render right-to-left with correct script; English renders LTR. Switching language re-renders the same underlying Quotation (numbers unchanged).
- Translation/generation uses Groq; failures surface an error, not a blank document.

#### FR-14: Copy to clipboard
Staff can copy the rendered Quotation text in the current language.
**Consequences (testable):**
- Copied text matches what is on screen for the selected language.

#### FR-15: Download/print PDF
Staff can download or print the Quotation as a PDF in the selected language.
**Consequences (testable):**
- PDF preserves layout and RTL direction for Arabic/Urdu.

### 4.6 Approval Workflow

**Description:** Embodies the brief's safety model — Drafts → Human Approval → Sent. Nothing is "sent" without a human click; an approval queue gives the owner an auditable view. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-16: Quotation lifecycle status
Every Quotation has a Status (`Draft` → `Approved` → `Sent`) shown as a timeline.
**Consequences (testable):**
- New Quotations start as `Draft`. Approve (FR-17) moves `Draft` → `Approved`. A simulated **Send** then moves `Approved` → `Sent`; no real message is transmitted.
- The timeline shows all three states with timestamps.

#### FR-17: Human approval gate
Staff must explicitly approve before a Quotation reaches `Sent`.
**Consequences (testable):**
- There is no path from `Draft` to `Sent` without an explicit Approve action.
- The approving user and timestamp are recorded on the Quotation.

#### FR-18: Approval queue
Staff/owner can view all Quotations and their Status in one list. Realizes UJ-2.
**Consequences (testable):**
- Queue shows hotel, Client Price, Margin, Status, approver, and timestamp.

### 4.7 Rate Freshness & Supplier Re-check

**Description:** Hotel rates and availability change constantly ("cannot be fixed in advance"), so each Rate tracks when it was last confirmed and can be re-verified with the supplier. The AI drafts the rate-request message to the supplier (the supplier-interaction capability); the reply is simulated in the demo and refreshes the Rate. Realizes UJ-1, and protects the approval gate. `[Demo: no live supplier channel — the supplier reply is simulated; this is the seam a future WhatsApp integration plugs into.]`

**Functional Requirements:**

#### FR-19: Rate freshness indicator
Every Rate shows how recently it was confirmed with the supplier.
**Consequences (testable):**
- Each Rate carries a `capturedAt` timestamp; the comparison shows a badge — **fresh** (<24h), **aging** (1–3d), **stale** (>3d).
- Seeded Rates span a range of ages so staleness is visible immediately; extracted Rates are marked fresh on capture.

#### FR-20: Re-check rate & availability with supplier
Staff can re-verify any Rate; the AI drafts the supplier request and the Rate is refreshed.
**Consequences (testable):**
- A "Re-check with supplier" action drafts a concise rate-request message to the named Supplier (AI-generated, shown to staff).
- On confirmation, the Rate's Cost Price, Availability, and `capturedAt` are updated (demo: simulated supplier reply); the freshness badge resets.
- The refreshed Rate flows into the live Comparison.

#### FR-22: Auto rate-requests to suppliers on a completed inquiry
When a client request becomes complete, the system automatically drafts rate-requests to all matching suppliers, sent as a batch on one human approval. Realizes the PDF's "AI requests rates from suppliers" loop.
**Consequences (testable):**
- When city/dates/room type are resolved, the system auto-drafts one rate-request per matching Supplier, grouped across the hotels that Supplier quotes (AI-generated, shown to staff).
- The drafts are not transmitted automatically; a single **"Send all requests"** action approves the batch (demo: simulated), which refreshes all those Rates (FR-20 mechanism) and updates the Comparison.
- Respects the safety model: AI drafts → human approves (one click) → sent. No outbound message is sent on a half-formed inquiry.
- After sending, each supplier's **reply is shown** in a conversation thread (sent request → supplier's WhatsApp-style reply message → AI-extracted rate/availability change), closing the draft → reply → updated-rate loop visibly.
- Replies arrive **asynchronously** — suppliers do not reply instantly. After sending, each supplier shows "awaiting reply…" and replies trickle in over staggered delays; each arriving reply refreshes only that supplier's rates. (Demo: delays simulated client-side; this is where real inbound WhatsApp replies would land.)

#### FR-21: Stale-rate guard before sending
A Quotation built on a stale Rate is flagged before it is sent.
**Consequences (testable):**
- If the Rate behind a Quotation is `stale` (>3d), the approval area warns staff to re-check before sending.
- The warning is advisory (does not hard-block) and disappears once the Rate is fresh.

## 5. Non-Goals (Explicit)

- Not a production system; not multi-tenant; not hardened for real customer data.
- Not integrating the real WhatsApp Business API — no live message send/receive.
- Not a public client-facing portal; clients do not log in (demo).
- Not building real supplier/PMS/inventory integrations or real-time availability.
- Not handling payments, invoicing, or booking confirmation.
- Not sending client-facing status updates/notifications in the demo (no live messaging) — roadmap; the Status lifecycle (FR-16–18) is internal/staff-facing only.
- Suppliers send rates as **text only** in the demo (per scope); supplier voice-note ingestion is roadmap.
- Supplier interaction is **simulated** (FR-20): the AI drafts the real rate-request message, but no message is actually transmitted and the reply is generated locally. Live supplier messaging is roadmap.
- Not supporting Tamil (or languages beyond En/Ar/Ur) in the demo — roadmap.

## 6. MVP Scope

### 6.1 In Scope
- Client Inquiry intake (text + voice→Whisper) → Structured Request with review/edit (FR-1–3).
- Supplier Message extraction → structured Rates with review/edit (FR-4–5).
- Seeded Rate Store with real hotels, fabricated suppliers, ~2–4 weeks history, sample messages/inquiry (FR-6–7).
- Rate Comparison Intelligence: side-by-side, Best Pick + rationale, margin/Client Price, savings, trend (FR-8–12).
- Multilingual Quotation (En/Ar/Ur, RTL) + copy + PDF (FR-13–15).
- Approval workflow with status timeline + approval queue (FR-16–18).
- Staff dashboard UI (single operator), calling Groq live.

### 6.2 Out of Scope for MVP
- Image/screenshot OCR of supplier messages — `[NOTE FOR PM]` stretch goal if time permits (Groq Llama-4 vision available).
- Real auth/users/roles — auth stubbed; "approver" is a demo identity.
- Persistent database — in-memory/seed file is acceptable for demo.
- Supplier-side automation (AI drafting rate-request messages) — roadmap.
- Tamil and additional languages — roadmap.

## 7. Success Metrics

**Primary**
- **SM-1:** Demo completes the full UJ-1 chain (voice inquiry → extraction → comparison → multilingual quote → approval) live with real Groq calls, end to end, without a hard error. Validates FR-1–FR-18.
- **SM-2:** "Wow" lands — in a walkthrough, the Comparison panel visibly shows Best Pick + rationale + savings + Margin + trend in one view. Validates FR-8–FR-12.

**Secondary**
- **SM-3:** Time from "messages pasted" to "quotation generated" is seconds, not minutes (target < ~30s incl. model latency). Validates FR-4, FR-8, FR-13.
- **SM-4:** Arabic and Urdu quotations render correctly RTL on first try. Validates FR-13.

**Counter-metrics (do not optimize)**
- **SM-C1:** Do not optimize raw speed by letting extraction fabricate missing fields. `needs review` must remain truthful even if it adds a click. Counterbalances SM-3.
- **SM-C2:** Do not bypass the approval gate to make the demo flow faster. The gate is the point. Counterbalances SM-1.

## 8. Open Questions
1. ~~Branding~~ **RESOLVED:** Brand the demo as the real client — **Nizar Tour House Madinah**, logo (`assets/brand/nizar-logo.jpeg`), phone **+966 55 030 4795**, gold/black/white palette — on dashboard and quotations/PDF.
2. ~~One vs many hotels~~ **RESOLVED:** Comparison spans **multiple hotels at once** (FR-8/FR-9 updated).
3. Exact demo script/scenario for the 5-minute walkthrough — finalize with seed data during build.
4. Logo says "Madinah", PDF says "Makkah" — treat the agency as serving **both** holy cities (Makkah + Madinah hotels in seed data). `[ASSUMPTION — confirmed reasonable; revisit if client is Makkah-only.]`

## 9. Assumptions Index
- §4.2 — Image/screenshot OCR is a stretch goal, not core MVP.
- §4.3 — Demo persistence is in-memory/seed file; no production DB.
- §6.2 — Auth is stubbed; approver is a demo identity.
- §8 — Agency serves both Makkah and Madinah hotels (seed data spans both cities).

## 10. Cross-Cutting NFRs
- **Performance:** Each AI step (transcribe, extract, compare, generate) should return within a few seconds at demo scale; show loading state and never block the UI indefinitely. Use the smallest model that meets quality (`llama-3.1-8b-instant` for light parsing, `llama-3.3-70b-versatile` for extraction/comparison/generation) — final choice in architecture.
- **Reliability/Resilience:** Every Groq call has a timeout, error surfacing, and graceful fallback (e.g., show the transcript even if parsing fails). The demo must never hard-crash on a model hiccup.
- **Determinism for demo:** Seeded data + low temperature so the headline scenario behaves consistently in front of the client.
- **Accessibility/Internationalization:** Correct RTL rendering and font support for Arabic/Urdu; numerals legible in all three languages.
- **Observability (light):** Console/devlog of each model call (model, latency) to debug live during prep.

## 11. Constraints and Guardrails

**Positioning principle — augmentation, not replacement (load-bearing)**
- This is a **co-pilot for the reservation team, not a replacement for it.** The AI does the slow, error-prone grunt work (transcribe, extract, compare, draft, translate); staff keep the judgment and the final say.
- Every design decision must preserve a human-in-the-loop: AI **drafts/suggests/flags**, the human **decides/approves**. No feature may act outwardly on its own. This principle governs all FRs and overrides any tension with raw automation/speed.
- Language, framing, and UI copy should reinforce "assists your team" — never "replaces staff."

**Safety (the core safety model)**
- AI **drafts**; a human **approves**; only then is it (simulated-)**sent**. No FR may create a path that sends without approval (FR-16–17, FR-22).
- Extraction and comparison must not fabricate rates, availability, or trends (SM-C1, FR-4, FR-12).

**Privacy**
- Demo uses fabricated suppliers/clients and seeded data; no real customer PII. Real hotel *names* and the client agency's own brand/contact details are public marketing information.
- The Groq API key is a server-side secret — never exposed to the browser; all model calls go through server routes. `[ASSUMPTION: key stored in env, not committed.]`

**Cost**
- Demo-scale usage only; prefer smaller models where quality allows to keep latency and cost low.

## 12. Aesthetic and Tone
- **Brand (real client):** **Nizar Tour House Madinah** — logo at `assets/brand/nizar-logo.jpeg`, phone **+966 55 030 4795**. Palette: gold/amber + black on white; icon motif = Makkah clock tower + Kaaba. Use the logo + brand in the dashboard header and on generated quotations/PDF so the client sees their own company using it.
- **Feel:** clean, modern, trustworthy SaaS dashboard — credible enough that staff picture themselves using it daily. Reference point for polish only: kranesoft.com (the user's separate product); not a scope driver.
- **Voice of generated text:** professional, warm, concise — like a competent reservation agent. Quotations read as client-ready, not robotic.
- **Demo-first:** the Comparison panel is the visual hero; it should be the most polished screen.

## 13. (Reserved)
*Assumptions consolidated in §9.*
