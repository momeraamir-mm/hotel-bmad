---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/briefs/brief-hotel-bmad-2026-06-11/brief.md
  - _bmad-output/planning-artifacts/prds/prd-hotel-bmad-2026-06-11/prd.md
workflowType: 'architecture'
project_name: 'hotel-bmad'
user_name: 'momer'
date: '2026-06-11'
status: 'complete'
---

# Architecture Decision Document — Makkah/Madinah Tourism AI Quotation Assistant

_Solution design for a working demo. Built against PRD `prd-hotel-bmad-2026-06-11` (18 FRs, status final). Optimized for: a credible, live, single-machine demo that wins the client — not production scale._

## Project Context Analysis

### Requirements Overview

**Functional scope (architectural read of the 18 FRs):**
- **Three AI calls on the critical path** — (1) transcription (voice inquiry → text), (2) extraction (messy supplier text → structured Rates), (3) generation/translation (Best Pick → multilingual Quotation). Plus a light parse (inquiry text → Structured Request) and a Best-Pick rationale call.
- **One deterministic core** — comparison, margin/Client Price, savings, and trend math are plain TypeScript, not LLM work. The LLM only *recommends* and *explains* the Best Pick; the numbers are computed in code (trustworthy, fast, demo-safe).
- **Seeded domain data** — real Makkah+Madinah hotels, fabricated suppliers, rates, ~3 weeks history, sample messages.
- **Stateful-ish session** — accepted Rates merge with seed; Quotations carry a Status lifecycle (Draft→Approved→Sent) and appear in an approval queue.

**NFRs that shape the design:**
- **Secret safety:** Groq key is server-side only → all model calls go through Next.js server routes; never shipped to the browser.
- **Resilience:** every model call wrapped with timeout + typed error result + graceful fallback (e.g., show transcript even if parse fails). Demo must never hard-crash.
- **Determinism for demo:** low temperature + seeded data so the headline scenario is repeatable in front of the client.
- **i18n/RTL:** quotations render in English (LTR) and Arabic/Urdu (RTL) with proper fonts.
- **Performance:** each step returns in seconds; smaller models where quality allows.

**Scale & Complexity:**
- Primary domain: **full-stack web (Next.js)**.
- Complexity: **medium** — low on infra (no real auth/DB/multi-tenant), but several AI integrations, structured-output validation, multilingual RTL rendering, and PDF export.
- Estimated components: ~8 UI components + ~5 server routes + a deterministic pricing/comparison core + seed data + a Groq integration layer.

### Cross-Cutting Concerns
- Groq integration layer (one client, model registry, JSON-mode + Whisper helpers).
- Structured-output validation (Zod) with one retry on schema failure — enforces the "never fabricate, mark `needs review`" rule.
- Error/timeout handling pattern shared across routes.
- i18n + RTL rendering for quotations.
- In-memory session store (accepted Rates + Quotations) — resets on server restart (acceptable for demo).

## Decision: Starter Template

**Decision:** Plain `create-next-app` (Next.js 16 App Router, TypeScript, Tailwind, ESLint) — **no heavyweight starter**.

**Rationale:** A demo benefits from a minimal, transparent base we fully control over an opinionated boilerplate (T3, etc.) that drags in auth/DB/tRPC we explicitly don't need (PRD Non-Goals). `create-next-app` gives us the exact surface: App Router, TS, Tailwind, fast refresh.

```bash
npx create-next-app@latest hotel-bmad --typescript --tailwind --eslint --app --src-dir --use-npm
```
*(App will be created in-place / merged into this repo.)*

## Decision: Technology Stack (versions verified live, 2026-06-11)

