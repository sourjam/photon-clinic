# T-05 — Patient context card

**Phase:** Left column · **Depends on:** T-02 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

Four facts the clinician must be able to see without scrolling, laid out as a single row of cells
with hairline dividers. Two of the four cells are tinted amber because they are the safety-relevant
ones — the allergy on file, and the thing the patient raised during this visit that changes the
plan (breastfeeding).

This is the simplest card in the app and the only one with no state. It is a good first ticket.

---

## File

`app/visit/components/PatientContextCard.tsx` — no `'use client'`, no props beyond the data.

---

## Props

```tsx
type PatientContextCardProps = {
  visitReason: string;   // PATIENT.visitReason  "Suspected eczema flare"
  allergies: string;     // PATIENT.allergies    "Sulfa"
  currentMeds: string;   // PATIENT.currentMeds  "Prenatal vitamin"
  raisedInVisit: string; // PATIENT.raisedInVisit "Breastfeeding question"
};
```

---

## Structure

```
<Card className="overflow-hidden">
  <CardHeader title="Patient context" />          ← title-only variant, no right slot
  <div class="flex flex-wrap">
    cell × 4
  </div>
</Card>
```

`overflow-hidden` on the Card is required: the amber cells run to the card's edge and would
otherwise paint over the 9px corner radius on the bottom-right.

---

## The four cells

Every cell:

```
px-[14px] py-[10px]
  <FieldLabel tone=…>{label}</FieldLabel>
  <div class="text-[12.5px] font-semibold {valueColor}">{value}</div>
```

| # | Label | Value | flex basis | tint | label tone | value color | right divider |
|---|---|---|---|---|---|---|---|
| 1 | `Visit reason` | `visitReason` | `flex-[1_1_150px]` | none | `default` | `text-ink` (inherit) | yes |
| 2 | `Allergies` | `allergies` | `flex-[1_1_130px]` | `bg-warn-bg` | `warn` | `text-warn-ink-3` | yes |
| 3 | `Current meds` | `currentMeds` | `flex-[1_1_140px]` | none | `default` | `text-ink` (inherit) | yes |
| 4 | `Raised in visit` | `raisedInVisit` | `flex-[1_1_160px]` | `bg-warn-bg` | `warn` | `text-warn-ink-3` | **no** |

Divider = `border-r border-line-softer` (`#F0F2F6`). The fourth cell has none — nothing follows it.

The differing flex bases (150/130/140/160) are intentional: they distribute the row so the two
short values (`Sulfa`, `Prenatal vitamin`) don't get more width than the two long ones. Keep them.

The uppercase field labels in the amber cells use `text-warn-ink-2` (`#9A6A00`) via
`<FieldLabel tone="warn">`, while the *values* in those cells use `text-warn-ink-3` (`#7A5400`).
Two different browns. This is not a mistake in the design — the label is lighter than the value,
same as in the neutral cells.

---

## Wrapping behavior

At the left column's design width (~808px) all four cells sit on one row. `flex-wrap` means that as
the column narrows, cells wrap to a second row and the `border-r` on a wrapped-to-end cell will
look like a stray hairline. Accept it — the mockup has the same behavior, and at the widths this
app is used at, the row does not wrap. **Do not** add wrap-aware divider logic; it is more code
than the problem deserves.

---

## Semantics

Use a definition list only if it stays visually identical — `<dl>` with `<dt>`/`<dd>` and the flex
layout on the `<dl>` works, and communicates the label/value relationship to screen readers for free.
That is the better markup here. If flex on `<dl>` fights you, plain `<div>`s are acceptable; do not
trade the layout for the semantics.

The amber tint carries meaning ("this needs attention"). Color alone is not sufficient — but the
labels `Allergies` and `Raised in visit` already say what they are, so no extra affordance is
needed. Do **not** add a warning icon; the design is deliberately quiet, and the safety flag with
real weight lives in the checklist (`T-09`).

---

## Acceptance criteria

- [ ] Card renders 4 cells in one row at 808px container width.
- [ ] Cells 2 and 4 have `#FDF8EE` backgrounds that reach the card's edges with no white gap and
      no square corner at the bottom-right.
- [ ] Cell 2 label samples `#9A6A00`; cell 2 value samples `#7A5400`.
- [ ] Cell 4 has no right border.
- [ ] Header reads `Patient context`, 12.5px/700, with a `#EEF0F5` bottom rule and no right slot.
- [ ] No hex literal in the file.

## Out of scope

Editing any of these fields, syncing them to Photon, an "edit patient" affordance. The card is
read-only in V2 — the values come from `demoData.ts` and, in `T-19`, from the Photon patient read.
