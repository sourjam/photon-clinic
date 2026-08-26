# T-32 - Lite blank-slate visit flow

**Phase:** Functionality-first V2.1 · **Depends on:** T-30 · **Blocks:** T-31 polish, if not already shipped
**Read first:** `T-00-design-reference.md`, `T-29-lite-treatment-search.md`, `T-30-lite-patient-form-and-dynamic-sync.md`

---

## Context

T-30 adds patient edit/create, but the surrounding visit context still starts from the Maria Gonzalez
demo. That makes `New patient` feel incomplete: demographics can be blanked, but the header, visit
reason, allergy context, medication history context, note, treatment, generated instructions, and
handoff state still reflect the original eczema visit.

This ticket adds a true blank-slate visit path without taking on the full V2.1 state-facet refactor.
It should make the demo feel usable for a second patient while staying intentionally shallow.

---

## Goal

Allow the clinician to start a blank visit, enter the minimum visit context, select a treatment,
sync the patient to Photon, and generate Spanish instructions from the new context.

Maria Gonzalez remains the default boot state. Blank-slate mode is entered only through an explicit
control.

---

## Files You Touch

- `app/visit/types.ts`
- `app/visit/demoData.ts`
- `app/visit/useVisitWorkflow.ts`
- `app/visit/VisitWorkspace.tsx`
- `app/visit/components/AppHeader.tsx`
- `app/visit/components/PatientContextCard.tsx`
- `app/visit/components/ClinicianNoteCard.tsx`
- `app/visit/components/HandoffCard.tsx`
- `app/visit/components/SyncMilestonesCard.tsx`
- tests as appropriate

Do not add persistence. Do not add patient search. Do not replace the `Phase` enum in this ticket.

---

## Behavior

Add a `Start blank visit` or `Blank visit` action near the patient/visit context controls.

When clicked, the app should reset the visit to a blank editable working state:

- patient demographics blank
- patient Photon ID blank
- patient sync state reset
- treatment selection cleared
- treatment search query/results reset to a neutral state
- clinician note blank
- generated instructions cleared
- review/finalized state cleared
- safety checks cleared
- handoff state cleared
- patient follow-up thread cleared
- evidence log records that a blank visit was started

The user should then be able to fill enough fields to continue the normal flow.

---

## Visit Context

Promote the current fixture-only visit fields into state-backed fields:

```ts
type VisitContext = {
  language: "Spanish";
  specialty: string;
  visitReason: string;
  allergies: string;
  currentMeds: string;
  raisedInVisit: string;
};
```

Minimum editable fields:

- visit reason
- allergies
- current medications
- raised in visit

The header and patient context card should read from state, not directly from the Maria fixture.

Keep language fixed to Spanish for this MVP. Do not add a language selector.

---

## Data Flow

The blank-slate visit context should flow into:

- app header subtitle
- patient context card
- clinician note composer
- `POST /api/instructions`
- `POST /api/photon/sync`, if allergy/history fixture calls currently use visit context
- handoff summary
- evidence log labels where relevant

If Photon allergy/history sync cannot support arbitrary allergy/current-med values without more API
work, keep those values as demo context for OpenAI/handoff and note that Photon still uses the
current idempotent sync behavior.

---

## Validation

Keep validation lightweight:

- Patient sync still requires first name, last name, date of birth, and sex.
- Instruction generation requires a non-empty clinician note.
- Finalize still requires patient sync, selected treatment, generated instructions, clinician
  review, and safety review.
- Blank visit should not accidentally reuse Maria's Photon patient ID or selected treatment ID.

Use toasts for missing required fields. Do not add a large validation framework.

---

## Acceptance Criteria

- [ ] Default page load still opens with Maria Gonzalez and the existing demo content.
- [ ] User can start a blank visit from the visible workspace UI.
- [ ] Blank visit clears patient demographics, Photon patient ID, treatment, clinician note,
      instructions, checks, handoff, thread, and stale demo state.
- [ ] Visit reason, allergies, current medications, and raised-in-visit are editable or otherwise
      fillable for the blank visit.
- [ ] Header and patient context card reflect the new patient/visit context after save.
- [ ] `Generate Spanish instructions` uses the new note, patient, selected treatment, and visit
      context.
- [ ] `Sync patient` does not reuse Maria's Photon patient ID for a blank-slate patient.
- [ ] Handoff cannot finalize until the blank visit has completed the required sync/review steps.
- [ ] Existing T-29 treatment search still works after starting a blank visit.
- [ ] Existing T-30 patient edit/sync still works on the default Maria visit.
- [ ] Tests cover default visit preservation, blank visit reset, required-field gating, and
      instruction payload context.
- [ ] `npm run test`, `npx tsc --noEmit`, and `npm run build` pass.

## Out Of Scope

- patient database or saved patient list
- Photon patient search
- multi-visit history
- editable language selection
- full V2.1 state-facet refactor
- five-scenario matrix
- Photon Elements
- prescription creation
- prescribing from this app
