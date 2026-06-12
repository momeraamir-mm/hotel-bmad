# PRD Quality Review — Makkah Tourism AI Quotation Assistant

*Reviewed against the BMad PRD validation rubric. Stakes calibrated to a **working clickable demo** (Next.js + Groq) whose job is to win Nizar Tour House Madinah as a client — not a production system. Production concerns explicitly out of scope (real auth, DB, SLAs) are not held against this PRD.*

## Overall verdict

**PASS-WITH-FIXES.** This is a strong, unusually disciplined demo PRD: it has a real thesis (turn WhatsApp chaos into a compared, marked-up, approved quote, with a human gate as the headline feature), the hero (multi-hotel rate comparison) is genuinely the best-specified area, and nearly every FR carries at least one testable consequence. The spine (Vision → JTBD → UJ → Features/FRs → Non-Goals → Scope → SMs → NFRs → Constraints) is complete and coherent. What holds it back from a clean PASS is a small set of **silent gaps and contradictions that will surface as guesswork in the architecture/epics phase**: a title/brand mismatch (the document is named "Makkah" while the confirmed client is "Madinah" and serves both cities), an under-specified savings/profit currency basis in the hero math, an unbound "needs review" propagation rule, and the FR-3 follow-up-question behavior promised in the brief but dropped in the PRD. None are demo-fatal; all are cheap to fix and worth fixing before the build to avoid divergent interpretations downstream.

## Decision-readiness — strong

