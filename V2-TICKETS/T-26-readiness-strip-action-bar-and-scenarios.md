# T-26 — Readiness strip, rewritten action bar, and scenario switcher

**Phase:** V2.1 chrome · **Depends on:** T-22 · **Blocks:** T-28
**Read first:** `T-00-design-reference.md`, then `T-21-v2.1-design-reference.md`

---

## Context

Once the workflow stops being linear, the clinician needs a persistent answer to "what is left?".
V2.1 answers it twice: a **readiness strip** under the header showing four dots, and an action bar
that names the same count. The handoff card quotes it too (`T-27 §7`). One number, three places.

The action bar also stops being a terminal step. V2 had `Reset · Copy · Finalize`; V2.1 has
`Reset ┃ Generate · Sync Photon · Translate · Finalize` — the three main workflow verbs promoted to
always-available buttons, in any order. `Copy` moves out (it stays on the instructions panel).

---

## Files

- `app/visit/components/ReadinessStrip.tsx` — **new**
- `app/visit/components/ActionBar.tsx` — rewrite
- `app/visit/components/PrototypeSwitcher.tsx` — rewrite (removes the `T-22 §7` shim)
- `app/visit/components/AppHeader.tsx` — copy + prop changes
- `app/visit/VisitWorkspace.tsx` — mount the strip, update section headers

---

## 1. `AppHeader` changes

Three edits to the shipped component:

1. Subtitle `Clinician workspace` → **`Visit assistant`**.
2. `patientName` / `patientMeta` now come from live patient state, not `PATIENT` constants
   (`T-23 §5`):
   ```ts
   patientName = `${first} ${last}`.trim() || "No patient";
   patientMeta = (dob ? `DOB ${dob} · ` : "") + "Spanish";
   ```
3. Overall pill's in-progress label `Preparing for Photon` → **`Visit in progress`**.
   Palette unchanged (`T-04 §3`): amber default, green `Prepared for Photon` when finalized, red
   `Action needed` on either error.

`visitSummary` stays the constant `Dermatology · suspected eczema flare`. The environment badge is
unchanged, including the `T-19` fixture-mode override.

### Section headers

| column | V2 | V2.1 |
|---|---|---|
| left | `AI Prep` / `OpenAI · clinician-reviewed` | **`Visit workspace`** / **`Work in any order`** |
| right | `Photon API` / `Clinical API · no Elements` | unchanged |

Update the `<section aria-label>` to match the new title.

`Work in any order` is the instruction that makes the readiness strip legible — it tells the
clinician the four dots are a checklist, not a sequence.

---

## 2. Readiness strip

Sits between `AppHeader` and the body grid, full width, fixed height, never scrolls.

```
flex items-center gap-[14px] flex-wrap px-5 py-2
bg-strip-bg border-b border-strip-line
```

`--color-strip-bg` `#EBEEF4` and `--color-strip-line` `#DFE3EC` are new (`T-21 §5`). The background
is darker than the page (`#F1F3F7`) — the strip recedes behind the white header and the white cards,
reading as a rail rather than a panel.

```
<span class="text-[10.5px] font-bold tracking-[.07em] uppercase text-muted">Handoff readiness</span>
… 4 items …
<div class="flex-1 min-w-[8px]" />
<span class="text-[11px] text-muted-2">{summary}</span>
```

`.07em` tracking — a third value, between the field label's `.06em` and the section header's `.08em`.

### Item

```
flex items-center gap-[6px]
  <span class="w-[7px] h-[7px] rounded-full shrink-0 {dotColor}" aria-hidden="true" />
  <span class="text-[11.5px] {labelClasses}">{label}</span>
```

| | complete | incomplete |
|---|---|---|
| dot | `bg-ok` (`#0E8A5A`) | `bg-line-strongest` (`#C9CEDA`) |
| label | `font-semibold text-ink-3` | `font-medium text-muted-2` |

7px dots — smaller than the header pill's 6px... no: **larger**. The header dot is 6px, these are
7px. Both are `aria-hidden`; the label carries the meaning, and completion is conveyed by weight and
color together, not color alone.

### The four items (order fixed)

| # | Label | Source (`T-22 §3`) |
|---|---|---|
| 1 | `Patient synced` | `patientSynced` |
| 2 | `Treatment selected` | `hasSelectionStrict` |
| 3 | `Instructions generated` | `hasInstructions` |
| 4 | `Clinician reviewed` | `reviewed` |

Item 2 uses the **strict** selection (`T-21 §4`): a selected treatment with a failed lookup reads as
not ready here, even though the medication prep section stays visible.

Summary: `` `${readyCount} of 4 complete` ``

Give the strip `role="status"` so a screen reader hears the count change as items complete.

**Note what is not on this list:** the safety review. It gates `canFinalize` but is not one of the
four readiness items, so `4 of 4 complete` can coexist with a blocked Finalize. That is the
mockup's design and it is arguably a wart — the handoff body copy compensates by naming the safety
review explicitly (`T-27 §7`). Do not add a fifth dot; do flag it in the PR.

