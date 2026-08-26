# T-30 — Lite patient form + dynamic Photon sync

**Phase:** Functionality-first V2.1 · **Depends on:** T-29 · **Blocks:** T-31
**Read first:** `T-00-design-reference.md`, `T-19-server-action-seams.md`, `T-29-lite-treatment-search.md`

---

## Context

After T-29, the user can choose a treatment. The next scripted part is the patient: T-19 still syncs
one hardcoded Maria Gonzalez record. This ticket adds a small patient edit/create path while keeping
the current V2 structure.

This is not a full patient database, not org-wide patient search, and not a replacement for Photon.
It is a demo control that proves the app can send dynamic patient data through the live Photon sync
path.

---

## Goal

Allow the clinician to edit or create the visit patient and sync that patient to Photon using the
existing server-side Photon route.

Maria Gonzalez remains the default patient so the demo starts populated.

---

## Files You Touch

- `lib/photon.ts`
- `lib/types.ts`
- `app/api/photon/sync/route.ts`
- `app/api/integration-routes.test.ts`
- `app/visit/useVisitWorkflow.ts`
- `app/visit/demoData.ts`
- `app/visit/components/PatientContextCard.tsx`
- optional new component: `app/visit/components/PatientEditForm.tsx`

Do **not** delete `PatientContextCard`. Do **not** move safety/review cards. Do **not** replace the
`Phase` enum in this ticket.

---

## Patient Input

Add a shared patient input type:

```ts
type PhotonPatientInput = {
  externalId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: "FEMALE" | "MALE" | "UNKNOWN";
  phone?: string;
};
```

UI state can keep friendlier labels (`Female`, `Male`, `Other`) if desired, but map to this shape at
the route boundary.

---

## API

Update:

```ts
POST /api/photon/sync
```

to accept an optional body:

```ts
type PhotonSyncRequest = {
  patient?: PhotonPatientInput;
  treatment?: {
    id: string;
    name: string;
  };
};
```

Behavior:

- If body is omitted, keep the existing Maria/hydrocortisone behavior.
- Validate body with Zod when present.
- Generate a stable `externalId` when one is not supplied:
  - deterministic from first name + last name + DOB
  - prefixed to avoid colliding with real EHR IDs, e.g. `phoclinic2-demo-{slug}`
- Search existing Photon patients by `externalId`.
- Update when found; create when not found.
- Preserve T-19 idempotency for duplicate allergy/history responses.
- Return normalized patient data and Photon patient ID.

Do not add a separate persistence layer. The selected patient lives in client state for the demo.

---

## UI

Keep the existing patient card position. Add an edit mode or compact inline form.

Fields:

- first name
- last name
- date of birth
- sex
- phone
- optional external ID

Minimum behavior:

- `Edit patient` opens the form.
- `Save patient` commits local state only.
- Saving local edits marks the patient as needing Photon sync.
- `Sync Photon` writes the current patient to Photon.
- After sync, show returned Photon patient ID.

Required copy:

- `Edit patient`
- `Save patient`
- `Cancel`
- `Local edits not yet synced`
- `Synced to Photon`
- `Updated in Photon`

If the current UI does not have a separate `Sync Photon` affordance yet, use the existing Photon
sync button/action. Do not add a large wizard.

---

## Workflow

Dynamic patient data should flow into:

- patient context card
- `POST /api/photon/sync`
- `POST /api/instructions` patient context
- sync milestones
- handoff summary
- evidence log, if current log state supports it

When patient changes:

- clear `finalized`
- mark patient as dirty or unsynced
- do not clear generated instructions unless implementation already has a clean way to show
  stale context

T-31 can polish stale/dirty indicators. This ticket's main job is correct data flow and live sync.

---

## Acceptance Criteria

- [ ] User can edit patient demographics from the existing patient area.
- [ ] Saving patient edits updates local patient context.
- [ ] Photon sync uses the edited patient instead of hardcoded Maria-only data.
- [ ] Missing `externalId` produces a stable demo external ID.
- [ ] Re-syncing the same patient updates instead of duplicating.
- [ ] Existing no-body sync route still works for the default demo path.
- [ ] Selected treatment from T-29 still syncs correctly.
- [ ] Invalid patient input returns `400`.
- [ ] Duplicate allergy/history responses remain idempotent.
- [ ] No persistent database added.
- [ ] No `Phase` enum refactor.
- [ ] Route tests cover default sync, dynamic patient sync, invalid patient input, and existing
      patient update.
- [ ] `npm run test`, `npx tsc --noEmit`, and `npm run build` pass.

## Out Of Scope

- full patient search across Photon
- patient list/table
- multi-visit history
- auth/login
- D1 or local persistence
- deleting patients
- insurance/pharmacy fields
- Photon Elements
- prescription creation
