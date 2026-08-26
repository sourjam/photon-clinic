# V2 Tickets — Translate the Claude Design mockup into working code

These tickets convert `V2-MOCK-HANDOFF/extracted/desktop-mockups-needed/project/Photon Clinic V2.dc.html`
(the primary design, per the handoff README) into a real implementation on this repo's stack.

Each ticket is sized for a **single agent session with a 128k context window**. That means:

- Every ticket restates enough product context to be understood cold.
- Every ticket embeds the **exact** design values it needs (hex, px, copy strings) so the agent
  does **not** have to load the 53KB mockup or the 17KB PRD.
- The only shared file an agent must read is `T-00-design-reference.md` (~6k tokens).
- No ticket requires reading more than ~3 source files it did not create.

**Read order for an agent picking up any ticket:** `T-00-design-reference.md` → its own ticket → the
files listed under "Files you touch".

---

## Source of truth

| Artifact | Path | Role |
|---|---|---|
| **Current mockup (V2.1)** | `V2-MOCK-HANDOFF/extracted-pt/desktop-mockups-needed/project/Photon Clinic V2.1.dc.html` | **The current design.** 1137 lines. Adds the patient form and treatment search, and restructures the state model. Built by `T-21`…`T-28`. |
| Prior mockup (V2) | `V2-MOCK-HANDOFF/extracted/desktop-mockups-needed/project/Photon Clinic V2.dc.html` | The design `T-01`…`T-19` built, now shipped. 826 lines. Still the reference for everything V2.1 did not change. |
| Superseded mockups | `Photon Clinic Assistant.dc.html`, `Photon Clinic Assistant Prototype.dc.html` | **Ignore.** V1 explorations with a 5-step rail and a fake "Prescription Created" state, explicitly rejected by `V2-DESIGN-LLM-HANDOFF.md`. |
| Design brief | `V2-DESIGN-LLM-HANDOFF.md` | The prompt the mockup was generated from. Useful for intent, not for values. |
| Product spec | `V2-PRD.md` | Scope, architecture decisions, Photon boundary. |
| Design PRD | `.../project/uploads/design-PRD.md` | Older bilingual-assistant PRD. Partly superseded — the workflow rail and "Prescription Created" sections do **not** apply to V2. |

The mockup is written in Claude Design's `x-dc` prototype DSL (`{{ binding }}`, `<sc-if>`, `<sc-for>`,
a `DCLogic` class with `state` and `renderVals()`). **Do not port that structure.** Port the visual
output and the behavior. Idiomatic React is the target.

---

## Product in one paragraph

Photon Clinic V2 is a single-screen clinician workspace for a dermatology visit with a
Spanish-speaking patient (Maria Gonzalez, suspected eczema flare). The clinician writes an English
visit note; OpenAI turns it into patient-friendly Spanish instructions; the app syncs patient,
treatment, allergy and medication-history data to the Photon (Neutron) backend Clinical API; the
clinician reviews the AI output and completes a **"Prepared for Photon" handoff**. The app
deliberately stops before prescribing — prescribing happens in Photon, outside this MVP. There is no
"Prescription created" state, no Photon Elements, no embedded prescribe UI, no print view.

---

## Target stack (already in the repo)

- `vinext` (Next-style App Router running on Vite) + React 19 server components
- Tailwind CSS v4 (`@import "tailwindcss"` in `app/globals.css`, `@tailwindcss/postcss`)
- TypeScript strict
- Cloudflare Workers (`wrangler`), D1 available but **not used in V2**
- Dev: `npm run dev` · Build: `npm run build` · Preview: `npm run preview`

Current `app/page.tsx` is the untouched vinext starter template. `T-01` replaces it.

---

## Build order

