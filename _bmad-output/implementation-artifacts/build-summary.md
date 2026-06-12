---
title: "Build Summary — Makkah/Madinah Tourism AI Quotation Assistant (Demo)"
date: 2026-06-11
status: complete
---

# Build Summary

Implemented the full demo across all 6 epics / 22 stories from `epics.md`. Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Groq (groq-sdk 1.2.1), zod.

## Verification — `npm run build`
Compiled successfully, TypeScript passed, all routes built. 0 errors.

## Live smoke test (real Groq calls, prod server)
| Endpoint | FR | Result |
|---|---|---|
| `GET /api/rates` | FR-6/7 | ✅ 32 seeded rates, real hotels (e.g. Swissôtel Makkah, Al-Haramain Travels, SAR 1407) |
| `POST /api/parse-inquiry` | FR-1/3 | ✅ "…Makkah, double, 3 ppl, 23–27 Dec" → city=Makkah, room=Double, pax=3, dates correct + summary |
| `POST /api/extract-rates` | FR-4 | ✅ messy msg → 2 rates; triple's `rooms=null` (NOT fabricated) |
| `POST /api/compare` | FR-9 | ✅ Best-Pick rationale + tradeoff returned |
| `POST /api/quote` (ar) | FR-13 | ✅ Arabic RTL quotation; math correct (1751/night × 4 = 7004 SAR) |
| `PATCH /api/quotations` | FR-16/17 | ✅ send-before-approve **blocked**; approve→send works, approver+timestamps recorded |

## FR coverage (all 18 implemented)
- FR-1/2/3 → `InquiryIntake` + `api/parse-inquiry`, `api/transcribe`
- FR-4/5/7 → `SupplierExtractor` + `api/extract-rates`, `api/accept-rates`, `store`
- FR-6 → `lib/seed/*` (8 hotels Makkah+Madinah, 5 suppliers, 32 rates, 3-week history)
- FR-8/9/10/11/12 → `ComparisonPanel` + `compare.ts`/`pricing.ts` + `api/compare` + `Sparkline`
- FR-13/14/15 → `QuotationView` + `api/quote` (en/ar/ur, copy, print-PDF)
- FR-16/17/18 → `QuotationView` (ApprovalBar) + `ApprovalQueue` + `api/quotations`

## Key implementation decisions honored from architecture
- LLM for language only; **money math in pure TS** (`pricing.ts`, `compare.ts`).
- Server-only Groq (key never in client bundle); zod-validate + 1 retry → else `needs review`.
- In-memory seeded store; no DB.
- Best Pick = computed cheapest valid rate; LLM supplies the rationale only (guarded so it cannot swap the pick).

## Notes / stretch left as roadmap
- Screenshot/image OCR (vision) — not built (stretch, per PRD).
- Voice path tested via route logic; uses `whisper-large-v3` on any uploaded audio (mp3/m4a/wav/ogg).
- Real WhatsApp API, auth, DB, payments, Tamil — intentionally out of scope (PRD Non-Goals).

## Post-build enhancements (2026-06-11, same session)

### In-browser audio recording
- `InquiryIntake` now records via MediaRecorder (webm/ogg/mp4) in addition to file upload; sends to the verified `/api/transcribe` path. `transcribe` route accepts the recorded containers.

### Conversational follow-up loop (FR-3b) — Story 2.4
- New `/api/inquiry-chat` route + `prompts/followUp.ts` + `inquiryChatSchema`. When required fields (city/dates/pax/room) are missing, the AI asks one question at a time; answers merge into the request until complete.
- **Live test:** vague inquiry ("hotel in Makkah") → Q1 dates → Q2 guests → merged to Makkah/2026-12-23→27/3pax/Triple, done=true. ✅

### Rate freshness & supplier re-check (FR-19/20/21) — Epic 7
- `Rate.capturedAt` + `pricing.freshness()`; seed rates aged 0.2–5d so fresh/aging/stale all show.
- `/api/recheck` route + `prompts/supplierRequest.ts`: AI drafts the supplier rate-request message; simulated reply refreshes cost/availability/`capturedAt` via `store` overrides (`setRateOverride`).
- `ComparisonPanel`: freshness badges + "Re-check with supplier" action showing the drafted message + change summary.
- `QuotationView`: stale-rate advisory warning before sending (uses `rateCapturedAt` on the Quotation).
- **Live test:** stale rate (Shaza Madinah, 5d) → AI drafted supplier message → simulated reply (SAR 935→972, avail 3→1) → rate refreshed to "just now". ✅

### Auto rate-requests to suppliers (FR-22) — Story 7.4
- New `/api/draft-requests` (groups matching rates by supplier, AI-drafts one request each) + `/api/refresh-rates` (one-click send-all, simulated, no LLM) + `prompts/supplierBatchRequest.ts` + `lib/supplierSim.ts` (shared drift helper, also used by `/api/recheck`).
- `SupplierAutoRequests` component auto-drafts when a client request completes; "Send all requests" refreshes the matching rates. Safety model preserved (drafts → one approval → simulated send).
- **Live test:** complete Makkah/Double request → 5 suppliers auto-drafted (grouped by hotels) → send-all refreshed 15 rates (7↑ 8↓) → all 15 fresh. ✅

### Supplier Responses thread
- `/api/refresh-rates` now takes supplier groups, refreshes each rate, and generates the supplier's WhatsApp-style **reply message** (`prompts/supplierReply.ts`) per supplier, returning replies + per-hotel changes.
- `SupplierAutoRequests` renders a **conversation thread**: outbound request bubble (Nizar → supplier) → inbound reply bubble (supplier → AI) with rate/availability change chips. Closes draft → reply → updated-rate visibly.
- **Live test:** send-all → each supplier replied with a messy confirmation (e.g., "Swissôtel 1351/night 8 DBL bf, Pullman 1504 …"); changes parsed and rates updated. ✅

### UI consolidation — single "Suppliers" card
- Merged the manual paste-extract block and the auto rate-request block into one **"2 · Suppliers"** card with two tabs: **Paste a message** (inbound/unsolicited supplier message → extract) and **Auto-request rates** (outbound/solicited fan-out + responses). `SupplierExtractor` and `SupplierAutoRequests` refactored into bodies; new `SuppliersPanel` wrapper. Declutters the dashboard while keeping both directions of the supplier workflow.

### Asynchronous supplier replies
- Suppliers no longer reply instantly. Batch `/api/refresh-rates` replaced by per-supplier `/api/supplier-reply`; `SupplierAutoRequests` schedules staggered client-side delays (deterministic per supplier), shows "awaiting reply… / typing…" per supplier, and each arriving reply refreshes only that supplier's rates (incremental `onRefreshed`).
- **Live test:** single supplier-reply → "hi, Swissôtel Makkah DBL 1351 SAR/night, 8 rooms left, bf included" + change captured. ✅

All builds clean (TypeScript passed). Routes now: parse-inquiry, transcribe, inquiry-chat, extract-rates, accept-rates, rates, compare, quote, quotations, recheck, draft-requests, supplier-reply.

## How to run
See `README.md`. `npm install && npm run dev` → http://localhost:3000. Demo Groq key already in `.env.local`.
