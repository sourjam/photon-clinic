# T-22 — Refactor the visit state model: `Phase` enum → independent facets

**Phase:** V2.1 foundation · **Depends on:** shipped T-01…T-19 · **Blocks:** T-23 … T-28
**Read first:** `T-00-design-reference.md`, then `T-21-v2.1-design-reference.md`

---

## Context

V2 modelled the whole workspace with one enum:

```ts
type Phase = "idle" | "loading" | "review" | "final" | "aiError" | "apiError";
```

That held together because V2 fired the OpenAI call and the Photon sync **together**, from one
button, against one hardcoded patient and one hardcoded treatment. V2.1 breaks all three
assumptions: the clinician syncs the patient independently, searches and selects treatments
independently, and generates instructions independently — "work in any order" is now the left
column's own subtitle.

`patientSync: "pending"` while `ai: "ready"` is a legal V2.1 state. The `Phase` enum cannot express
it. This ticket replaces the enum before any V2.1 UI is built on top of it.

**No visual change ships in this ticket.** The screen must look and behave exactly as it does today
when you are done. That is the acceptance bar — this is a pure refactor, and keeping it pure is what
makes the next five tickets safe.

---

## Files you touch

| File | Action |
|---|---|
| `app/visit/types.ts` | replace `Phase`, extend `VisitState` |
| `app/visit/useVisitWorkflow.ts` | rewrite `getDerived`, `getPhasePreset`, actions |
| `app/visit/demoData.ts` | `INITIAL_STATE`, retire `buildMilestones`/`buildLog` signatures |
| `app/visit/VisitWorkspace.tsx` | update the derivations it computes inline |
| `app/visit/components/PrototypeSwitcher.tsx` | temporary shim (see §7) |

---

## 1. `types.ts`

Delete `Phase`. Add:

```ts
export type AiStatus = "idle" | "loading" | "ready" | "error";
export type PatientSyncStatus = "none" | "pending" | "synced" | "updated";
export type TreatmentLookupStatus = "none" | "ok" | "error";
export type HistorySyncStatus = "none" | "ok";

export type PatientSex = "Female" | "Male" | "Other";

export type PatientRecord = {
  first: string;
  last: string;
  /** YYYY-MM-DD */
  dob: string;
  sex: PatientSex;
  phone: string;
  /** External/EHR id. Empty string renders as "none". */
  ext: string;
};

export type CatalogEntry = {
  id: string;
  name: string;
  /** "Topical cream · 30 g" */
  form: string;
  /** Search key, e.g. "hydrocortisone" */
  term: string;
};

export type MedicationPrep = {
  directions: string;
  quantity: string;
  duration: string;
  refills: string;
  pharmNote: string;
};
```

`refills` stays a **string**, for the reason `T-08` gives: `{refills && …}` on a numeric `0` renders
nothing. It is also now a text input, so a string is the honest type.

`sex` is the display string, not an enum wire value. `T-20`'s `PhotonPatientInput.sex` is
`"FEMALE" | "MALE" | "UNKNOWN"` — map at the API boundary, not in UI state.

### `VisitState`

```ts
export type VisitState = {
  // --- facets (replace `phase`) ---
  ai: AiStatus;
  patientSync: PatientSyncStatus;
  txLookup: TreatmentLookupStatus;
  historySync: HistorySyncStatus;

  // --- patient ---
  patient: PatientRecord;
  draftPatient: PatientRecord;
  patientEditing: boolean;
  patientDirty: boolean;
  patientId: string;          // "" until synced

  // --- catalog ---
  query: string;
  results: CatalogEntry[];
  searched: boolean;
  selectedId: string | null;

  // --- medication prep ---
  prep: MedicationPrep;

  // --- AI ---
  note: string;
  aiForId: string | null;
  instructionsHeading: string;
  instructions: InstructionBlock[];
  instructionsPlainText: string;

  // --- review / handoff ---
  reviewed: boolean;
  finalized: boolean;
  checks: SafetyChecks;

  // --- evidence ---
  clock: number;              // minutes since midnight
  logEntries: LogEntry[];

  // --- thread ---
  thread: ThreadMessage[];
  patientDraft: string;
  clinicianReply: string;

  // --- misc ---
  integrationMode: IntegrationMode;
  toast: string;
};
```