| # | Ticket | Phase | Depends on |
|---|---|---|---|
| — | `T-00-design-reference.md` | Shared appendix — read first, build nothing | — |
| 01 | `T-01-foundation-tokens-and-shell.md` | Foundation | — |
| 02 | `T-02-primitives.md` | Foundation | T-01 |
| 03 | `T-03-workflow-state-machine.md` | Logic | T-01 |
| 04 | `T-04-app-header.md` | Chrome | T-02, T-03 |
| 05 | `T-05-patient-context-card.md` | Left column | T-02 |
| 06 | `T-06-clinician-note-composer.md` | Left column | T-02, T-03 |
| 07 | `T-07-spanish-instructions-panel.md` | Left column | T-02, T-03 |
| 08 | `T-08-medication-prep-panel.md` | Left column | T-02, T-03 |
| 09 | `T-09-safety-review-checklist.md` | Left column | T-02, T-03 |
| 10 | `T-10-clinician-review-card.md` | Left column | T-02, T-03 |
| 11 | `T-11-patient-followup-thread.md` | Left column | T-02, T-03 |
| 12 | `T-12-photon-connection-and-milestones.md` | Right column | T-02, T-03 |
| 13 | `T-13-handoff-card.md` | Right column | T-02, T-03 |
| 14 | `T-14-evidence-log.md` | Right column | T-02, T-03 |
| 15 | `T-15-error-states.md` | Cross-cutting | T-02, T-03 |
| 16 | `T-16-action-bar-and-toast.md` | Chrome | T-02, T-03 |
| 17 | `T-17-prototype-state-switcher.md` | Dev chrome | T-03 |
| 18 | `T-18-assembly-and-visual-qa.md` | Integration | all above |
| 19 | `T-19-server-action-seams.md` | Next phase (not required for pixel parity) | T-18 |

`T-05` … `T-14` are **mutually independent** once `T-01`–`T-03` land. They can run in parallel in
separate agent sessions. Every one of them ends with a component that renders standalone.

**`T-01` … `T-19` are implemented.** The app in `app/visit/` is the V2 design, live.

---

## V2.1 build order — patient form + treatment search

A second handoff (`Desktop mockups needed-handoff-patient-treatment.zip`) added
**`Photon Clinic V2.1.dc.html`**. It adds an editable patient record and a Photon catalog search —
and to make room for them, it **replaces the `Phase` enum with four independent state facets**,
moves two cards between columns, and deletes two others. It is a restructure, not an addition.

| # | Ticket | Phase | Depends on |
|---|---|---|---|
| — | `T-21-v2.1-design-reference.md` | Shared appendix — read after `T-00`, build nothing | — |
| 22 | `T-22-state-model-refactor.md` | Foundation — **no visual change** | shipped T-01…T-19 |
| 23 | `T-23-patient-panel-and-edit-form.md` | Left column — **core ask** | T-22 |
| 24 | `T-24-treatment-search.md` | Left column — **core ask** | T-22 |
| 25 | `T-25-medication-prep-editable.md` | Left column | T-22, T-24 |
| 26 | `T-26-readiness-strip-action-bar-and-scenarios.md` | Chrome | T-22 |
| 27 | `T-27-instruction-context-live-log-and-right-column.md` | Cross-cutting | T-22, T-24, T-25 |
| 28 | `T-28-v2.1-assembly-and-qa.md` | Integration | T-22 … T-27 |

`T-22` blocks everything — the patient form and treatment search cannot be built on the `Phase`
enum, because V2.1 needs `patientSync: "pending"` while `ai: "ready"`, which one enum cannot express.
Once it lands, `T-23`/`T-24`/`T-26` are mutually independent.

**Read order for a V2.1 agent:** `T-00` → `T-21` → its own ticket.

### Where `T-20` fits

| # | Ticket | Phase | Depends on |
|---|---|---|---|
| 20 | `T-20-photon-treatment-search-and-patient-form.md` | Live Photon routes | T-19 |

`T-20` was written **before** the V2.1 mockup existed. Its API-layer work — the
`GET /api/photon/treatments` route, `PhotonPatientInput`, deterministic `externalId`,
search-before-create, idempotent re-sync, route tests — is still correct and complementary.

**Its UI sections are superseded** by `T-23`, `T-24`, and `T-25`, which carry the actual design.
Where `T-20` says "add a compact treatment search control", build what `T-24` specifies.