| Concern | Choice | Version | Why |
|---|---|---|---|
| Framework | **Next.js (App Router)** | 16.2.9 | Full-stack in one app: React UI + server Route Handlers for secret-safe Groq calls. |
| UI runtime | **React** | 19.2.7 | Bundled with Next 16. |
| Language | **TypeScript** | 5.x | Type-safe schemas end to end. |
| Styling | **Tailwind CSS** | 4.3.0 | Fast, clean SaaS look; brand palette via CSS vars (gold/black/white). |
| Icons | **lucide-react** | latest | Lightweight, professional icon set. |
| AI SDK | **groq-sdk** | 1.2.1 | Official Groq client; chat (JSON mode) + audio transcription. |
| Validation | **zod** | 3.x | Validate every LLM JSON payload against schemas; retry on failure. |
| Charts (trend) | **lightweight inline SVG sparkline** | n/a | A tiny custom SVG beats pulling a chart lib for one sparkline. |
| PDF export | **Browser print-to-PDF (print stylesheet)** | n/a | Most reliable RTL/Arabic rendering; `window.print()` on a styled quotation. `@react-pdf/renderer` noted as fallback if a true file download is required. |
| Fonts (RTL) | **Noto Naskh Arabic + Noto Nastaliq Urdu** (next/font) | n/a | Correct Arabic/Urdu shaping. |

### Groq model registry (verified live against the account key)
| Use | Model | Notes |
|---|---|---|
| Extraction, comparison rationale, quotation generation/translation | `llama-3.3-70b-versatile` | 131K ctx, reliable JSON mode + multilingual. |
| Light inquiry parsing (text) | `llama-3.1-8b-instant` | Fast/cheap for the simple parse. |
| Voice transcription | `whisper-large-v3` | Multilingual STT for client voice notes. |
| (Stretch) screenshot OCR | `meta-llama/llama-4-scout-17b-16e-instruct` | Vision; only if we add image ingestion. |

**Data persistence:** **In-memory module singleton** seeded at boot (TypeScript seed data). Accepted Rates and Quotations live in a server-side store object. No database. `[Demo tradeoff: state resets on restart — acceptable and even desirable for repeatable demos.]`

## Decision: Architectural Patterns

- **Server-only AI:** all Groq calls live in `src/lib/groq/` and are invoked exclusively from Route Handlers in `src/app/api/*`. The `GROQ_API_KEY` is read from `process.env` server-side. No client ever sees it.
- **Structured output contract:** each AI route returns `{ ok: true, data } | { ok: false, error }`. Extraction/parse prompts request JSON; output is parsed and validated with Zod; on validation failure we retry once with a corrective message, then surface `needs review` rather than fabricating.
- **Deterministic pricing core:** `src/lib/pricing.ts` computes Client Price (`cost × (1+margin)`), profit, savings (on consistent Client Price basis per FR-11), and trend deltas — pure functions, unit-testable, no LLM. The LLM's Best-Pick choice is reconciled against / can be overridden by the computed cheapest, and its job is the *rationale*.
- **Resilience:** every model call uses an `AbortController` timeout; failures return typed errors the UI renders as inline messages (never a blank screen). Transcript is shown even if downstream parse fails.
- **Prompts as modules:** versioned prompt builders in `src/lib/prompts/` keep prompt text out of route logic.
- **State:** React local state in client components; server store for cross-step session data (accepted Rates, Quotations). No global client store needed for demo scale.
- **i18n/RTL:** quotation content generated per language on demand; rendered in a component that sets `dir="rtl"` and the right font for `ar`/`ur`. App chrome stays English.

## Decision: Project Structure

