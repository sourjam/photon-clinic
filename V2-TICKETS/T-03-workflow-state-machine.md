# T-03 — Workflow state machine, types, and demo data

**Phase:** Logic · **Depends on:** T-01 · **Blocks:** T-04 … T-18
**Read first:** `T-00-design-reference.md`

---

## Context

Every visible thing in the V2 workspace is derived from **one enum plus four pieces of state**.
The mockup computes all of it in a single `renderVals()` method that returns ~60 bindings. This
ticket rebuilds that as a typed hook, so each card ticket can consume named booleans instead of
re-deriving conditions.

Get this exactly right and the remaining fifteen tickets are mechanical. Get a derived boolean
wrong and the whole demo mislies about what happened.

---

## Files you create

```
app/visit/types.ts
app/visit/demoData.ts
app/visit/useVisitWorkflow.ts
```

---

## 1. `types.ts`

```ts
export type Phase = "idle" | "loading" | "review" | "final" | "aiError" | "apiError";

export type SafetyCheckKey = "allergy" | "interaction" | "dose" | "lactation";

export type SafetyChecks = Record<SafetyCheckKey, boolean>;

export type ThreadSpeaker = "patient" | "clinician";

export type ThreadMessage = {
  id: string;
  from: ThreadSpeaker;
  /** Spanish text — the patient's original, or the translation of a clinician reply. */
  es: string;
  /** English text — the clinician's original, or the translation of a patient question. */
  en: string;
  /** "HH:MM" — see §6. */
  time: string;
  /** Patient messages only: matched the clinical-topic heuristic. */
  flagged?: boolean;
};

export type MilestoneStatus = "pending" | "loading" | "ok" | "error";

export type Milestone = {
  label: string;
  status: MilestoneStatus;
  /** Mono detail line. Empty string = hide the line entirely. */
  id: string;
};

export type LogEntry = {
  /** "HH:MM:SS" */
  t: string;
  /** HTTP-ish status code, shown in green or red. */
  code: string;
  msg: string;
  isError?: boolean;
};

export type VisitState = {
  phase: Phase;
  note: string;
  reviewed: boolean;
  finalized: boolean;
  checks: SafetyChecks;
  thread: ThreadMessage[];
  patientDraft: string;
  clinicianReply: string;
  toast: string;
};
```

---

## 2. `demoData.ts` — fixed content

Copy these strings **exactly**, including accents, `·` (U+00B7), `—` (U+2014), `…` (U+2026),
`«»` (U+00AB/BB), `¿` and `¡`. They are product copy, not placeholders.

```ts
export const CLINICIAN_NOTE =
  "Suspected eczema flare on forearms. Discussed moisturizing, avoiding fragrance, and short course topical steroid. Patient asks if treatment is safe while breastfeeding.";

/** Plain-text version used by the clipboard action (T-16). Note it is NOT the same shape as
 *  the rendered panel: the rendered version splits into styled blocks (T-07). */
export const SPANISH_INSTRUCTIONS_PLAIN = `Crema de hidrocortisona 2.5%

Lo que vemos parece un brote de eczema en los antebrazos. La piel está irritada, pero se controla bien con cuidado diario.

Aplique una capa fina de la crema en las zonas afectadas dos veces al día, por 7 días. Luego deténgase. No la use en la cara ni cerca de los ojos.

Use jabón y crema humectante sin fragancia todos los días, incluso cuando la piel esté mejor.

Sobre la lactancia: este tipo de crema se usa habitualmente durante la lactancia, pero su médico debe confirmarlo con usted antes de empezar. No la aplique en el pecho.