A decision-maker can act on this. The two big product decisions are stated as decisions, not buried: the **approval gate is non-negotiable** (Constraints §11, SM-C2, FR-16/17) and **Comparison spans multiple hotels at once** (Open Q2 RESOLVED, FR-8/9). The PRD is honest about its own moat — it imports the brief's "not a defensible technical moat" framing into the demo's purpose rather than pretending novelty. Counter-metrics (SM-C1 truthful `needs review`, SM-C2 don't bypass the gate) are real tensions named at the points where a builder would be tempted to cut them for a smoother demo — exactly where they earn their place. Open Questions are genuinely mixed: two resolved with a strikethrough trail (good provenance), two still open (demo script, Makkah/Madinah scope), and the open ones are real rather than rhetorical.

### Findings
- **low** Open Q3 (demo script) is the one decision deferred into the build (§8) — acceptable for a demo, but it is the load-bearing input for SM-1/SM-2 ("Wow" lands). *Fix:* note that the seed data (FR-6) and the script must be co-designed, so the headline scenario is guaranteed to produce a clean multi-hotel Best Pick with savings + trend.

## Substance over theater — strong

Very little furniture. Personas are restrained — two named protagonists (Amir the agent, Sara the owner), each driving distinct FRs (Amir → the full intake/compare/quote chain; Sara → FR-18 approval queue). No persona padding, no four-persona theater. JTBD are specific and tied to the workflow (not generic "be productive"). The Aesthetic section (§12) is product-specific (real logo path, real phone number, clock-tower/Kaaba motif) rather than boilerplate, and it correctly tags kranesoft.com as a polish reference, not a scope driver. NFRs (§10) avoid the usual "must be scalable/secure" boilerplate and instead give demo-appropriate, near-testable bounds ("within a few seconds," "never block the UI indefinitely," named candidate models).

### Findings
- *(none material — substance is earned throughout.)*

## Strategic coherence — strong

The PRD has a thesis and bets on it: *the value is the comparison + margin/savings decision and the human gate, not extraction alone.* Feature ordering follows the thesis — Comparison Intelligence is explicitly flagged **(HERO)** and §12 names it "the visual hero… the most polished screen," and the success metrics validate the thesis rather than measuring activity: SM-2 measures whether the Comparison panel's wow lands, SM-C1/SM-C2 protect the two things the thesis depends on (truthful data, intact gate). MVP scope kind is clearly a *demo / problem-solving* shape and the scope logic matches it. No backlog-with-headings smell.

### Findings
- *(none material.)*

## Done-ness clarity — adequate (the hero is strong; a few FRs leak)

This is where the demo calibration still leaves real work, because story creation will lean hardest here. Most FRs carry concrete, testable consequences — FR-1, FR-2, FR-4, FR-8, FR-13, FR-16, FR-17 are unambiguous and an engineer would know "done." The hero cluster (FR-8–12) is the best-specified part of the document. But a handful of FRs have soft or under-bound edges:

### Findings
- **high** Savings/profit currency basis is ambiguous (§4.4 FR-11) — FR-11 says "X = next-best Cost (or Client Price) − Best Pick equivalent," with "(or Client Price)" leaving the basis a builder's choice. Profit (FR-10) is Client − Cost; savings (FR-11) could be computed on Cost or on Client Price, and the UJ-1 climax shows a "save SAR X" callout next to margin — these must agree or the headline number is incoherent on screen. *Fix:* pin one basis (recommend: savings shown on **Client Price** so the client-facing number and the savings callout are in the same currency-of-value), and state profit vs. savings are distinct rows.
- **high** "needs review" propagation is unbounded across the chain (FR-3, FR-5, FR-8) — FR-5 says `needs review` Rates can't be a Best Pick, and FR-8 excludes them from Best Pick, but nothing says what happens to a Structured Request that still has `unknown` fields when the user proceeds to Comparison (FR-3 only "persists edits"). Can a Comparison run on an `unknown` Room Type or Dates? The hero matches on Dates + Room Type, so an unresolved Structured Request field silently breaks the match. *Fix:* add a consequence: Comparison requires Dates + Room Type resolved; if `unknown`, block with a prompt to resolve (mirror the FR-5 rule on the request side).
- **medium** FR-3 dropped the brief's "AI asks smart follow-ups" behavior — the brief (Solution §1, Scope) promises the AI "asks for or flags anything missing" / "AI follow-up questions to complete the request," and §4.1 Description repeats "asking for or flagging anything missing." But FR-3's consequences only cover *flagging* (`needs review`) and manual edit — the *asking* half is in the prose but has no FR/testable consequence. Either it's a real feature (then it needs an FR) or it's been de-scoped to flag-only (then the Description over-promises). *Fix:* decide; if flag-only for the demo, strike "asking for" from §4.1 and FR-3 so the description matches the FRs.
- **medium** FR-12 trend window is under-specified (§4.4) — "+12% vs last week" plus a sparkline, but FR-6 only guarantees "≥1 prior data point per supplier/hotel." A single prior point yields a delta but not a credible sparkline, and "last week" implies a specific lookback the seed must honor. *Fix:* state the trend baseline (e.g., compare to the most recent prior point; sparkline needs ≥N points — raise the FR-6 history guarantee to match, or downgrade the sparkline to "when ≥N points exist").
- **low** FR-9 "small threshold" is an adjective (§4.4) — "within a small threshold, the rationale acknowledges the tradeoff." Fine for a demo, but unbounded. *Fix:* give an illustrative bound (e.g., within ~5% of Cost Price) so the builder can implement the tie-acknowledgement deterministically — which matters for the SM-2 wow being reproducible.
- **low** FR-15 "preserves layout" is soft (§4.5) — acceptable at demo stakes, but RTL PDF fidelity is historically the riskiest item here; SM-4 ("RTL on first try") raises the bar. *Fix:* none required for the verdict; flag to the architect that PDF + RTL is the single highest-risk implementation detail behind SM-4.

## Scope honesty — strong

Omissions are explicit, not inferred. §5 Non-Goals does real work (no WhatsApp API, no client portal, no payments, no Tamil), §6.2 separates MVP-out from roadmap, the OCR stretch goal carries a `[NOTE FOR PM]`, and the four `[ASSUMPTION]` tags all round-trip into the §9 index (verified below). De-scoping is proposed in the open, not done silently. Open-items density is low and appropriate for the stakes: 4 Open Questions (2 already resolved), 4 assumptions, 1 NOTE FOR PM — well within tolerance for a demo green-light.

### Findings
- **medium** Title/brand contradiction is a live scope ambiguity (title vs §8 Q4 vs §12) — the document title and Vision say "**Makkah**," the confirmed brand (Open Q1 RESOLVED, §12) is "**Nizar Tour House Madinah**," and Open Q4 resolves the conflict by declaring the agency serves **both** cities — but the Vision (§1), Glossary ("Hotel — A real Makkah property"), and FR-6 ("≥6 real **Makkah** hotels") were not updated to reflect "both cities." This is honest (Q4 names the tension) but the resolution didn't propagate, so the seed-data builder will under-build (Makkah-only) against a confirmed both-cities decision. *Fix:* propagate Q4 into the Glossary (Hotel = "a real Makkah or Madinah property") and FR-6 (seed spans both cities); optionally retitle to drop "Makkah," or add a one-line note that "Makkah Tourism" is the working title only.

## Downstream usability — adequate

This PRD is chain-top (it feeds architecture and epics), so traceability matters. IDs are clean: **FR-1 through FR-18 contiguous and unique; SM-1–4 + SM-C1–C2; UJ-1, UJ-2** — no gaps or duplicates found. SM→FR cross-references resolve (e.g., SM-2 → FR-8–12). The Glossary is present and genuinely load-bearing. Sections are mostly self-contained via Glossary terms rather than "see above." The main downstream friction is the §13 placeholder and a couple of glossary/usage drifts noted below.

### Findings
- **low** §13 is a reserved/empty section (§13) — "(Reserved) — Assumptions consolidated in §9." Harmless, but a numbered empty section invites a reader to wonder what's missing. *Fix:* delete §13 or fold its one line into §9's heading.
- **low** Status vocabulary drift: `Draft`→`Approved`→`Sent` vs the UI label "Drafts → Sent" (Glossary §3, FR-16, UJ-1) — the Glossary/FRs define a three-state lifecycle (`Draft`/`Approved`/`Sent`), but UJ-1 resolution says "status flips **Drafts → Sent**" (skipping Approved) and FR-16 writes "Draft → `Approved`/`Sent`" as if Approved and Sent collapse. For the demo this is likely intentional (Approve = Sent in one click), but the three-state timeline (FR-16) and the two-state UJ language disagree. *Fix:* state explicitly whether `Approved` and `Sent` are distinct states or one click collapses them, and align the timeline rendering (FR-16) with the UJ.

## Shape fit — strong

The PRD is shaped correctly for what it is: a single-operator staff dashboard for a demo. It uses **UJs with named protagonists** (load-bearing here because the demo *is* a 5-minute narrative walkthrough — the UJ literally is the demo script), keeps them to two, and keeps SMs demo-/operational-facing (SM-1 "completes the chain live," SM-2 "wow lands") rather than forcing user-facing engagement metrics that wouldn't apply to a pre-sales demo. It is neither over-formalized (no UJ sprawl for a one-operator tool) nor under-formalized (the hero and the safety model both get full FR treatment). The brief→PRD relationship is handled well — the PRD explicitly declines to duplicate the brief and only restates what it needs.

### Findings
- *(none material.)*

## Mechanical notes

- **ID continuity:** FR-1…FR-18 contiguous, unique, no gaps. SM-1–4, SM-C1–C2 clean. UJ-1, UJ-2 clean. No broken cross-references found (SM→FR refs resolve; Constraints→FR refs resolve).
- **Assumptions Index roundtrip:** All four inline `[ASSUMPTION]` tags (§4.2 OCR, §4.3 persistence, §6.2/§11 auth — note auth assumption is phrased in §6.2 and §11 but indexed once, fine) round-trip into §9. The §11 Privacy "key stored in env" assumption is inline but **not** indexed in §9 — minor: add it for a clean roundtrip.
- **Glossary drift:** (1) "Makkah property" in Glossary vs both-cities decision (see Scope finding). (2) `Status` vocabulary drift Draft/Approved/Sent vs UJ "Drafts → Sent" (see Downstream finding). (3) "pax" vs "guests" used interchangeably — defined together in §2.4/Glossary, harmless. (4) "Best Pick" used consistently. Overall drift is low.
- **UJ protagonist naming:** Both UJs have named protagonists carrying context inline (Amir, Sara). Good.
- **Required sections:** All expected sections present for demo stakes (Vision, Target User/JTBD, UJs, Glossary, Features/FRs, Non-Goals, MVP Scope, Success Metrics + counter-metrics, Open Questions, Assumptions Index, NFRs, Constraints, Aesthetic). §13 reserved/empty (see finding).

## Top fixes before architecture/epics (priority order)
1. **[high]** Pin the savings/profit currency basis (FR-11 vs FR-10) so the headline "save SAR X" + margin numbers are coherent.
2. **[high]** Bound `needs review`/`unknown` propagation into Comparison — Comparison must require resolved Dates + Room Type.
3. **[medium]** Propagate the both-cities decision (Q4) into Glossary "Hotel" and FR-6 seed scope; reconcile the "Makkah" title.
4. **[medium]** Resolve FR-3 "ask follow-ups" vs flag-only — add an FR or strike the prose.
5. **[medium]** Specify the trend window/sparkline data requirement (FR-12 ↔ FR-6 history guarantee).
6. **[low]** Clarify whether `Approved` and `Sent` are distinct states (FR-16 timeline vs UJ-1).