```
hotel-bmad/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                  # root layout, fonts, brand header
│  │  ├─ page.tsx                    # main staff dashboard (orchestrates the flow)
│  │  ├─ globals.css                 # Tailwind + brand CSS vars + print styles
│  │  └─ api/
│  │     ├─ transcribe/route.ts      # FR-2  audio → whisper-large-v3 → text + summary
│  │     ├─ parse-inquiry/route.ts   # FR-1/3 text → Structured Request (+ follow-up Qs)
│  │     ├─ extract-rates/route.ts   # FR-4  supplier text → Rate[] (zod-validated)
│  │     ├─ compare/route.ts         # FR-9  Best-Pick rationale over computed comparison
│  │     └─ quote/route.ts           # FR-13 generate + translate quotation (en/ar/ur)
│  ├─ components/
│  │  ├─ BrandHeader.tsx             # Nizar logo + name + phone
│  │  ├─ InquiryIntake.tsx           # FR-1/2/3 text + voice upload, structured request editor
│  │  ├─ SupplierExtractor.tsx       # FR-4/5 paste messages, edit extracted rates
│  │  ├─ ComparisonPanel.tsx         # FR-8..12 HERO: table, best pick, margin, savings, trend
│  │  ├─ Sparkline.tsx               # FR-12 inline SVG trend
│  │  ├─ QuotationView.tsx           # FR-13/14/15 multilingual render, copy, print/PDF
│  │  ├─ ApprovalBar.tsx             # FR-16/17 status timeline + approve/send
│  │  └─ ApprovalQueue.tsx           # FR-18 list of quotations + statuses
│  ├─ lib/
│  │  ├─ groq/
│  │  │  ├─ client.ts                # Groq singleton + models registry + timeout wrapper
│  │  │  ├─ chat.ts                  # JSON-mode chat helper (+ zod validate + retry)
│  │  │  └─ transcribe.ts            # whisper helper
│  │  ├─ prompts/                    # extract.ts, parseInquiry.ts, bestPick.ts, quote.ts
│  │  ├─ schemas.ts                  # zod: Rate, StructuredRequest, Quotation, etc.
│  │  ├─ pricing.ts                  # margin/Client Price/savings/trend (pure)
│  │  ├─ compare.ts                  # deterministic matching + ranking
│  │  ├─ store.ts                    # in-memory session store (rates, quotations)
│  │  ├─ seed/                       # hotels.ts, suppliers.ts, rates.ts, history.ts, samples.ts
│  │  └─ i18n.ts                     # language + RTL helpers, quotation labels
│  └─ types.ts                       # shared TS types (mirror zod)
├─ public/
│  └─ brand/nizar-logo.jpeg          # copied from assets/brand
├─ .env.local                        # GROQ_API_KEY (gitignored)
├─ .env.example                      # GROQ_API_KEY= (committed)
└─ package.json
```

## Open Architecture Notes
- **PDF approach** chosen for RTL reliability is browser print. If a one-click downloadable file is judged essential at build time, swap in `@react-pdf/renderer` with embedded Noto fonts (more work for Arabic shaping).
- **Best Pick reconciliation:** computed-cheapest is the source of truth for the "best price"; the LLM provides the human-readable rationale and can flag non-price factors (inclusions, availability, location tier). This keeps the headline number trustworthy.
- **Key handling for demo:** `.env.local` holds the provided Groq key; `.env.example` documents it; key is never committed and never reaches the client bundle.

## Validation — FR Coverage Map

Every PRD functional requirement maps to a concrete component/route. No gaps.

| FR | Capability | Server route(s) | UI / lib |
|---|---|---|---|
| FR-1 | Text inquiry → Structured Request | `api/parse-inquiry` | `InquiryIntake`, `schemas`, `prompts/parseInquiry` |
| FR-2 | Voice inquiry → transcript + summary | `api/transcribe` | `InquiryIntake`, `groq/transcribe` |
| FR-3 | Review/correct request + follow-up Qs + guard | `api/parse-inquiry` | `InquiryIntake` |
| FR-4 | Extract Rates from supplier text | `api/extract-rates` | `SupplierExtractor`, `prompts/extract`, `schemas` |
| FR-5 | Confirm/correct/normalize Rates | — | `SupplierExtractor`, `store` |
| FR-6 | Seeded hotels/suppliers/rates/history/samples | — | `lib/seed/*` |
| FR-7 | Merge new Rates into working set | — | `store`, `compare` |
| FR-8 | Multi-hotel, multi-supplier table | — | `ComparisonPanel`, `compare.ts` |
| FR-9 | AI Best Pick + rationale | `api/compare` | `compare.ts` (computed) + `prompts/bestPick` |
| FR-10 | Margin → Client Price + profit | — | `pricing.ts`, `ComparisonPanel` |
| FR-11 | Savings callout (Client Price basis) | — | `pricing.ts`, `ComparisonPanel` |
| FR-12 | Trend + sparkline | — | `pricing.ts`, `Sparkline`, `seed/history` |
| FR-13 | Multilingual quotation (en/ar/ur, RTL) | `api/quote` | `QuotationView`, `i18n`, `prompts/quote` |
| FR-14 | Copy to clipboard | — | `QuotationView` |
| FR-15 | Download/print PDF (RTL-safe) | — | `QuotationView` (print CSS) |
| FR-16 | Status lifecycle Draft→Approved→Sent | — | `store`, `ApprovalBar` |
| FR-17 | Human approval gate (records approver+time) | — | `ApprovalBar`, `store` |
| FR-18 | Approval queue | — | `ApprovalQueue`, `store` |

