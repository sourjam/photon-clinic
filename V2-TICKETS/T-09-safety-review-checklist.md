# T-09 — Safety review checklist

**Phase:** Left column · **Depends on:** T-02, T-03 · **Blocks:** T-16, T-18
**Read first:** `T-00-design-reference.md`

---

## Context

Four checkboxes that gate the handoff — `canFinalize` is false until all four are ticked
(`T-03 §5`). Three of them record that data was *synced to Photon for screening*; the fourth
records that a *clinician confirmed something with the patient*. The design distinguishes them by
color: synced checks fill green, the clinician-judgment check fills amber.

The meta line under each row names the API call that produced it, and one of them says, in as many
words, `no screening performed here`. That is the app refusing to take credit for something Photon
does. `V2-PRD.md` (2026-08-25 design feedback) calls this out explicitly: *"avoid overclaiming
safety screening if the API only synced data."* Do not soften this copy.

---

## Files

- `app/visit/components/SafetyReviewCard.tsx` — `'use client'` (toggle handlers)
- `app/visit/demoData.ts` — append the `SAFETY_CHECKS` constant below

---

## Props

```tsx
type SafetyReviewCardProps = {
  checks: SafetyChecks;                    // T-03 types
  onToggle: (key: SafetyCheckKey) => void;
  allChecked: boolean;                     // derived
  syncedCount: number;                     // derived, 0..3
};
```

---

## Fixture (append to `demoData.ts`)

Order matters — this is the display order, and it is **not** the key order in the `SafetyChecks`
type. Drive rendering from this array.

```ts
export const SAFETY_CHECKS = [
  {
    key: "allergy",
    text: "Allergy record synced for Photon screening",
    meta: "GET /allergies · 1 record (sulfa) · no screening performed here",
  },
  {
    key: "interaction",
    text: "Medication history synced for Photon screening",
    meta: "GET /medication_history · 1 record (prenatal vitamin)",
  },
  {
    key: "dose",
    text: "Strength, quantity and duration verified",
    meta: "2.5% · 30 g · 7 days · 0 refills",
  },
  {
    key: "lactation",
    text: "Lactation guidance confirmed with patient",
    meta: "Clinician-confirmed — not an AI or API determination",
  },
] as const satisfies readonly { key: SafetyCheckKey; text: string; meta: string }[];
```

---

## Structure

```
<Card>
  <CardHeader title="Safety review">
    <Badge tone={badgeTone}>{badgeLabel}</Badge>
  </CardHeader>
  <div class="px-[14px] pt-[6px] pb-3">
    … 4 rows …
  </div>
</Card>
```

Body padding is `6px 14px 12px` — the top is tight because each row carries its own `9px` of
vertical padding.

---

## 1. Row

```
<button? / div role=…>  flex gap-[10px] items-start py-[9px] border-b border-line-row cursor-pointer
  <Checkbox />
  <div class="flex-1">
    <div class={textClasses}>{text}</div>
    <div class="text-[11px] text-muted-2 mt-px">{meta}</div>
  </div>
</…>
```

Every row has `border-b border-line-row` (`#F2F4F8`) — **including the last one**. The mockup does
this and it reads fine because the card's own bottom padding follows it.

### Text classes, by checked state

| state | classes |
|---|---|
| unchecked | `text-[12.5px] font-semibold text-ink leading-[1.4]` |
| checked | `text-[12.5px] font-medium text-ink-3 leading-[1.4]` |

Checking a row makes it **lighter**, not heavier — done items recede. This inversion is easy to get
backwards; verify it.

### Markup and accessibility

The mockup puts `onClick` on a `<div>`. Don't. Use a real control so the checklist is keyboard
operable and announces state:

```tsx
<label className="flex gap-[10px] items-start py-[9px] border-b border-line-row cursor-pointer">
  <input type="checkbox" className="sr-only peer" checked={on} onChange={() => onToggle(key)} />
  <span className={boxClasses} aria-hidden="true">{on ? "✓" : ""}</span>
  <span className="flex-1">…</span>
</label>
```

The visually-hidden real checkbox plus a styled `<span>` gives correct semantics and keeps the
design exactly. Add a visible focus treatment driven off the peer:
`peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30` on the box.

---

## 2. Checkbox box

```
w-[17px] h-[17px] rounded-[4px] shrink-0 mt-px
flex items-center justify-center
text-[11px] font-bold text-white
border-[1.5px]
```

| state | background | border |
|---|---|---|
| unchecked | `bg-surface` | `border-line-strongest` (`#C9CEDA`) |
| checked, normal | `bg-ok` | `border-ok` (`#0E8A5A`) |
| checked, `lactation` | `bg-warn` | `border-warn` (`#E8B44A`) |

The mark is the character `✓` (U+2713), white, 11px/700. `border-[1.5px]` is a real 1.5px — do not
round to 1 or 2.

Only the `lactation` row uses amber. The rule in the mockup is literally `warn = c.k === 'lactation'`.
Keep it keyed to that one row rather than inventing a `tone` field in the fixture — the fixture
describes content, and this is a rendering rule about what kind of assertion the row makes.

---

## 3. Header badge

```ts
const badgeLabel = allChecked
  ? "3 synced · 1 clinician-reviewed"
  : `${syncedCount} synced · ${checks.lactation ? 1 : 0} clinician-reviewed`;
const badgeTone = allChecked ? "success" : "warn";
```

So at boot (nothing checked) it reads `0 synced · 0 clinician-reviewed` in amber, and fully checked
it reads `3 synced · 1 clinician-reviewed` in green. The counts split 3/1 exactly along the
green/amber line above.

---

## Acceptance criteria

- [ ] Four rows in the fixture's order: allergy, interaction, dose, lactation.
- [ ] Clicking anywhere on a row toggles it; `Space` toggles the focused row; `Tab` reaches all four.
- [ ] Checked rows are `font-medium #3A3F4C`; unchecked are `font-semibold #1A1D24`.
- [ ] Rows 1–3 fill green when checked; row 4 fills amber.
- [ ] Unchecked box is white with a 1.5px `#C9CEDA` border and no glyph.
- [ ] Badge reads `0 synced · 0 clinician-reviewed` (amber) at boot.
- [ ] Checking only `lactation` gives `0 synced · 1 clinician-reviewed`.
- [ ] Checking all four gives `3 synced · 1 clinician-reviewed` (green).
- [ ] Row 1's meta line ends with `· no screening performed here`.
- [ ] Row 4's meta line reads `Clinician-confirmed — not an AI or API determination` (em dash).
- [ ] With all four checked, `reviewed` true, and phase `review`, the action bar's Finalize button
      becomes fully opaque (cross-check with `T-16`).
- [ ] Screen reader announces each row's checked state.
- [ ] No hex literal in the file.

## Out of scope

Real screening results, interaction warnings, or anything that reports a *finding*. These rows
record that data moved and that a human confirmed — nothing more. Adding a "no interactions found"
row would be the exact overclaim the design is avoiding.
