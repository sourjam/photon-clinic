# T-20 — Photon treatment search + patient create/select

**Phase:** V2.1 demo interactivity · **Depends on:** T-19 · **Blocks:** richer live demo flow
**Read first:** `T-00-design-reference.md`, `T-19-server-action-seams.md`, then `V2-PRD.md`

---

## Context

V2 proves the core live seams: OpenAI generates Spanish instructions, OpenAI translates patient
follow-up, and Photon syncs patient/treatment/allergy/medication-history data. The weakness after
T-19 is product feel: the app still behaves like a single scripted visit with one fixture patient
and one fixture treatment.

This ticket adds **real Photon-backed interactivity** without changing the product boundary:

- Clinician can search Photon treatments instead of using only hardcoded hydrocortisone.
- Clinician can create/select a patient instead of syncing only Maria Gonzalez.
- The selected patient + selected treatment drive instructions, Photon sync, milestones, evidence
  log, and handoff.

This is still not a prescribing flow. The app helps prepare education and sync clinical context to
Photon. It does **not** create prescriptions, call prescribe endpoints, request prescribe scope, or
embed Photon Elements.

---

## Product Shape

Do not turn the app into a large EHR. Keep the single-screen clinician workspace, but make it less
linear by exposing three independent actions:

1. **Patient**
   Create or select the Photon patient for this visit.
2. **Treatment**
   Search Photon catalog and select the treatment to prepare education for.
3. **Visit actions**
   Generate instructions, sync Photon, translate follow-up, and finalize handoff in any sensible
   order.

The goal is demo interactivity: the interviewer should be able to type a treatment search, pick a
real Photon result, create/select a patient, then run the same AI + Photon workflow with visibly
different live IDs.

---

## Files You Touch

- `lib/photon.ts`
- `lib/types.ts`
- `app/api/photon/treatments/route.ts` — new route
- `app/api/photon/patients/route.ts` — new route, if patient create/select is separate from sync
- `app/api/photon/sync/route.ts`
- `app/api/instructions/route.ts`
- `app/api/integration-routes.test.ts`
- `app/visit/useVisitWorkflow.ts`
- `app/visit/demoData.ts`
- `app/visit/components/PatientContextCard.tsx`
- `app/visit/components/MedicationPrepPanel.tsx`
- new component if needed: `app/visit/components/TreatmentSearchPanel.tsx`
- new component if needed: `app/visit/components/PatientFormPanel.tsx`

Keep component additions small. Prefer evolving `PatientContextCard` and `MedicationPrepPanel` if
that preserves the dense one-screen layout.

---

## 1. Treatment Search

Add a server route:

```ts
GET /api/photon/treatments?term={query}
```

Response:

```ts
type PhotonTreatmentSearchResponse = {
  mode: "live" | "fixture";
  results: Array<{
    id: string;
    name: string;
  }>;
};
```

Behavior:

- Trim and validate `term`.
- Reject empty or too-short terms with `400`.
- With Photon catalog credentials, call the existing catalog search path.
- Without credentials, return fixture treatment results.
- Never expose Photon tokens to the client.
- Reuse the catalog headers proven in T-19:
  - `x-photon-auth-token`
  - `x-photon-auth-token-type: auth0`
- Preserve fallback handling for catalog searches that return no exact match.

UI behavior:

- Add a compact treatment search control to the medication prep area.
- User can search by name, see 3-8 results, and select one.
- Selected treatment replaces the hardcoded hydrocortisone treatment in app state.
- Selected treatment ID is shown in the medication prep panel and evidence log.
- If no treatment is selected, the app may default to the existing hydrocortisone fixture.

Do not call this "prescription search" or "prescribe medication". Use "Treatment search" or
"Medication catalog" language.

---

## 2. Patient Create/Select

Add a patient input model:

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

Route shape can be either:

```ts
POST /api/photon/patients
```

or folded into:

```ts
POST /api/photon/sync
```

Choose the simpler implementation once you inspect the current T-19 code. The main requirement is
that patient data is no longer hardcoded to Maria Gonzalez inside `lib/photon.ts`.

Behavior:

- Validate required fields with Zod.
- Generate a stable `externalId` when one is not supplied, using a demo-safe deterministic slug from
  patient name + DOB.
