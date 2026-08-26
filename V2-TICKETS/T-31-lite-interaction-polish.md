# T-31 — Lite interaction polish for non-linear demo flow

**Phase:** Functionality-first V2.1 · **Depends on:** T-29, T-30 · **Blocks:** nothing
**Read first:** `T-00-design-reference.md`, `T-29-lite-treatment-search.md`, `T-30-lite-patient-form-and-dynamic-sync.md`

---

## Context

T-29 and T-30 add the actual demo functionality: selectable Photon treatments and dynamic Photon
patients. This ticket makes those new capabilities feel intentional without taking on the full
V2.1 PDF-parity refactor.

The design goal is simple: the app should no longer feel like there is only one meaningful button.
It should feel like a compact visit assistant where patient, treatment, AI instructions, Photon
sync, translation, and handoff can be used in a practical order.

---

## Goal

Polish the existing V2 UI so the new patient/treatment interactions are visible, understandable,
and safe enough for the interview demo.

This ticket should be small. Avoid the full T-22 state-facet refactor unless the code has already
naturally moved there during T-29/T-30.

---

## Files You Touch

- `app/visit/VisitWorkspace.tsx`
- `app/visit/useVisitWorkflow.ts`
- `app/visit/demoData.ts`
- `app/visit/components/ActionBar.tsx`
- `app/visit/components/AppHeader.tsx`
- `app/visit/components/SyncMilestonesCard.tsx`
- `app/visit/components/EvidenceLogCard.tsx`
- `app/visit/components/HandoffCard.tsx`
- `app/visit/components/SpanishInstructionsCard.tsx`
- tests as appropriate

Do not delete or move major cards unless already required by earlier lite tickets.

---

## Polish Areas

### 1. Primary Actions

Make the main actions visible and independently usable:

- `Generate instructions`
- `Sync Photon`
- `Translate`
- `Finalize handoff`

The exact placement can stay close to the current action bar. The important change is that
`Sync Photon` and `Translate` should not feel hidden behind the generate flow.

Dimmed buttons may remain clickable and toast their reason, matching the existing button behavior.

### 2. Dirty / Stale Indicators

Add lightweight indicators for mismatched state:

- Patient edited locally but not synced:
  - `Local edits not yet synced`
- Treatment changed after instructions were generated:
  - `Treatment changed · regenerate instructions before handoff`
- Photon sync completed for selected patient/treatment:
  - `Synced to Photon`

Keep this minimal. A badge, footer note, or toast is enough. Do not build the full V2.1 readiness
strip unless it is already cheap after T-29/T-30.

### 3. Handoff Gating

Handoff should be blocked when:

- no treatment is selected
- patient has not been synced
- instructions are missing
- instructions are stale for the selected treatment
- clinician review / safety review is incomplete

Use clear toast copy for the first missing item:

- `Select a treatment first`
- `Sync the patient to Photon first`
- `Generate the Spanish instructions first`
- `Regenerate instructions for the selected treatment`
- `Mark the AI output reviewed first`
- `Complete the safety review first`

### 4. Evidence Log

Append compact evidence entries for the new actions:

- treatment search
- treatment selected
- patient saved locally
- patient synced or updated in Photon
- instructions regenerated after treatment change

Do not redesign the log. Keep the current evidence-log component and add rows if the current state
model supports it.

### 5. Copy Boundaries

Keep the Photon boundary explicit:

- `Photon catalog lookup · no prescribing`
- `Prepared for Photon`
- `Synced to Photon`
- `Prescribe scope: not requested`
- `no prescription was created by this app`

Avoid:

- `Prescription created`
- `Rx sent`
- `Order placed`
- `Prescribe medication`
- `Send prescription`

---

## Acceptance Criteria

- [ ] User sees at least three meaningful demo actions without following a strict wizard:
      treatment search/select, patient edit/sync, generate instructions.
- [ ] Action bar or equivalent controls expose `Generate instructions`, `Sync Photon`, `Translate`,
      and `Finalize handoff`.
- [ ] Patient dirty state is visible after local edits and clears after successful Photon sync.
- [ ] Treatment changes after generation are visible and block handoff until regeneration.
- [ ] Handoff gating returns specific, actionable toast messages.
- [ ] Evidence log includes treatment search/select and patient sync/update events.
- [ ] Existing OpenAI translation remains available.
- [ ] Existing live Photon sync remains idempotent.
- [ ] No full V2.1 scenario switcher rewrite.
- [ ] No major layout restructure unless required by the prior two tickets.
- [ ] No prescribe endpoint is called and no prescribe scope is requested.
- [ ] `npm run test`, `npx tsc --noEmit`, and `npm run build` pass.

## Out Of Scope

- full readiness strip from the V2.1 PDF
- five-scenario consistency matrix
- moving safety/review cards to the right column
- deleting existing cards for pixel parity
- editable medication prep nesting
- full state-facet refactor
- Photon Elements
- prescription creation