**Cross-cutting validation:**
- Secret safety ✅ (all model calls server-side in `api/*`).
- No-fabrication rule ✅ (zod validate + retry → `needs review`; numbers computed in `pricing.ts`).
- Resilience ✅ (timeout wrapper + typed error results).
- RTL ✅ (`i18n` + Noto fonts + print CSS).
- Determinism ✅ (seed data + low temperature).

**Verdict:** Architecture is complete and covers all 18 FRs. Ready for Epics & Stories.

## Production Design (Roadmap) — Supplier Request Tracking

_Not built in the demo (in-memory store + no live WhatsApp are Non-Goals). This is the long-term design for maintaining, per client inquiry, which suppliers were contacted and what they replied. Captured here so the demo's simulated loop has a clear production path._

### Problem
The demo holds drafts/replies in volatile UI state. In production we must durably answer: *for this client request, which suppliers did we contact, when, through what message, and what did each reply?* — and correlate asynchronous inbound replies back to the right outbound request.

### Entities (persisted; extends the Phase-2 central rate DB)
- **Inquiry** — `{ id, clientId/phone, city, dates, pax, roomType, status, createdAt }`. The client request.
- **RateRequest** — one row **per (inquiry, supplier)** contacted: `{ id, inquiryId, supplierId, hotelIds[], messageText, channel, status, draftedAt, approvedBy, sentAt }`.
  - status lifecycle: `drafted → approved → sent → replied | no_response | expired`.
- **SupplierReply** — `{ id, rateRequestId, rawMessage, extractedChanges[], receivedAt }`.
- Relationship: **Inquiry 1—N RateRequest 1—(0..1) SupplierReply**. This relationship *is* the "which suppliers were messaged for this client" record; it is queryable and auditable.

### Persistence
Replace the in-memory `store.ts` singleton with a real database (Postgres / Airtable per the requirements' Phase-2). RateRequest + SupplierReply live alongside the Rate table; nothing is lost on restart.

### Inbound reply correlation (the hard part)
A supplier's WhatsApp reply is just an incoming message with no request id. Approach:
1. Maintain an **open-requests queue per supplier** keyed on the WhatsApp **contact/thread id**.
2. On an inbound message from a supplier, match it to that supplier's most recent open `RateRequest`.
3. Have the LLM **verify** the reply actually concerns the expected hotel(s)/dates before applying the extracted rates (guards against mis-correlation), else flag for human review.

### Operational behaviors this unlocks
- **Dedup / no-spam:** skip suppliers already contacted for the same inquiry; track `lastRequestedAt` per (supplier, hotel, dates).
- **Follow-ups:** `sent` with no reply past an SLA → auto-draft a reminder (still human-approved).
- **Audit:** full per-inquiry outbound/inbound thread retained — who approved, sent time, reply time.
- **Freshness link:** each accepted SupplierReply updates the Rate's `capturedAt` (the demo's freshness mechanism, now backed by a durable reply record).

### Demo → production mapping
| Demo (now) | Production |
|---|---|
| Drafts/replies in React state | `RateRequest` + `SupplierReply` rows in DB |
| Simulated reply (`supplierSim` + LLM) | Real inbound WhatsApp message, AI-extracted |
| Staggered client-side timers | Real-world reply latency; webhook-driven updates |
| `/api/supplier-reply` applies override | Inbound webhook correlates → updates Rate + reply record |
| No persistence (resets on restart) | Durable, queryable, auditable per inquiry |
