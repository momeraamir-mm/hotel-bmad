---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-hotel-bmad-2026-06-11/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/briefs/brief-hotel-bmad-2026-06-11/brief.md
project_name: 'hotel-bmad'
---

# hotel-bmad — Epic Breakdown

## Overview

Epic and story breakdown for the **Makkah/Madinah Tourism AI Quotation Assistant** demo, decomposing the PRD (18 FRs) and Architecture decisions into implementable stories for the Dev agent. Organized by user value; each epic delivers something demonstrable and depends only on earlier epics.

## Requirements Inventory

### Functional Requirements
- **FR-1** Submit a text Client Inquiry → Structured Request.
- **FR-2** Submit a voice Client Inquiry → Whisper transcript + one-line summary → Structured Request.
- **FR-3** Review/correct the Structured Request; `needs review` flags; AI follow-up-question suggestions; Comparison blocked until Dates + Room Type resolved.
- **FR-4** Extract structured Rates from a messy supplier text message (no fabrication; missing → `needs review`).
- **FR-5** Confirm/correct/normalize extracted Rates; `needs review` excluded from Best Pick.
- **FR-6** Seeded hotels/suppliers/rates/history/sample messages + sample inquiry.
- **FR-7** Newly accepted Rates merge into the working comparison set.
- **FR-8** Multi-hotel, multi-supplier side-by-side comparison table (group/sort).
- **FR-9** AI Best Pick (Hotel + Supplier) with rationale.
- **FR-10** Editable Margin % (default 15%) → Client Price + profit, live.
- **FR-11** Savings callout on a consistent Client Price basis.
- **FR-12** Trend insight (delta vs prior week) + sparkline; "no history" when absent.
- **FR-13** Generate multilingual Quotation, toggle English/Arabic/Urdu (RTL-aware).
- **FR-14** Copy Quotation to clipboard.
- **FR-15** Download/print Quotation as PDF (RTL preserved).
- **FR-16** Quotation Status lifecycle Draft → Approved → Sent (timeline).
- **FR-17** Human approval gate (no Draft→Sent without explicit Approve; record approver + timestamp).
- **FR-18** Approval queue listing all Quotations + statuses.
- **FR-3b** Conversational follow-up loop: AI asks the client for missing required fields one at a time until the request is complete.
- **FR-19** Rate freshness indicator (`capturedAt` → fresh/aging/stale badge).
- **FR-20** Re-check rate & availability with supplier (AI drafts request; simulated reply refreshes the Rate).
- **FR-21** Stale-rate guard: warn before sending a Quotation built on a stale Rate.
- **FR-22** Auto rate-requests to suppliers when a client inquiry is complete (AI drafts a batch; one-click approve → send-all refreshes matching Rates).

### NonFunctional Requirements
- **NFR-1 (Performance):** each AI step returns in seconds; smallest model that meets quality; loading states; never block UI indefinitely.
- **NFR-2 (Resilience):** every Groq call has timeout + typed error + graceful fallback (show transcript even if parse fails); demo never hard-crashes.
- **NFR-3 (Determinism):** seeded data + low temperature so the headline scenario is repeatable.
- **NFR-4 (i18n/RTL):** correct RTL rendering + Arabic/Urdu fonts; legible numerals in all 3 languages.
- **NFR-5 (Observability):** console/devlog of each model call (model, latency).
- **NFR-6 (Safety):** AI drafts → human approves → simulated send; no fabrication of rates/availability/trends.
- **NFR-7 (Privacy/Secret):** Groq key server-side only, never in browser bundle; no real PII.
- **NFR-8 (Cost):** prefer smaller models where quality allows.