- Search existing Photon patients by `externalId` before creating.
- If a patient exists, update demographics rather than creating a duplicate.
- If no patient exists, create one.
- Return the Photon patient ID and the normalized patient object.
- Keep repeated sync idempotent, including the duplicate allergy/history handling from T-19.

UI behavior:

- Add a compact patient form or editable patient panel.
- Fields: first name, last name, DOB, sex, phone.
- Submit creates/selects the patient and updates the patient context card.
- Show the returned Photon patient ID once available.
- Keep Maria Gonzalez as the default fixture so the demo starts populated.

---

## 3. Sync And Generation Wiring

Update the live routes so selected patient and treatment travel through the workflow:

```ts
type PhotonSyncRequest = {
  patient: PhotonPatientInput;
  treatment: {
    id: string;
    name: string;
  };
  allergy?: {
    term: string;
  };
  medicationHistory?: Array<{
    treatmentId: string;
    name: string;
    active: boolean;
    comment?: string;
  }>;
};
```

The exact request type can be narrower for MVP, but it must support at least:

- selected patient
- selected treatment
- existing sulfa allergy fixture
- existing prenatal vitamin fixture or selected medication-history treatment

Instruction generation should include the selected treatment name. If the clinician note does not
mention the selected treatment, the prompt must treat the selected treatment as context but still
avoid inventing dose/frequency. The safest MVP behavior is:

- If note includes dose/frequency, preserve it exactly.
- If note does not include dose/frequency, generate general usage education and ask clinician to
  confirm dose/frequency.

---

## 4. State Model

The workflow should become checklist-like rather than wizard-like.

Minimum state additions:

```ts
type VisitPatient = PhotonPatientInput & {
  photonPatientId?: string;
};

type VisitTreatment = {
  id: string;
  name: string;
};
```

Keep existing phases if replacing them is too risky. The non-linear feel can come from independent
action availability:

- Patient form can be submitted at any time.
- Treatment search can be used at any time.
- Instructions can be regenerated after treatment changes.
- Photon sync can be rerun after patient or treatment changes.
- Handoff is enabled only when required review/sync conditions are met.

Avoid a large state-machine rewrite unless the existing code makes it unavoidable.

---

## 5. Evidence Log

Append real log entries for:

- treatment search
- treatment selected
- patient create/update
- patient selected
- Photon sync rerun after patient/treatment change

Use existing `LogEntry` rendering from T-14. Do not redesign the evidence log.

---

## Acceptance Criteria

- [ ] User can search Photon treatment catalog from the UI and select a treatment result.
- [ ] Treatment search uses live Photon when credentials exist and fixture results when they do not.
- [ ] User can edit/create/select a patient from the UI.
- [ ] Patient sync uses the selected patient instead of hardcoded Maria-only data.
- [ ] Selected patient and selected treatment are reflected in the patient card, medication prep
      panel, sync milestones, evidence log, and handoff.
- [ ] Instructions generation includes the selected treatment context without inventing dose or
      frequency.
- [ ] Re-running sync for the same patient/treatment remains idempotent.
- [ ] Existing Maria/hydrocortisone fixture path still works on first load.
- [ ] No prescribe endpoint is called and no prescribe scope is requested.
- [ ] Secrets remain server-only and are absent from the client bundle.
- [ ] Route tests cover fixture mode, live treatment search, patient create/update, invalid input,
      and duplicate-record idempotency.
- [ ] `npm run test`, `npx tsc --noEmit`, and `npm run build` pass.

## Out Of Scope

- Photon Elements
- prescription creation
- order placement
- provider login/auth
- patient search across the full Photon org by arbitrary PHI
- persistent local database
- multi-visit history
- insurance, pharmacy, payment, or fulfillment workflow
- full visual redesign

## Suggested PR Split

1. `T-20A` — Photon treatment search route + tests.
2. `T-20B` — treatment search UI + selected treatment state.
3. `T-20C` — dynamic patient input model + patient create/update route tests.
4. `T-20D` — patient form UI + sync/generation wiring.
5. `T-20E` — final live validation, evidence log polish, and handoff consistency.

If time is tight, ship `T-20A` and `T-20B` first. Treatment search alone gives the largest demo
interactivity boost with the least architectural churn.
