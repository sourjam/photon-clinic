# T-25 — Medication prep: editable, nested, and a new Duration field

**Phase:** V2.1 left column · **Depends on:** T-22, T-24 · **Blocks:** T-28
**Read first:** `T-00-design-reference.md`, then `T-21-v2.1-design-reference.md`

---

## Context

V2's `MedicationPrepCard` was a standalone read-only card of five static values. V2.1 **deletes that
card** and rebuilds the same content as an editable footer section inside the treatment-search card
(`T-24`), gaining a sixth concept: `Duration` is split out of the directions string into its own
field.

The move is the point. Medication prep is not independent information — it is *the detail of the
selected treatment*. Nesting it inside the search card means it appears when a treatment is picked
and vanishes when it is cleared, and the clinician never sees dosing fields floating free of the
drug they belong to.

The header disclaimer survives verbatim: **`Prepared for Photon · not prescribed here`**.

---

## Files

- `app/visit/components/MedicationPrepSection.tsx` — **new**, `'use client'`
- `app/visit/components/MedicationPrepCard.tsx` — **delete**
- `app/visit/useVisitWorkflow.ts` — add `setPrepField`

Rendered as `children` of `TreatmentSearchCard` (`T-24`), gated on **`hasSelectionLoose`**.

---

## Props

```tsx
type MedicationPrepSectionProps = {
  prep: MedicationPrep;   // { directions, quantity, duration, refills, pharmNote }
  onChange: (field: keyof MedicationPrep, value: string) => void;
};
```

---

## Structure

```
<div class="border-t border-line-soft px-[14px] py-3">
  <div class="flex justify-between items-center mb-[9px]">
    <div class="text-[11px] font-bold tracking-[.05em] uppercase text-muted">Medication prep</div>
    <span class="text-[11px] text-muted-2">Prepared for Photon · not prescribed here</span>
  </div>
  <div class="grid grid-cols-3 gap-x-[14px] gap-y-[10px]">
    … 5 fields …
  </div>
</div>
```

The `border-t` is what separates it from the search body inside the shared card.

### The section title is not a card title

```
text-[11px] font-bold tracking-[.05em] uppercase text-muted    (#7A8090)
```

11px uppercase with `.05em` tracking — a **sub-section** label, distinct from both the 12.5px/700
card titles (`T-00 §5.1`) and the 12px/`.08em` column headers (`T-00 §5.5`). A third heading level,
used exactly once. It reads as subordinate to `Treatment search`, which is correct.

---

## The five fields

Grid is `repeat(3, minmax(0,1fr))`, gaps `10px 14px`.

| # | Label | Span | Default value |
|---|---|---|---|
| 1 | `Directions` | `col-span-3` | `Apply thin layer to affected areas twice daily` |
| 2 | `Quantity` | 1 | `30 g tube` |
| 3 | `Duration` | 1 | `7 days` |
| 4 | `Refills` | 1 | `0` |
| 5 | `Notes to pharmacist` | `col-span-3` | `Patient is breastfeeding; clinician reviewed counseling.` |

Each: `<FieldLabel dense={false}>` (4px margin, `T-21 §6.2`) over an `<Input>` (`T-21 §6.1`).

Rows 2–4 fill one grid row exactly — quantity, duration, refills are the three fields a pharmacist
reads together. In V2 (`T-08`) it was a 2-column grid with only quantity and refills paired;
duration lived inside the directions sentence.

### ⚠ `Directions` loses "for 7 days"

| | V2 | V2.1 |
|---|---|---|
| `directions` | `Apply thin layer to affected areas twice daily for 7 days` | `Apply thin layer to affected areas twice daily` |
| `duration` | — | `7 days` |

Carrying the V2 string forward produces `…twice daily for 7 days` next to a `Duration: 7 days`
field. Update the constant when you land this.

`refills` stays the **string** `"0"` (`T-22 §1`) — it is a text input now, and `{refills && …}` on a
numeric zero renders nothing (`T-08`).

---

## `setPrepField`

```ts
setPrepField: (field, value) => set({
  prep: { ...prep, [field]: value },
  // The pharmacist note is not part of the handoff manifest, so editing it
  // does not invalidate a completed handoff. Every other field is.
  ...(field === "pharmNote" ? {} : { finalized: false }),
})
```

Four of five fields clear `finalized`; `pharmNote` does not. That asymmetry is the mockup's, and it
is defensible — the manifest row is
`[strength, quantity, duration, refills + " refills"]` and the note is absent from it. Keep the
comment; without it this reads as a bug.

---

## Downstream consumers

These prep values are read in three other places. All three are **derived at render**, so editing a
field updates them live — verify each.

### 1. `dose` safety-check meta (`T-27 §3`)

```ts
sel
  ? [strength, quantity, duration, `${refills} refills`].filter(Boolean).join(" · ")
  : "Select a treatment first"
```

Default: `2.5% · 30 g tube · 7 days · 0 refills`

V2's was the static string `2.5% · 30 g · 7 days · 0 refills`. Note `30 g tube` vs `30 g` — the
V2.1 value is the literal quantity field, so it carries the word `tube`.

### 2. Handoff manifest row `Medication prep` (`T-27 §7`)

Same expression, same result.

### 3. Spanish instructions

`strength` (parsed from the treatment name, not from these fields) is interpolated into the dosing
paragraph (`T-27 §2`). The prep fields themselves are **not** translated — the Spanish text comes
from the clinician note. Changing `quantity` here does not change the Spanish.

That gap is real and worth knowing: a clinician could set `Duration: 14 days` while the note and the
Spanish still say `7 días`. V2.1 does not reconcile them. Do not invent a reconciliation — but do
not paper over it either. Flag it as a known limitation in the PR; the honest fix is a prompt input,
which is `T-20`/`T-28 §6` territory.

`.filter(Boolean)` drops `strength` when the selected treatment name has no parseable strength
(e.g. a hypothetical entry without `%` or `mg`). Every current `CATALOG` entry has one.

---

## Acceptance criteria

- [ ] Section renders only when a treatment is selected; clearing the selection removes it entirely.
- [ ] It is **still visible** in the `Lookup error` scenario with a selection (loose gate —
      `T-21 §4`).
- [ ] `border-t` separates it from the search body inside one shared card outline — not a second
      card.
- [ ] Grid: Directions full width, then Quantity / Duration / Refills on one row, then Notes full
      width.
- [ ] Defaults match the table, with `directions` **not** containing `for 7 days`.
- [ ] All five inputs are editable, controlled, 6px radius, and show a focus ring.
- [ ] Editing `Duration` to `14 days` updates the `dose` safety-check meta to
      `2.5% · 30 g tube · 14 days · 0 refills` **and** the handoff manifest row, live.
- [ ] Editing `Quantity`, `Duration`, `Refills`, or `Directions` clears `finalized` — finalize
      first, then edit, and watch the handoff card leave `Ready`.
- [ ] Editing `Notes to pharmacist` does **not** clear `finalized`, and the code says why.
- [ ] Selecting `Lisinopril tablet 10 mg` makes the meta read `10 mg · …` (strength re-parses).
- [ ] Section title renders 11px uppercase `#7A8090`, visibly subordinate to the card title.
- [ ] Meta reads exactly `Prepared for Photon · not prescribed here`.
- [ ] `MedicationPrepCard.tsx` is deleted and unreferenced.
- [ ] No hex literal in the file.

## Out of scope

Dose validation, unit parsing, catalog-driven defaults (selecting a treatment does **not** rewrite
these fields in V2.1 — they persist across selections), interaction checking, sig-code generation,
and any control that would write these values to a prescription.