### Additional Requirements (from Architecture)
- **Starter:** `create-next-app` (Next.js 16, React 19, TypeScript, Tailwind 4, ESLint, `src/` dir). → Epic 1 Story 1.
- All Groq calls in `src/lib/groq/*`, invoked only from `src/app/api/*` Route Handlers.
- zod validation of every LLM JSON payload; retry once → else `needs review`.
- Deterministic pricing/comparison core (`pricing.ts`, `compare.ts`) — numbers in code, not LLM.
- In-memory seeded store (`store.ts`); no database.
- Fonts: Noto Naskh Arabic + Noto Nastaliq Urdu via `next/font`. PDF via browser print stylesheet.
- `.env.local` (gitignored) + `.env.example` for `GROQ_API_KEY`.
- Models: `llama-3.3-70b-versatile` (extract/rationale/quote), `llama-3.1-8b-instant` (light parse), `whisper-large-v3` (voice).

### UX Design Requirements
- None — no separate UX spec. Aesthetic/Tone guidance lives in PRD §12 (clean SaaS, Nizar brand: gold/black/white, logo + phone on header & quotations). Hero = Comparison panel is the most polished screen.

### FR Coverage Map
| FR | Epic.Story |
|---|---|
| FR-6 | 1.4 |
| FR-1 | 2.1 |
| FR-2 | 2.2 |
| FR-3 | 2.3 |
| FR-4 | 3.1 |
| FR-5 | 3.2 |
| FR-7 | 3.3 |
| FR-8 | 4.1 |
| FR-9 | 4.2 |
| FR-10 | 4.3 |
| FR-11 | 4.4 |
| FR-12 | 4.5 |
| FR-13 | 5.1 |
| FR-14 | 5.2 |
| FR-15 | 5.3 |
| FR-16 | 6.1 |
| FR-17 | 6.2 |
| FR-18 | 6.3 |
| FR-3b | 2.4 |
| FR-19 | 7.1 |
| FR-20 | 7.2 |
| FR-21 | 7.3 |
| FR-22 | 7.4 |
| NFR-1..8 | Cross-cutting; enforced in 1.2 (groq layer), 1.4 (seed/determinism), and every AI story |

## Epic List
1. **Foundation & Branded Dashboard Shell** — a running, branded Next.js app with the Groq layer, schemas, seed data, and dashboard shell. *(Standalone; enables all.)*
2. **Client Inquiry Intake** — capture and understand a client request via text or voice. *(Uses Epic 1.)*
3. **Supplier Rate Capture** — turn messy supplier messages into clean structured Rates. *(Uses Epic 1.)*
4. **Rate Comparison Intelligence (HERO)** — the decision screen: compare across hotels/suppliers, Best Pick, margin, savings, trend. *(Uses Epics 1, 3.)*
5. **Multilingual Quotation & Output** — client-ready quote in En/Ar/Ur with copy + PDF. *(Uses Epic 4.)*
6. **Approval Workflow** — the safety gate and approval queue. *(Uses Epic 5.)*
7. **Rate Freshness & Supplier Re-check** — keep volatile rates/availability current; AI-drafted supplier requests; stale-rate guard. *(Uses Epics 1, 4, 5.)*

---

## Epic 1: Foundation & Branded Dashboard Shell

Goal: stand up a running, on-brand Next.js app with everything shared by later epics — AI connectivity, data contracts, realistic seed data, and the dashboard shell. Demonstrable: the branded Nizar dashboard loads with live (seeded) hotels and a working Groq health check.

### Story 1.1: Initialize project from starter

As a developer,
I want the Next.js project scaffolded from the architecture's starter with the brand theme,
So that all later stories build on a consistent, on-brand foundation.

**Acceptance Criteria:**

**Given** an empty repo
**When** the project is initialized
**Then** `create-next-app` (Next.js 16, React 19, TypeScript, Tailwind 4, ESLint, `src/` dir, App Router) is set up and `npm run dev` serves a page
**And** Tailwind is configured with brand CSS variables (gold/amber, black, white) and Noto Naskh Arabic + Noto Nastaliq Urdu loaded via `next/font`
**And** the Nizar logo is copied to `public/brand/nizar-logo.jpeg`
**And** `.env.local` holds `GROQ_API_KEY` (gitignored) and `.env.example` documents it.