Removed: `phase`, `treatmentId` (now derived from `selectedId`), `milestones` (now derived — `T-27`).

Keep `integrationMode` — the fixture-mode header indicator from `T-19` still works and is still
wanted.

---

## 2. `INITIAL_STATE`

V2.1's default scenario is **populated**, not empty. It boots mid-visit with a synced patient, a
selected treatment, and generated instructions — one click from finalizing. This is the opposite of
the `T-03 §3` decision, and it is deliberate: the interviewer should land on a working screen, and
the `Fresh visit` scenario (`T-26`) is one click away for the empty case.

```ts
export const INITIAL_STATE: VisitState = {
  ai: "ready",
  patientSync: "synced",
  txLookup: "ok",
  historySync: "ok",

  patient: { ...DEFAULT_PATIENT },
  draftPatient: { ...DEFAULT_PATIENT },
  patientEditing: false,
  patientDirty: false,
  patientId: "pat_01HQ7K4M2Z",

  query: "hydrocortisone",
  results: CATALOG.filter((c) => c.term === "hydrocortisone"),
  searched: true,
  selectedId: "med_8f21c94a",

  prep: {
    directions: "Apply thin layer to affected areas twice daily",
    quantity: "30 g tube",
    duration: "7 days",
    refills: "0",
    pharmNote: "Patient is breastfeeding; clinician reviewed counseling.",
  },

  note: CLINICIAN_NOTE,          // the V2.1 string — see T-21 §7
  aiForId: "med_8f21c94a",
  instructionsHeading: "",       // derived at render (T-27 §2); keep "" here
  instructions: [],
  instructionsPlainText: "",

  reviewed: false,
  finalized: false,
  checks: { allergy: true, interaction: true, dose: true, lactation: false },

  clock: 10 * 60 + 39,           // 10:39
  logEntries: [ /* 7 seed rows — T-27 §5 */ ],

  thread: [],
  patientDraft: "",
  clinicianReply: "",

  integrationMode: "fixture",
  toast: "",
};
```

Note `lactation: false` while the other three are `true`. The demo boots one checkbox and one
sign-off away from a finalizable handoff — so the interviewer's first click produces a visible,
meaningful result rather than a toast listing four missing things.

`directions` **drops** `for 7 days` compared to V2 — duration is now its own field (`T-25`).

---

## 3. `getDerived`

```ts
function getDerived(state: VisitState) {
  const sel = CATALOG.find((c) => c.id === state.selectedId) ?? null;

  const isIdle          = state.ai === "idle";
  const isLoading       = state.ai === "loading";
  const isAiError       = state.ai === "error";
  const hasInstructions = state.ai === "ready";
  const isApiError      = state.txLookup === "error";

  const patientSynced = state.patientSync === "synced" || state.patientSync === "updated";

  /** Loose: a treatment is picked. Drives the Change button and medication-prep visibility. */
  const hasSelectionLoose = sel !== null;
  /** Strict: picked AND the lookup is healthy. Drives readiness and canFinalize. */
  const hasSelectionStrict = sel !== null && state.txLookup !== "error";

  const doseMissing = !/twice|once|daily|hours|week|day/i.test(state.note);
  const staleForTx  = hasInstructions && sel !== null
                   && state.aiForId !== null && state.aiForId !== sel.id;

  const strength = sel ? (sel.name.match(/[\d.]+\s?(%|mg)/)?.[0] ?? "") : "";

  const syncedCount = SYNCED_KEYS.filter((k) => state.checks[k]).length;   // 0..3
  const allChecked  = syncedCount === 3 && state.checks.lactation;

  const readyItems = [
    { label: "Patient synced",         ok: patientSynced },
    { label: "Treatment selected",     ok: hasSelectionStrict },
    { label: "Instructions generated", ok: hasInstructions },
    { label: "Clinician reviewed",     ok: state.reviewed },
  ];
  const readyCount = readyItems.filter((r) => r.ok).length;

  const canReview   = hasInstructions;
  const canFinalize = hasInstructions && state.reviewed && allChecked
                   && patientSynced && hasSelectionStrict && !staleForTx;

  return { sel, isIdle, isLoading, isAiError, isApiError, hasInstructions,
           patientSynced, hasSelectionLoose, hasSelectionStrict,
           doseMissing, staleForTx, strength,
           syncedCount, allChecked, readyItems, readyCount,
           canReview, canFinalize };
}
```

