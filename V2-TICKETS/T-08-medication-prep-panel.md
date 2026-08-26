# T-08 — Medication prep panel

**Phase:** Left column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

The medication details the clinician will carry into Photon: drug, strength, directions, quantity,
refills, pharmacist note. The header's right slot — `Prepared for Photon · not prescribed here` —
is the app's core disclaimer, sitting directly above the only fields that look like a prescription.
It is not decoration; it is the reason this card is allowed to exist.

The treatment-ID chip on this card mirrors the Photon lookup status from the right column, so the
clinician can confirm the drug they're prepping is the one Photon actually resolved.

---

## File

`app/visit/components/MedicationPrepCard.tsx` — no handlers, so no `'use client'` needed.

---

## Props

```tsx
type MedicationPrepCardProps = {
  medication: typeof MEDICATION;   // from demoData
  treatmentIdState: "awaiting" | "failed" | "resolved";
  treatmentId: string;             // PHOTON.treatmentId — only shown when resolved
};
```

Derive `treatmentIdState` in `VisitWorkspace`, not here:

```ts
const treatmentIdState =
  isIdle || isAiError || isLoading ? "awaiting"
  : isApiError ? "failed"
  : "resolved";
```

---

## Structure

```
<Card>
  <CardHeader title="Medication prep" meta="Prepared for Photon · not prescribed here" />
  <div class="px-[14px] py-[13px] grid grid-cols-2 gap-x-4 gap-y-3">
    … 5 fields …
  </div>
</Card>
```

Grid gap is `12px 16px` → `gap-y-3 gap-x-4`.

---

## The five fields

Each is `<FieldLabel>` + a value block.

| # | Label | Span | Value |
|---|---|---|---|
| 1 | `Medication` | `col-span-2` | name + chip (see §1) |
| 2 | `Directions` | `col-span-2` | `text-[12.5px] font-medium leading-[1.5]` |
| 3 | `Quantity` | 1 col | `text-[12.5px] font-semibold` → `30 g tube` |
| 4 | `Refills` | 1 col | `text-[12.5px] font-semibold` → `0` |
| 5 | `Notes to pharmacist` | `col-span-2` | `text-[12.5px] leading-[1.5] text-ink-3` |

Values:

- Directions: `Apply thin layer to affected areas twice daily for 7 days`
- Notes: `Patient is breastfeeding; clinician reviewed counseling.` (trailing period included)

Quantity and Refills sit side by side because they are the two fields a pharmacist scans together.
Everything else spans the full width. Note field 2 is `font-medium` (500) while 3 and 4 are
`font-semibold` (600) — the short values carry more weight so the eye lands on them.

---

## 1. Medication row

```
flex items-center gap-[9px] flex-wrap
  span: text-[13.5px] font-bold      → "Hydrocortisone cream 2.5%"
  <TreatmentIdChip />
```

### Treatment ID chip

```
font-mono text-[10.5px] px-2 py-[3px] rounded-[5px]
```

| state | label | classes |
|---|---|---|
| `awaiting` | `awaiting lookup` | `bg-surface-muted text-muted-2` |
| `failed` | `lookup failed` | `bg-err-bg text-err-ink` |
| `resolved` | `med_8f21c94a` | `bg-brand-bg-3 text-brand-ink` |

No border on any of the three — this chip is a fill-only shape, unlike `<Badge>`. Do not substitute
a `<Badge>` here; the mono font and 5px radius are what mark it as a machine identifier rather than
a status word.

The chip is the one element on this card that changes with phase. Everything else is static, which
is honest: the medication prep does not depend on whether Photon answered.

---

## Acceptance criteria

- [ ] Two-column grid; `Quantity` and `Refills` share a row, the other three span both columns.
- [ ] Header right slot reads exactly `Prepared for Photon · not prescribed here`.
- [ ] Chip shows `awaiting lookup` (grey) at `idle`, `loading`, and `aiError`.
- [ ] Chip shows `lookup failed` (red) at `apiError`.
- [ ] Chip shows `med_8f21c94a` (blue, `#EDF0FF` on `#2A3AB0`) at `review` and `final`.
- [ ] Chip renders in IBM Plex Mono at 10.5px with no border.
- [ ] `Refills` renders the string `0`, not a falsy-collapsed empty node. (Classic bug: `{refills && …}`
      with a numeric `0`. `MEDICATION.refills` is the string `"0"` for exactly this reason — keep it
      a string.)
- [ ] No hex literal in the file.

## Out of scope

Editing these fields, dose validation, real catalog data. V2 renders fixed prep values; `T-19`
sources the treatment ID from the real Photon lookup and leaves the rest as demo content.