### Story 1.2: Groq integration layer

As a developer,
I want a server-only Groq client with JSON-chat and transcription helpers, timeouts, and validation/retry,
So that every AI feature is secret-safe, resilient, and returns validated data.

**Acceptance Criteria:**

**Given** `GROQ_API_KEY` in the server environment
**When** a helper is called from a Route Handler
**Then** `src/lib/groq/client.ts` exposes a singleton + model registry and an `AbortController` timeout wrapper
**And** `chat.ts` requests JSON mode, validates output against a provided zod schema, and retries once with a corrective message before failing
**And** `transcribe.ts` wraps `whisper-large-v3`
**And** the key is never imported into a client component (verified: not in client bundle)
**And** each call logs model + latency to the server console (NFR-5).

### Story 1.3: Domain schemas & types

As a developer,
I want zod schemas and TypeScript types for the domain,
So that data is validated consistently across routes and UI.

**Acceptance Criteria:**

**Given** the Glossary in the PRD
**When** schemas are defined in `src/lib/schemas.ts`
**Then** there are zod schemas for Hotel, Supplier, Rate (with `needs review`/null-able fields), StructuredRequest, Quotation, and Status
**And** Room Type is an enum (Double/Triple/Quad/Suite/…) and currency is SAR
**And** inferred TS types are exported for use across the app.

### Story 1.4: Seed data & in-memory store *(FR-6)*

As a reservation agent,
I want the demo to open with realistic Makkah & Madinah hotels and supplier rates,
So that the demo is credible with zero setup.

**Acceptance Criteria:**

**Given** the app starts
**When** seed data loads
**Then** ≥6 real hotels spanning Makkah and Madinah exist, each with ≥3 fabricated suppliers and SAR rates
**And** each supplier/hotel has ≥3 weekly historical data points (for trend)
**And** ≥3 realistic messy supplier message samples and ≥1 sample client inquiry (text; an audio sample optional) are available for the demo
**And** `src/lib/store.ts` provides an in-memory session store for accepted Rates and Quotations.

### Story 1.5: Dashboard shell & brand header

As a reservation agent,
I want a branded dashboard that frames the workflow stages,
So that the tool looks like Nizar Tour House's own system.

**Acceptance Criteria:**

**Given** the app loads
**When** the dashboard renders
**Then** a `BrandHeader` shows the Nizar logo, "Nizar Tour House Madinah", and +966 55 030 4795
**And** the layout presents the flow areas (Inquiry → Supplier Rates → Comparison → Quotation → Approvals) in a clean SaaS style
**And** seeded hotels are visibly available to the comparison area.

---

## Epic 2: Client Inquiry Intake

Goal: staff can bring a client request into the system — typed or as a voice note — and get a clean, editable Structured Request. Demonstrable: paste/utter a request, see structured fields with follow-up prompts.

### Story 2.1: Text inquiry → Structured Request *(FR-1)*

As a reservation agent,
I want to paste a client's text inquiry and get structured fields,
So that I can start a quote without manual data entry.

**Acceptance Criteria:**

**Given** non-empty inquiry text in `InquiryIntake`
**When** I submit it
**Then** `POST /api/parse-inquiry` returns a StructuredRequest {area/hotel, dates, pax, room type, notes}, each filled or `unknown`
**And** empty input is rejected client-side with no LLM call
**And** the result renders in an editable form.

### Story 2.2: Voice inquiry → transcript + summary *(FR-2)*

As a reservation agent,
I want to upload a client's voice note and have it understood,
So that voice requests don't slow me down.

**Acceptance Criteria:**

**Given** a supported audio file (mp3/m4a/wav/ogg)
**When** I upload it
**Then** `POST /api/transcribe` returns the transcript (via `whisper-large-v3`) and it is shown
**And** a one-line plain-language summary of the inquiry is shown
**And** the transcript is parsed into the same StructuredRequest shape as 2.1
**And** an unsupported/empty file shows a clear error and creates no quotation (NFR-2).

