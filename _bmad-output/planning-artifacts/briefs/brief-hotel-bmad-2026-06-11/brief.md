---
title: "Product Brief: Makkah Tourism AI Quotation Assistant"
status: approved
created: 2026-06-11
updated: 2026-06-11
---

# Product Brief: Makkah Tourism AI Quotation Assistant

_Working demo — built to win the Makkah Tourism & Hotel Booking company as a client. Stack: Next.js full-stack + Groq API._

## Executive Summary

A Makkah-based Umrah/Hajj hotel-booking company (≈SAR 8M turnover, ~12 staff) runs its entire pricing operation through WhatsApp. **Suppliers** send hotel rates as messy, unstructured **text** messages; **clients** reach out with inquiries by **voice and text**. Reservation staff manually read all of it, compare suppliers, add margin, and hand-type quotations, often in several languages. The process is slow and error-prone, and it breaks down exactly when it matters most: the Hajj, Ramadan, and December peaks.

This product is an **AI reservation agent** that turns the chaos of supplier WhatsApp messages into clean, compared, margin-loaded, ready-to-send quotations — with a human approving before anything goes out. The centerpiece is **rate-comparison intelligence**: drop in what three or four suppliers quoted for the same hotel and dates, and the system instantly normalizes them into one table, picks the best deal and explains why, applies the agency's margin, and shows the profit and the savings.

The demo is a credible, clickable Next.js app calling Groq's models live. It is scoped to prove one thing to this client: _"This is an extra reservation agent that never sleeps, never fat-fingers a rate, and makes you faster and more profitable during peak season — while you stay in control."_

## The Problem

Reservation staff today live inside WhatsApp threads:

- **Supplier rates arrive as noise (text).** A supplier message might read `"Swissotel makkah 23-27 dec DBL 1450 sar incl bf, triple 1850, only 6 rooms left"` — no structure, inconsistent abbreviations, mixed languages, a different format from every supplier.
- **Client inquiries arrive by voice and text.** A pilgrim sends a WhatsApp voice note or a quick text — "need a hotel near Haram, 4 nights in December, 3 people" — and staff must listen/read, interpret, and chase the details before they can even start pricing.
- **Comparison is manual and lossy.** To quote one hotel, staff scroll multiple threads, mentally normalize room types and inclusions, and eyeball which supplier is cheaper. Mistakes get baked into quotes.
- **Quoting is slow.** Each quotation is retyped, the margin calculated by hand, and the result translated into the client's language. During peaks, volume explodes and quotes go out late — lost bookings.
- **Rates move constantly.** Hotel rates change daily and cannot be fixed in advance, so yesterday's quote is wrong today — and there is no memory of how a supplier's price is trending.
- **No safety rail.** With everything manual and rushed, wrong availability or stale pricing reaches the client.

The cost of the status quo: lost speed, lost margin, lost bookings, and reputational risk — concentrated in the three windows that drive the year's revenue.

## The Solution

An AI assistant that sits where the work already happens and does the reservation agent's grunt work, end to end:

1. **Intake — two channels.** _Client inquiries_ arrive as **text or a voice note** (voice transcribed via Groq Whisper); the AI understands the request and asks smart follow-ups for anything missing (dates, pax, room type, proximity to Haram). _Supplier rates_ are ingested as **text** (a pasted message, optionally a screenshot).
2. **Extract.** Pull structured rate data from supplier messages with an LLM: hotel, supplier, room type, dates, cost price, inclusions, availability.
3. **Compare (the hero).** Normalize all suppliers for the same hotel and dates into one side-by-side table; the AI highlights the best option and explains the rationale, flags availability, and shows a light price-trend signal.
4. **Price.** Apply a configurable margin %, surfacing cost vs. client price, profit per room/night, and a "you save SAR X by choosing supplier Y" callout.
5. **Quote.** Generate a polished, client-ready quotation, rendered on demand in **English, Arabic, or Urdu** (RTL-aware).
6. **Approve.** Nothing is "sent" until a human reviews and clicks approve — the **Drafts → Human Approval → Sent** safety model.