---

## 3. Action bar

```
flex items-center justify-between gap-3 flex-wrap px-5 py-[11px]
bg-surface border-t border-line
  <div class="text-[11.5px] text-muted">{hint}</div>
  <div class="flex gap-2 flex-wrap items-center"> … buttons … </div>
```

Container unchanged from `T-16` except `items-center` on the button group (for the divider).

### Buttons, left to right

| # | Label | Variant | Dimmed when | Action |
|---|---|---|---|---|
| 1 | `Reset demo` | ghost, `px-[13px] py-[9px]` | never | `applyScenario("default")` |
| — | divider | `w-px h-[22px] bg-line-2` | — | — |
| 2 | `Generate instructions` | ghost | `!hasSelectionLoose` | `generate` |
| 3 | `Sync Photon` / `Syncing…` | ghost | never | `syncPhoton` |
| 4 | `Translate` | ghost | never | `translateAction` |
| 5 | `Finalize handoff` | primary | `!canFinalize` | `finalize` |

Ghost buttons here are `px-[14px] py-[9px] rounded-[7px] text-[12.5px] font-semibold` — `T-02`'s
`ghost`/`md`. `Reset demo` is one pixel narrower (`px-[13px]`); use `md` and accept it.

Button 5 when `finalized`: `variant="success"`, label `Handoff prepared ✓` (U+2713, leading space).

The divider separates *reset the demo* from *do the work*. It is the only vertical rule in the app
besides the header's.

**`Copy Spanish instructions` is removed from the bar.** Copy now lives only on the instructions
panel (`T-07 §4.2`). Delete the `canCopy`/`onCopy` props from `ActionBar`; keep
`copySpanishInstructions` in the workflow — the panel still calls it.

Dimmed buttons stay clickable and toast their reason (`T-02 §4.1`). Unchanged.

### `translateAction`

The bar's Translate button operates on whichever composer has text:

```ts
translateAction: () => {
  if (patientDraft.trim())        return sendPatientMessage();
  if (clinicianReply.trim())      return sendClinicianReply();
  showToast("Type a follow-up in the thread first");
}
```

Patient draft wins when both are filled. It is a shortcut for the two send buttons in
`PatientFollowUpCard`, not a separate path — reuse those actions rather than duplicating the append
logic.

### Hint text

```ts
finalized  → "Handoff prepared · no prescription was created by this app"
isApiError → "Treatment lookup failed · resolve to continue"
isAiError  → "Generation failed · nothing sent to Photon"
otherwise  → `${readyCount} of 4 readiness items complete · work in any order`
```

Four branches, down from seven. The default now reports progress instead of naming the next step,
because there is no single next step any more. Note the `apiError` copy changed from V2's
`handoff blocked` to `resolve to continue`.

`getActionHint` in `VisitWorkspace` currently takes `(phase, reviewed)` — retype it to take the
derived values.

---

## 4. Prototype switcher → scenario switcher

Same dark chrome as `T-17` (`bg-chrome-bg`, mono label `Prototype control · not product UI`, the
`bg-chrome-inset` track, the `VITE_SHOW_PROTOTYPE_CONTROLS` gate). Only the buttons change: **six
phases become five scenarios**.

| key | label | hint |
|---|---|---|
| `default` | `Populated` | `Populated visit · default patient and treatment.` |
| `fresh` | `Fresh visit` | `Nothing selected or generated yet.` |
| `aiError` | `AI error` | `Generation failed; Photon untouched.` |
| `apiError` | `Lookup error` | `Treatment lookup failed; handoff blocked.` |
| `prepared` | `Prepared` | `Reviewed and handed off.` |

`loading` is **not** a scenario — it is transient and reachable by clicking Generate.

### Active scenario is derived, not stored

```ts
const active =
  finalized                     ? "prepared"
  : isAiError                   ? "aiError"
  : isApiError                  ? "apiError"
  : (isIdle && !selectedId)     ? "fresh"
  :                               "default";
```

So the highlight tracks real state. Work the app forward from `fresh` and the switcher lights up
`default` on its own.

### `applyScenario(key)`

Each scenario writes a **complete** state, sharing this base:

```ts
const base = {
  thread: [], patientDraft: "", clinicianReply: "", toast: "",
  prep: { directions: "Apply thin layer to affected areas twice daily",
          quantity: "30 g tube", duration: "7 days", refills: "0",
          pharmNote: "Patient is breastfeeding; clinician reviewed counseling." },
  patientEditing: false,
  note: CLINICIAN_NOTE,
  patient: { ...DEFAULT_PATIENT }, draftPatient: { ...DEFAULT_PATIENT },
  patientDirty: false,
  clock: 10 * 60 + 39,
};
```