### Story 2.3: Review request + follow-ups + guard *(FR-3)*

As a reservation agent,
I want to correct the parsed request and be prompted about gaps,
So that comparisons run on accurate inputs.

**Acceptance Criteria:**

**Given** a StructuredRequest with some `unknown` fields
**When** it renders
**Then** `unknown` fields are flagged **needs review**
**And** for each gap the AI suggests a clarifying follow-up question to ask the client
**And** edits persist downstream
**And** the "Run Comparison" action is disabled until Dates and Room Type are resolved.

### Story 2.4: Conversational follow-up loop *(FR-3b)*

As a reservation agent,
I want the AI to chat with the client to fill in missing details automatically,
So that an incomplete inquiry becomes a complete, quotable request without my manual chasing.

**Acceptance Criteria:**

**Given** an inquiry where required fields (city, dates, pax, room type) are missing
**When** intake completes
**Then** a chat thread opens and the AI asks one focused follow-up question at a time
**And** each typed client answer is merged into the Structured Request (fields fill live; nothing fabricated)
**And** the loop ends when all required fields are resolved, or staff dismiss it to edit manually
**And** on completion the request can flow into Comparison with no `unknown` blockers.

---

## Epic 3: Supplier Rate Capture

Goal: turn messy supplier text into clean, normalized Rates that feed the comparison. Demonstrable: paste a chaotic message, watch it become structured rate rows, correct any gaps.

### Story 3.1: Extract Rates from supplier message *(FR-4)*

As a reservation agent,
I want to paste a supplier's messy message and get structured rates,
So that I don't transcribe rates by hand.

**Acceptance Criteria:**

**Given** a pasted Supplier Message in `SupplierExtractor`
**When** I extract
**Then** `POST /api/extract-rates` returns one or more Rate objects validated against the schema
**And** a message with multiple room types yields multiple rows
**And** unparseable fields are `null`/`needs review`, never fabricated (NFR-6)
**And** extraction uses JSON mode + zod validate + one retry.

### Story 3.2: Review/correct/accept Rates *(FR-5)*

As a reservation agent,
I want to fix and accept extracted rates,
So that only trustworthy rates enter the comparison.

**Acceptance Criteria:**

**Given** extracted Rates with some `needs review` fields
**When** I edit and accept
**Then** Room Types normalize to the enum and currency is SAR
**And** `needs review` Rates cannot be selected as Best Pick until resolved
**And** accepted Rates are stored for the session.

### Story 3.3: Merge accepted Rates into working set *(FR-7)*

As a reservation agent,
I want my newly added rates to appear alongside seeded rates,
So that the comparison reflects what I just received.

**Acceptance Criteria:**

**Given** an accepted Rate for a seeded hotel
**When** I open the comparison
**Then** the new Rate appears alongside seeded Rates for that hotel/dates within the session.

---

## Epic 4: Rate Comparison Intelligence (HERO)

Goal: the decision screen. Compare every matching rate across hotels and suppliers, recommend the Best Pick with a reason, apply margin, show savings and trend. Demonstrable: the jaw-drop moment.

### Story 4.1: Multi-hotel comparison table *(FR-8)*

As a reservation agent,
I want all matching rates across hotels and suppliers in one table,
So that I can see every option at a glance.

**Acceptance Criteria:**

**Given** a resolved request (Dates + Room Type) and seeded/accepted Rates
**When** I run the comparison
**Then** `ComparisonPanel` shows rows for every matching Rate across multiple Hotels and Suppliers, grouped/sortable by Hotel and Supplier
**And** each row shows Hotel, Supplier, Cost Price (SAR), Inclusions, Availability
**And** `needs review` Rates are visually distinct and excluded from Best Pick
**And** comparison matching/ranking is computed in `compare.ts` (deterministic), not by the LLM.

### Story 4.2: AI Best Pick + rationale *(FR-9)*