Recommended sequence for **PDF parity**: ship `T-22` → `T-23` → `T-24` → `T-25` on fixtures first
(fast, demo-visible), then wire `T-20`'s live routes underneath. `T-28 §6` maps the four seams.

### Functionality-first path

If the goal is to make the interview demo more interactive without taking on the full V2.1
restructure, prefer these smaller tickets instead:

| # | Ticket | Phase | Depends on |
|---|---|---|---|
| 29 | `T-29-lite-treatment-search.md` | Lite Photon catalog search | T-19 |
| 30 | `T-30-lite-patient-form-and-dynamic-sync.md` | Lite patient edit/create sync | T-29 |
| 32 | `T-32-lite-blank-slate-visit.md` | Lite blank-slate visit flow | T-30 |
| 31 | `T-31-lite-interaction-polish.md` | Lite non-linear workflow polish | T-29, T-30, optional T-32 |
| 33 | `T-33-deploy-and-live-api-smoke.md` | Deploy + opt-in live API smoke tests | T-32 |

This path intentionally keeps the existing V2 layout and `Phase` model unless implementation proves
that impossible. It adds treatment search, dynamic patient sync, optional blank-slate visit entry,
and clearer independent actions without deleting cards, moving columns, rewriting the prototype
switcher, or implementing the full five-scenario V2.1 matrix.

---

## Conventions every ticket inherits

1. **File layout** — components live in `app/visit/components/`, state in `app/visit/`, per
   `T-00 §9`. Never invent a different tree.
2. **Styling** — Tailwind v4 utilities using the `@theme` tokens defined in `T-01`. The design uses
   half-pixel type sizes (`12.5px`, `13.5px`) and odd radii (`9px`, `7px`); use Tailwind arbitrary
   values (`text-[12.5px]`, `rounded-[9px]`) rather than rounding to the nearest Tailwind step.
   **Rounding these values is a bug** — the design is dense on purpose.
3. **No raw hex in component files.** Every color comes from a token in `T-01`. If a color you need
   is missing from the token set, add it to `@theme` in the same PR and note it in the ticket's
   debrief.
4. **Server components by default.** Add `'use client'` only to components that own state,
   handlers, or effects. Pure presentational cards stay server components where possible; in
   practice most left/right-column cards receive handlers and so are client components — that is
   fine, but do not blanket-add the directive.
5. **No `any`, no `@ts-expect-error`.** Props are explicitly typed.
6. **Copy is verbatim.** English and Spanish strings, punctuation (`·`, `—`, `«»`, `…`, `¿`), and
   accents are part of the design. Copy/paste them; do not retype or "fix" them.
7. **All demo content lives in `app/visit/demoData.ts`.** Components take it as props. This is what
   makes `T-19` (real OpenAI/Photon) a swap rather than a rewrite.
8. **Definition of done for every ticket:** `npm run build` passes, the component renders at 1360×900
   without layout shift, and the ticket's own acceptance checklist is green.

---

## What is intentionally NOT in these tickets

- Prescription creation, "Prescription created" state, fake active prescription IDs
- Photon Elements / embedded prescribe UI
- Print overlay or print CSS
- D1 persistence, reload hydration
- The 5-step workflow rail from the V1 mockups
- Marketing hero / landing page
- Voice input, extra languages (future roadmap in the design PRD)

If a ticket seems to ask for any of the above, it is a mistake in the ticket — stop and flag it.

---

## Two design decisions the mockup leaves open

Both are resolved here so no agent has to guess:

1. **Boot phase.** The mockup's `state.phase` is `'final'` with all four safety checks pre-ticked,
   because it was authored to screenshot the happy path. **The real app boots to `'idle'` with all
   checks `false`** — same as what `reset()` produces. See `T-03 §4`.
2. **The patient follow-up thread.** `V2-PRD.md` lists a patient chat pane under "Defer", but the
   final mockup includes one and it is the only place the bilingual story is visible. **It ships**
   (`T-11`), but it is the lowest-priority ticket — cut it first if time runs out. Its translation
   helpers are keyword heuristics in the mockup; `T-19` replaces them with a real call.