Three things to get right:

1. **`hasSelectionLoose` vs `hasSelectionStrict`** — `T-21 §4` explains why both exist. Returning
   one value named `hasSelection` will produce a subtly wrong screen at `txLookup === "error"`.
2. **`hasInstructions` no longer includes an error state.** The V2 quirk where `apiError` implied
   `hasInstructions` (`T-03 §5`) is gone — the facets say it directly now. Delete any comment or
   test asserting the old behavior.
3. **`connOk` is retired.** The connection badge is now unconditionally `Authenticated` (`T-27 §6`).

`strength` is parsed out of the treatment name (`"Hydrocortisone cream 2.5%"` → `"2.5%"`) and feeds
the Spanish instructions, the `dose` safety-check meta, and the handoff manifest. Compute it once
here rather than three times at the call sites.

---

## 4. Actions: what changes

Existing actions keep their names and their external behavior wherever possible. The rewrites:

| Action | Change |
|---|---|
| `setPhase` | **delete.** Replaced by `applyScenario` (`T-26 §3`). |
| `generate` / `regenerate` | Add two guards (`T-27 §1`); set `aiForId` on success; 1300ms. |
| `retryApi` | Now sets `txLookup: "ok"` and repopulates results — not a phase jump (`T-24 §6`). |
| `manualEntry` | Sets `ai: "ready"`, `aiForId: sel?.id ?? null`, `reviewed: false`. |
| `toggleReviewed` | Drops the `phase: "review"` forcing. Just `reviewed: !reviewed, finalized: false`. |
| `finalize` | 7-branch blocked-reason ladder (§5). |
| `reset` | `applyScenario("default")`, **not** `INITIAL_STATE`. |
| `toggleCheck` | Also sets `finalized: false`. |
| `showToast` | 2200ms → **2300ms**. |

New actions, each specified in its own ticket:

`togglePatientEdit`, `savePatient`, `cancelPatient`, `setDraftPatientField`, `setPatientSex`
(`T-23`) · `setQuery`, `runSearch`, `pickQuickTerm`, `selectTreatment`, `clearSelection` (`T-24`) ·
`setPrepField` (`T-25`) · `syncPhoton` (`T-23 §6`) · `translateAction`, `applyScenario` (`T-26`).

### `finalize` blocked-reason ladder

Evaluate in this order, toast the **first** match, change no state:

```
isApiError          → "Resolve the treatment lookup first"
!hasSelectionStrict → "Select a treatment first"
!patientSynced      → "Sync the patient to Photon first"
!hasInstructions    → "Generate the Spanish instructions first"
staleForTx          → "Regenerate instructions for the new treatment"
!reviewed           → "Mark the AI output reviewed first"
otherwise           → "Complete the safety review first"
```

Seven branches, up from four. The order is the mockup's and it is not arbitrary: it walks the
clinician backwards through the dependency chain, so the first thing they are told to fix is the
thing everything else waits on.