The experience: paste the mess, watch it become a decision, approve, done — in seconds, not minutes.

## What Makes This Different

- **Built for THIS workflow, not generic chat.** It models the agency's real loop (supplier message → comparison → margin → multilingual quote → approval), not a blank ChatGPT box staff must prompt correctly every time.
- **Comparison intelligence, not just extraction.** The value is the side-by-side decision and the margin/savings math — the thing staff are slowest and least consistent at.
- **Speaks the client's languages.** Native English/Arabic/Urdu output with correct RTL — directly relevant to a multilingual pilgrim market.
- **Human stays in control.** The approval gate is a feature, not a limitation — it directly addresses the "changing availability/pricing causes mistakes" fear.
- **Honest about the moat.** The advantage here is fit, speed, and execution — a focused tool that feels like it was made for this agency. It is not a defensible technical moat, and we do not pretend otherwise.

## Who This Serves

- **Primary — Reservation staff (the demo's main user).** Power users drowning in WhatsApp threads during peaks. Success = a correct, compared, priced, translated quote in seconds, with confidence the numbers are right.
- **Secondary — Owner/manager.** Cares about speed, margin protection, fewer errors, and scaling headcount-free through peak season. Success = faster quotes, protected margins, an auditable approval trail.
- **Downstream — The client/pilgrim.** Receives a clear, professional quote in their own language, faster. Not a direct user of the demo, but the reason quality and language matter.

## Success Criteria

**For the demo (the immediate goal — win the client):**

- In a 5-minute walkthrough, a messy multi-supplier scenario becomes a compared, priced, approved, multilingual quotation — live, using real Groq calls.
- The rate-comparison panel produces a visible "I want that" moment (best-pick rationale + savings + margin).
- The client recognizes their own pain in the seeded data (real Makkah hotels, realistic messy messages).
- A client **voice inquiry → transcript → understood request → quotation** works end-to-end on at least one example.

**For the product it implies (signals if pursued):**

- Time-to-quote drops from minutes to seconds; quotes/hour rises during peak.
- Reduced pricing/availability errors reaching clients.
- Margin consistency (no under-pricing from manual error).

## Scope

**In (demo build):**

- **Client inquiry intake via text or voice note** (Groq Whisper transcription) + AI follow-up questions to complete the request.
- Paste / upload **supplier rate messages (text)**.
- LLM **extraction** of structured rate data (hotel, supplier, room, dates, cost, inclusions, availability).
- **Rate-comparison panel:** side-by-side table, AI best-pick + rationale, configurable margin → cost/client-price/profit, light trend insight, availability + savings callout.
- **Quotation generation** rendered in **English / Arabic / Urdu** (RTL-aware).
- **Approval workflow:** draft → review/edit → approve ("send" is simulated).
- A central in-memory/seeded **rate store** with **real Makkah hotels** and fabricated suppliers/rates + realistic messy message samples.
- Staff-facing **dashboard UI** (Next.js + Tailwind), calling **Groq** live.

**Out (explicitly, for the demo):**

- Real WhatsApp Business API integration (no live messaging).
- Real authentication/multi-tenant accounts, payments, or persistent production database.
- Tamil and other languages beyond En/Ar/Ur.
- Real supplier inventory/PMS integrations; real-time live availability.
- Image/screenshot OCR is optional/stretch, not core.

## Vision

If this wins and is pursued, it becomes the agency's standing "extra reservation agent." Near-term roadmap (the phases from the requirements): a true central rate database with trend analytics; full multilingual coverage including Tamil; supplier-side automation (the AI drafts rate requests and organizes replies); and eventual WhatsApp Business API integration so the loop runs supplier → AI → database → quotation → client end-to-end — always with the human-approval gate intact. The destination: a scalable reservation workflow where AI absorbs peak-season volume without adding headcount, and humans do judgment, not data entry.
