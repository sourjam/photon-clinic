# T-29 — Lite Photon treatment search

**Phase:** Functionality-first V2.1 · **Depends on:** T-19 · **Blocks:** T-30, T-31
**Read first:** `T-00-design-reference.md`, `T-19-server-action-seams.md`, then `T-20-photon-treatment-search-and-patient-form.md`

---

## Context

The full V2.1 ticket set (`T-21`…`T-28`) implements the new PDF closely, but it requires a broad
state-model refactor before the patient form or treatment search can ship. For the interview MVP,
that is more risk than the feature needs.

This ticket takes the smaller path: keep the current V2 layout and workflow mostly intact, but add
a real Photon treatment catalog search so the demo is no longer locked to one hardcoded medicine.

No prescription is created. No Photon Elements. No prescribe scope.

---

## Goal

Allow the clinician to search Photon's treatment catalog, select a treatment result, and use that
selected treatment in the existing instruction-generation and Photon-sync flow.

The app may still boot with the Maria / hydrocortisone scenario populated. The change is that the
clinician can choose a different treatment before generating or syncing.

---

## Files You Touch

- `lib/photon.ts`
- `lib/types.ts`
- `app/api/photon/treatments/route.ts` — new
- `app/api/integration-routes.test.ts`
- `app/visit/useVisitWorkflow.ts`
- `app/visit/demoData.ts`
- `app/visit/components/MedicationPrepPanel.tsx`
- optional new component: `app/visit/components/TreatmentSearchInline.tsx`

Do **not** delete `MedicationPrepPanel`. Do **not** move cards between columns. Do **not** replace
the `Phase` enum in this ticket.

---

## API

Add:

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
    form?: string;
  }>;
};
```

Behavior:

- Trim `term`.
- Reject empty or one-character terms with `400`.
- With Photon credentials, query the Photon clinical catalog.
- Without credentials, return fixture catalog results.
- Return up to 8 results.
- Never expose Photon credentials or tokens to the client.
- Reuse the catalog auth headers already proven in T-19:
  - `x-photon-auth-token`
  - `x-photon-auth-token-type: auth0`

Implementation note: T-19 currently has `searchTreatment()` returning the first matching ID. Extract
or add a sibling helper that returns a list of catalog entries without disrupting the existing sync
path.

---

## UI

Add a compact search affordance inside or directly above the existing medication prep area.

Minimum UI:

- search input
- `Search catalog` button
- quick terms: `hydrocortisone`, `triamcinolone`, `mupirocin`, `lisinopril`, `ondansetron`
- result rows with treatment name, Photon ID, optional form
- `Select` button per result
- selected-treatment display with treatment name and Photon ID

Copy:

- Card/section label: `Treatment search`
- Meta/disclaimer: `Photon catalog lookup · no prescribing`
- Selected badge: `Treatment selected`
- Empty state: `Search Photon's catalog to change the treatment for this visit.`

Avoid the words `prescribe`, `order`, or `Rx` except in the explicit disclaimer `no prescribing`.

---

## State

Add only the state needed for treatment selection:

```ts
type VisitTreatment = {
  id: string;
  name: string;
  form?: string;
};
```

Minimum workflow state additions:

- `selectedTreatment`
- `treatmentQuery`
- `treatmentResults`
- `treatmentSearchStatus: "idle" | "loading" | "ready" | "error"`

Keep the existing `Phase` model. Do not introduce the four-facet V2.1 state model here.

When a treatment is selected:

- update selected treatment state
- clear `finalized`
- append an evidence log row if the current log model supports it
- leave existing generated instructions visible, but show a small warning or toast:
  `Treatment changed · regenerate instructions before handoff`

If adding a persistent stale-instructions banner is too invasive, use a toast only in this ticket
and leave richer staleness handling to T-31.

---

## Wiring

Selected treatment should be used by:

- `POST /api/instructions` request context
- `POST /api/photon/sync` request context, if present
- medication prep display
- handoff treatment row
- evidence log / sync log where applicable

Keep hydrocortisone as the fallback selected treatment so the current demo still works with no user
input.

---

## Acceptance Criteria

- [ ] User can search Photon treatments from the UI.
- [ ] User can select a returned treatment.
- [ ] Fixture mode works without credentials.
- [ ] Live mode uses Photon catalog credentials server-side.
- [ ] Selected treatment replaces the hardcoded hydrocortisone value in instruction context and
      Photon sync context.
- [ ] Existing Maria/hydrocortisone happy path still works on first load.
- [ ] No prescription endpoint is called.
- [ ] No `Phase` enum refactor.
- [ ] No card deletion or column move.
- [ ] Route tests cover invalid search, fixture search, and live mocked search.
- [ ] `npm run test`, `npx tsc --noEmit`, and `npm run build` pass.

## Out Of Scope

- patient form
- editable medication-prep fields
- readiness strip
- scenario switcher rewrite
- full stale-instructions matrix
- Photon Elements
- prescription creation