Llame a la clínica si la piel empeora, aparece pus o fiebre, o si no mejora en 2 semanas.`;

export const PATIENT = {
  name: "Maria Gonzalez",
  meta: "DOB 1988-04-12 · Spanish",
  visit: "Dermatology · suspected eczema flare",
  visitReason: "Suspected eczema flare",
  allergies: "Sulfa",
  currentMeds: "Prenatal vitamin",
  raisedInVisit: "Breastfeeding question",
} as const;

export const PHOTON = {
  env: "NEUTRON · sandbox",
  host: "api.neutron.health · oauth2",
  scope: "read · write:patient",
  prescribeScope: "not requested",
  patientId: "pat_01HQ7K4M2Z",
  treatmentId: "med_8f21c94a",
} as const;

export const MEDICATION = {
  name: "Hydrocortisone cream 2.5%",
  directions: "Apply thin layer to affected areas twice daily for 7 days",
  quantity: "30 g tube",
  refills: "0",
  pharmacistNotes: "Patient is breastfeeding; clinician reviewed counseling.",
  summary: "2.5% · 30 g · 7 days · 0 refills",
} as const;

export const REVIEWER = { name: "Dr. A. Okafor", time: "10:42" } as const;

export const AI_MODEL = "OpenAI · gpt-4o-mini";
```

Card-specific fixtures (safety-check copy, milestone rows, log rows, handoff rows) are appended to
this file by `T-09`, `T-12`, `T-13`, `T-14` respectively. Each of those tickets carries its own
verbatim strings.

---

## 3. Initial state — **decision, read this**

The mockup boots to `phase: 'final'` with all four checks `true`. That is a screenshot convenience:
the designer wanted the happy path to be the first thing visible in the design tool.

**The real app boots to the same state `reset()` produces:**

```ts
export const INITIAL_STATE: VisitState = {
  phase: "idle",
  note: CLINICIAN_NOTE,
  reviewed: false,
  finalized: false,
  checks: { allergy: false, interaction: false, dose: false, lactation: false },
  thread: [],
  patientDraft: "",
  clinicianReply: "",
  toast: "",
};
```

Note `note` is pre-filled with `CLINICIAN_NOTE` even at boot — the mockup does this, and it is
right: the demo should be one click from something happening.

---

## 4. Phase transitions

`setPhase(p)` sets the phase **and** applies a preset, because `reviewed`/`finalized` are not
independently meaningful in most phases:

| phase | reviewed | finalized |
|---|---|---|
| `idle` | false | false |
| `loading` | false | false |
| `review` | false | false |
| `final` | **true** | **true** |
| `aiError` | false | false |
| `apiError` | false | false |

Only `final` presets to `true`. `setPhase` is used by the prototype switcher (`T-17`); the real
actions below set state more precisely.

### Actions

| Action | Effect |
|---|---|
| `generate()` | `phase='loading'`, `reviewed=false`, `finalized=false`; after **1400ms** → `phase='review'`, `reviewed=false`, `finalized=false`. Clears any pending timer first. |
| `regenerate()` | Identical to `generate()`. Keep both names — the button label differs (`T-06`), the behavior does not. |
| `manualEntry()` | `phase='review'`, `reviewed=false`, `finalized=false`; toast `Switched to manual entry`. |
| `retryApi()` | `phase='review'`, `reviewed=false`, `finalized=false`; toast `Treatment lookup succeeded · med_8f21c94a`. |
| `toggleReviewed()` | If `!hasInstructions` → toast `Generate instructions first`, no state change. Else `reviewed = !reviewed`, `finalized=false`, `phase='review'`. |
| `finalize()` | If `!canFinalize` → toast the first matching reason (§4.1), no state change. Else `phase='final'`, `finalized=true`, toast `Handoff prepared — continue in Photon`. |
| `reset()` | Clear the pending generate timer, then set state to `INITIAL_STATE`. No toast. |
| `setNote(v)` / `setPatientDraft(v)` / `setClinicianReply(v)` | Plain field setters. |
| `sendPatientMessage()` | See `T-11`. |
| `sendClinicianReply()` | See `T-11`. |
| `toggleCheck(key)` | Flip one safety check. |
| `showToast(msg)` | Set `toast=msg`, clear after **2200ms**. Restarts the timer on each call. |

Notice `toggleReviewed()` forces `phase='review'` even when un-reviewing from `final`. That is
correct: un-reviewing must take the app out of the finalized state, and `review` is the phase that
means "instructions exist, not signed off".

### 4.1 `finalize()` blocked-reason ladder

Evaluate in this order and toast the **first** match:

```
isApiError        → "Resolve the treatment lookup first"
!hasInstructions  → "Generate the Spanish instructions first"
!reviewed         → "Mark the AI output reviewed first"
otherwise         → "Complete the safety review first"
```