| | `fresh` | `aiError` | `apiError` | `prepared` | `default` |
|---|---|---|---|---|---|
| `patientSync` | `none` | `synced` | `synced` | `synced` | `synced` |
| `patientId` | `""` | `pat_01HQ7K4M2Z` | `pat_01HQ7K4M2Z` | `pat_01HQ7K4M2Z` | `pat_01HQ7K4M2Z` |
| `query` | `""` | `hydrocortisone` | `hydrocortisone` | `hydrocortisone` | `hydrocortisone` |
| `results` | `[]` | 3 hydro | **`[]`** | 3 hydro | 3 hydro |
| `searched` | `false` | `true` | `true` | `true` | `true` |
| `selectedId` | `null` | `med_8f21c94a` | `med_8f21c94a` | `med_8f21c94a` | `med_8f21c94a` |
| `ai` | `idle` | `error` | `ready` | `ready` | `ready` |
| `aiForId` | `null` | `null` | `med_8f21c94a` | `med_8f21c94a` | `med_8f21c94a` |
| `reviewed` | `false` | `false` | `false` | **`true`** | `false` |
| `historySync` | `none` | `ok` | `ok` | `ok` | `ok` |
| `txLookup` | `none` | `ok` | **`error`** | `ok` | `ok` |
| `checks` | all false | a✓ i✓ d✓ l✗ | a✓ i✓ **d✗** l✗ | **all true** | a✓ i✓ d✓ l✗ |
| `finalized` | `false` | `false` | `false` | **`true`** | `false` |
| `clock` | `10*60+38` | (base) | (base) | (base) | (base) |

Log seeds:

- `fresh` — one row: `10:38:02 · 200 · POST /auth/token`
- `aiError` — three rows: auth, `10:38:41 · 201 · POST /patients → pat_01HQ7K4M2Z`,
  `10:39:11 · 504 · POST /instructions → timeout`
- `apiError` — three rows: auth, the same `201`, `10:39:20 · 503 · GET /catalog/treatments → failed`
- `prepared` — the **current** log plus `10:42:07 · 200 · Handoff prepared · no Rx written`
- `default` — the current log truncated to its first 7 rows

The last two read from live state rather than a fixture. `prepared` appends to whatever happened so
far, and `default` truncates back to the seed. Slightly odd, but it means jumping to `Prepared`
mid-demo preserves the evidence trail the interviewer just watched accumulate — which is the point
of the log. Follow it.

`reset` is `applyScenario("default")`, **not** `INITIAL_STATE`. The two differ only in the log
(reset truncates the live log; `INITIAL_STATE` carries the 7 seed rows), so after a fresh load they
are identical.

Note `aiError` has `aiForId: null` — no instructions exist to be stale. And `apiError` has
`results: []` with `searched: true`, so it shows the **no-matches panel** under a failed lookup.

Switcher a11y unchanged from `T-17`: `role="group"`, `aria-pressed` on the active button.

---

## Acceptance criteria

- [ ] Strip renders under the header, full width, `#EBEEF4` on a `#DFE3EC` rule, ~31px tall
      (8px padding top and bottom around a ~15px line box). Tolerance ±2px.
- [ ] Boot (`default`): dots 1–3 green, dot 4 grey, summary `3 of 4 complete`.
- [ ] Marking reviewed → `4 of 4 complete`, all dots green, and the action-bar hint updates to match.
- [ ] `fresh`: `0 of 4 complete`, all dots grey.
- [ ] `apiError`: `Treatment selected` reads **incomplete** despite a selection (strict gate).
- [ ] Completed labels are `font-semibold #3A3F4C`; incomplete are `font-medium #8A90A0`.
- [ ] Header subtitle reads `Visit assistant`; left section header reads `Visit workspace` /
      `Work in any order`.
- [ ] Overall pill reads `Visit in progress` in amber at boot.
- [ ] Action bar: 5 buttons with a 22px divider after `Reset demo`; no `Copy` button.
- [ ] `Generate instructions` dims when no treatment is selected and toasts
      `Select a treatment first` when clicked.
- [ ] `Sync Photon` shows `Syncing…` for 900ms.
- [ ] `Translate` with an empty thread toasts `Type a follow-up in the thread first`; with Spanish
      text it sends the patient message; with only English it sends the clinician reply.
- [ ] All four hint branches appear.
- [ ] Five scenario buttons; the active one highlights and tracks derived state — advance `fresh`
      manually to a populated state and watch the highlight move to `Populated` unprompted.
- [ ] `prepared` produces a green header pill, a full handoff manifest, and an appended
      `Handoff prepared · no Rx written` row.
- [ ] `apiError` shows both the red selected-treatment card and the dashed no-matches panel.
- [ ] Switcher hidden in a production build without `VITE_SHOW_PROTOTYPE_CONTROLS=true`.
- [ ] Strip has `role="status"`; dots are `aria-hidden`.
- [ ] No hex literal in any of the files.

## Out of scope

Making the safety review a fifth readiness item, URL-deep-linked scenarios, persisting the selected
scenario, animating the strip.