On success: `finalized: true`, append a log row `200 · Handoff prepared · no Rx written`, toast
`Handoff prepared — continue in Photon`.

Note the log message capitalizes `Handoff` in V2.1 (V2 used lowercase `handoff prepared`).

### The `finalized: false` invalidation set

These actions all reset `finalized` to `false`, because each one changes something the handoff
manifest asserts:

`savePatient` · `selectTreatment` · `clearSelection` · `toggleCheck` · `toggleReviewed` ·
`generate` · `setPrepField` for **directions, quantity, duration, refills**

`setPrepField("pharmNote")` does **not**. That is the mockup's behavior and it is defensible — the
pharmacist note is not in the handoff manifest — but it is inconsistent enough to be worth a code
comment so nobody "fixes" it later.

---

## 5. `clock` and `addLog`

Log timestamps advance a fake clock instead of reading `Date.now()`, so the transcript stays
consistent with the seeded `10:38–10:39` rows:

```ts
function tick(clock: number): { clock: number; stamp: string } {
  const c = clock + 1;
  const h = Math.floor(c / 60);
  const m = c % 60;
  return { clock: c, stamp: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
}
```

`addLog(code, msg)` ticks the clock and appends `{ t: stamp, code, msg }`.

Ticked rows are `HH:MM` (5 chars) while seed rows are `HH:MM:SS` (8 chars), so the log column is
slightly ragged. Same call as `T-14 §4` — leave it; padding to a fake `:00` invents precision.

This also **replaces** the thread-message log rows that `VisitWorkspace` used to concatenate at
render time (`T-14 §4`). Thread sends now call `addLog` directly (`T-27 §5`). Delete the render-time
concat when you do it, or every message will be logged twice.

---

## 6. `LogEntry.isError` is retired

V2.1 derives the code color from the code itself:

```ts
const isError = /^[45]/.test(entry.code);
```

Keep the `isError?: boolean` field in the type for now so `T-19`'s live routes keep compiling, but
have `EvidenceLogCard` prefer the regex. One source of truth, and it cannot disagree with the code
it is rendering next to.

---

## 7. Keeping the build green mid-refactor

`PrototypeSwitcher` currently takes `phase: Phase` and `onPick: (p: Phase) => void`. `T-26` rewrites
it around scenarios. To land this ticket without a broken build, ship a temporary shim: map the five
scenario keys onto the facet presets and keep the existing six-button UI rendering whatever it can.
Mark it `// TODO(T-26): replace with scenario switcher` and delete it there.

Do not leave the shim un-annotated. A phase-shaped switcher sitting on a facet-shaped model is
exactly the kind of thing that survives three sprints.

---

## Acceptance criteria

- [ ] `npx tsc --noEmit` clean; `npm run build` passes; `npm run test` passes.
- [ ] `grep -rn '"idle" | "loading" | "review"' app lib` returns nothing — the `Phase` type is gone.
- [ ] **The rendered screen is visually identical to before this ticket** at 1440×940, in every one
      of the six states the old switcher could reach. Screenshot-diff it if you can.
- [ ] `hasSelectionLoose` and `hasSelectionStrict` both exist and differ only when
      `txLookup === "error"`.
- [ ] Setting `ai: "ready"` and `patientSync: "pending"` simultaneously produces a coherent screen —
      the state the old enum could not represent.
- [ ] `finalize()` toasts each of the 7 ladder branches; verify by constructing each state.
- [ ] `toggleCheck` and `savePatient` both clear `finalized`.
- [ ] `setPrepField("pharmNote")` does **not** clear `finalized`, and carries the comment.
- [ ] Two `addLog` calls advance the clock by two minutes and render as `HH:MM`.
- [ ] Thread messages appear exactly once in the evidence log.
- [ ] No `any`, no `@ts-expect-error`, no hex literal in any `.tsx`.

## Out of scope

Every V2.1 visual change. If the screen looks different when you are done, you have done too much.