As a reservation agent,
I want the system to recommend the best option and explain why,
So that I can decide quickly and confidently.

**Acceptance Criteria:**

**Given** a computed comparison
**When** the Best Pick is determined
**Then** the cheapest valid option (by computed Client Price) is the source of truth for "best price"
**And** `POST /api/compare` returns a 1–2 sentence rationale citing concrete factors (price, inclusions, availability, hotel tier)
**And** when top options are within a small threshold, the rationale acknowledges the tradeoff
**And** the Best Pick row is highlighted.

### Story 4.3: Margin → Client Price + profit *(FR-10)*

As a reservation agent,
I want to set a margin and see client price and profit,
So that I quote profitably.

**Acceptance Criteria:**

**Given** the comparison
**When** I change the Margin % (default 15%)
**Then** Client Price = Cost × (1 + Margin) and profit = Client Price − Cost update live
**And** values are computed in `pricing.ts` (pure functions).

### Story 4.4: Savings callout *(FR-11)*

As a reservation agent,
I want to see how much the best option saves,
So that I can show the client value.

**Acceptance Criteria:**

**Given** ≥2 matching Rates
**When** the comparison renders
**Then** "Save SAR X vs {next hotel/supplier}" is shown where X = next-best Client Price − Best Pick Client Price (consistent Client Price basis)
**And** with only one match, the callout is hidden gracefully.

### Story 4.5: Trend insight + sparkline *(FR-12)*

As a reservation agent,
I want to see how a supplier's price is moving,
So that I can judge timing.

**Acceptance Criteria:**

**Given** seeded history for a supplier/hotel
**When** the comparison renders
**Then** a delta vs the most recent prior week (e.g., "+12% vs last week") and a small SVG `Sparkline` are shown
**And** with no history, "no recent history" is shown instead of a fabricated trend (NFR-6).

---

## Epic 5: Multilingual Quotation & Output

Goal: produce a polished, client-ready quotation in English/Arabic/Urdu and let staff copy or export it. Demonstrable: generate, flip to Arabic (RTL), copy, print to PDF.

### Story 5.1: Generate multilingual quotation *(FR-13)*

As a reservation agent,
I want a client-ready quote I can switch between English, Arabic, and Urdu,
So that I can serve clients in their language.

**Acceptance Criteria:**

**Given** a Best Pick (or chosen Rate) + Margin
**When** I generate the quotation
**Then** `POST /api/quote` produces a Quotation with hotel, room type, dates, nights, pax, Client Price, inclusions, a validity caveat, and Nizar branding
**And** a language toggle renders English (LTR) and Arabic/Urdu (RTL, correct fonts); switching language re-renders the same Quotation with unchanged numbers
**And** generation failure surfaces an error, not a blank document (NFR-2).

### Story 5.2: Copy to clipboard *(FR-14)*

As a reservation agent,
I want to copy the quotation,
So that I can paste it into WhatsApp.

**Acceptance Criteria:**

**Given** a rendered Quotation in the selected language
**When** I click Copy
**Then** the copied text matches the on-screen content for that language.

### Story 5.3: Print / download PDF *(FR-15)*

As a reservation agent,
I want a PDF of the quotation,
So that I can send a professional document.

**Acceptance Criteria:**

**Given** a rendered Quotation
**When** I click Download/Print PDF
**Then** a print-optimized view opens (browser print-to-PDF) preserving layout
**And** Arabic/Urdu print right-to-left with correct script.

---

## Epic 6: Approval Workflow

Goal: enforce the safety model and give the owner an auditable view. Demonstrable: approve → send → see it in the queue with approver + time.

### Story 6.1: Status lifecycle & timeline *(FR-16)*

As a reservation agent,
I want each quotation to show its status,
So that I know where it stands.

**Acceptance Criteria:**

**Given** a generated Quotation
**When** it is created
**Then** its Status starts at `Draft` and an `ApprovalBar` shows a Draft → Approved → Sent timeline with timestamps
**And** "Send" is simulated (no real message transmitted).