The last case is the safety checklist being incomplete. Do not reorder — API error outranks
everything because it is the only condition the clinician cannot resolve from the left column.

---

## 5. Derived values the hook returns

```ts
const isIdle    = phase === "idle";
const isLoading = phase === "loading";
const isAiError = phase === "aiError";
const isApiError = phase === "apiError";

/** apiError is included: the AI succeeded, only Photon's treatment lookup failed. */
const hasInstructions = phase === "review" || phase === "final" || phase === "apiError";

/** finalized is only true in the final phase, even if the flag lingers. */
const finalized = state.finalized && phase === "final";

const checksDone  = Object.values(checks).filter(Boolean).length;   // 0..4
const allChecked  = checksDone === 4;
/** The three that represent API syncs, excluding the clinician-confirmed lactation check. */
const syncedCount = (["allergy", "interaction", "dose"] as const)
  .filter((k) => checks[k]).length;                                  // 0..3

const canReview   = hasInstructions;
const canFinalize = hasInstructions && reviewed && allChecked && !isApiError;

/** Photon has been contacted at all. Drives the connection badge (T-12). */
const connOk = !isIdle;
```

`hasInstructions` including `apiError` is the single most-missed detail in this design. Verify it
by switching to the API-error state: the Spanish instructions panel must still show content.

---

## 6. `stamp()` — thread timestamps

The mockup derives message times from thread length so the transcript reads as a real conversation
without a clock:

```ts
function stamp(threadLength: number): string {
  const base = 10 * 60 + 44 + threadLength * 2;  // 10:44, +2 min per message
  const h = Math.floor(base / 60);
  const m = base % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
```

Keep it. A real `new Date()` would make the transcript disagree with the evidence log's fixed
`10:38–10:42` timestamps, and the whole right column is built on those fixed times.

---

## 7. The hook

```ts
export function useVisitWorkflow() {
  // useState<VisitState>(INITIAL_STATE)
  // useRef for the generate timer and the toast timer
  // useEffect cleanup clearing both on unmount
  return { state, derived, actions };
}
```

Requirements:

- `'use client'` at the top of the file.
- Both timers live in refs and are cleared on unmount and before being re-set. The mockup does this
  (`clearTimeout(this._g)` / `this._t`); leaking them causes a state update after unmount.
- All state updates use the functional form (`setState(s => …)`), because `sendPatientMessage`
  appends to `thread` and `toggleCheck` spreads `checks`.
- Return a stable object shape. Do not memoize prematurely — this tree is small and re-renders
  cheaply; a `useMemo` per derived value would be more code than it saves.
- No `any`. `derived` is fully typed.

---

## 8. Wiring into the shell

`VisitWorkspace.tsx` (from `T-01`) calls `useVisitWorkflow()` once and passes slices down as props.
**No context provider.** `V2-PRD.md` is explicit that a provider/reducer layer is deferred; the tree
is three levels deep and prop-drilling is legible here.

---

## Acceptance criteria

- [ ] `npm run build` passes; `types.ts` has no `any`.
- [ ] A temporary debug panel printing every derived boolean confirms this table:

| phase | hasInstructions | finalized | canReview | canFinalize (all checks on, reviewed) | connOk |
|---|---|---|---|---|---|
| `idle` | false | false | false | false | false |
| `loading` | false | false | false | false | true |
| `review` | **true** | false | true | true | true |
| `final` | true | **true** | true | true | true |
| `aiError` | false | false | false | false | true |
| `apiError` | **true** | false | true | **false** | true |

- [ ] `generate()` lands in `review` after 1400ms, not sooner, not in `final`.
- [ ] Calling `generate()` twice quickly produces exactly one transition (timer cleared).
- [ ] `finalize()` from `apiError` with everything else satisfied toasts
      `Resolve the treatment lookup first` and does not change phase.
- [ ] `toggleReviewed()` from `final` leaves the app in `review` with `finalized === false`.
- [ ] `reset()` returns state deep-equal to `INITIAL_STATE`.
- [ ] Unmounting mid-`loading` logs no React warning.

## Out of scope

Rendering. This ticket produces no markup. If you find yourself writing a `<div>`, stop.
Real OpenAI/Photon calls are `T-19`; the 1400ms timer is a deliberate stand-in and its call site is
the seam that ticket replaces.