### Story 6.2: Human approval gate *(FR-17)*

As an owner,
I want nothing sent without explicit approval,
So that errors don't reach clients.

**Acceptance Criteria:**

**Given** a `Draft` Quotation
**When** a user approves then sends
**Then** Status moves Draft → Approved → Sent and there is no path Draft → Sent without an explicit Approve
**And** the approving user (demo identity) and timestamp are recorded (NFR-6).

### Story 6.3: Approval queue *(FR-18)*

As an owner,
I want a list of all quotations and their statuses,
So that I have an auditable overview.

**Acceptance Criteria:**

**Given** one or more Quotations exist
**When** I open `ApprovalQueue`
**Then** each shows hotel, Client Price, Margin, Status, approver, and timestamp.

---

## Epic 7: Rate Freshness & Supplier Re-check

Goal: address the core volatility — "rates change and cannot be fixed in advance." Show how fresh each rate is, let staff re-verify with the supplier, and guard against sending a stale quote. Demonstrable: a stale rate, one click re-checks it (AI drafts the supplier message), it refreshes, and a stale quote warns before sending.

### Story 7.1: Rate freshness indicator *(FR-19)*

As a reservation agent,
I want to see how recently each rate was confirmed,
So that I know which rates I can trust.

**Acceptance Criteria:**

**Given** rates with `capturedAt` timestamps
**When** the comparison renders
**Then** each rate shows a badge: fresh (<24h), aging (1–3d), or stale (>3d), with a human age ("5d ago")
**And** seeded rates span a range of ages so staleness is visible immediately.

### Story 7.2: Re-check rate & availability with supplier *(FR-20)*

As a reservation agent,
I want to re-verify a rate with the supplier in one click,
So that my quote reflects today's price and availability.

**Acceptance Criteria:**

**Given** any rate in the comparison
**When** I click "Re-check with supplier"
**Then** the AI drafts a concise rate-request message to that supplier and shows it
**And** the rate's cost, availability, and `capturedAt` are refreshed (demo: simulated reply) and the badge resets to fresh
**And** the refreshed rate appears in the live comparison.

### Story 7.3: Stale-rate guard before sending *(FR-21)*

As an owner,
I want a warning before a stale-rate quote is sent,
So that we don't send outdated prices to clients.

**Acceptance Criteria:**

**Given** a Quotation whose underlying rate is stale (>3d)
**When** I view it in the approval area
**Then** an advisory warning prompts re-checking before sending
**And** the warning clears once the rate is refreshed.

### Story 7.4: Auto rate-requests on a completed inquiry *(FR-22)*

As a reservation agent,
I want the system to automatically prepare rate-requests to the right suppliers as soon as a client request is complete,
So that I gather fresh, relevant rates without manually chasing each supplier.

**Acceptance Criteria:**

**Given** a client request with city, dates, and room type resolved
**When** the request becomes complete
**Then** the system auto-drafts one rate-request per matching supplier, grouped across the hotels they quote (AI-generated, reviewable)
**And** a single "Send all requests" action approves the batch (simulated) and refreshes all those rates into the comparison
**And** nothing is sent automatically without that one approval (safety model preserved).

## Final Validation

- **FR coverage:** all FR-1…FR-18 mapped to exactly one primary story (see coverage map); NFR-1…8 enforced cross-cutting in 1.2, 1.4, and every AI story.
- **Starter:** Epic 1 Story 1.1 = project setup from `create-next-app` per Architecture. ✅
- **Entities created when needed:** schemas/seed in Epic 1 (shared foundation); no premature DB (in-memory). ✅
- **No forward dependencies:** within each epic, stories build only on earlier stories; epics depend only on earlier epics. ✅
- **Single-agent sized:** each story is scoped for one dev pass. ✅
- **User value per epic:** every epic is demonstrable, not a technical layer. ✅
