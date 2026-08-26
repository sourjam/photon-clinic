# T-10 — Clinician review card

**Phase:** Left column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

One card, three states, and the whole "AI drafts, a human signs" claim rests on it. It is the only
card whose **background** changes color — white when there's nothing to review, amber when review is
outstanding, green once signed. That makes it findable in peripheral vision while the clinician
works elsewhere on the page.

The sign-off it records is what flips the Spanish-instructions badge from `needs review` to
`reviewed` (`T-07 §1`) and unlocks `canFinalize` (`T-03 §5`).

---

## File

`app/visit/components/ClinicianReviewCard.tsx` — `'use client'`.

---

## Props

```tsx
type ClinicianReviewCardProps = {
  canReview: boolean;   // derived.canReview === hasInstructions
  reviewed: boolean;
  onToggleReviewed: () => void;
  reviewerName: string; // REVIEWER.name  "Dr. A. Okafor"
  reviewerTime: string; // REVIEWER.time  "10:42"
};
```

---

## Structure

```
<Card tone={cardTone} className="px-[14px] py-[13px]">
  <div class="flex items-start gap-[11px]">
    <div class={iconClasses}>{icon}</div>
    <div class="flex-1">
      <div class="text-[12.5px] font-bold" style-color={titleColor}>{title}</div>
      <div class="text-[12px] leading-[1.5] text-ink-6 mt-[3px]">{body}</div>
    </div>
    {canReview && <Button …>{buttonLabel}</Button>}
  </div>
</Card>
```

This card has **no `CardHeader`** — it is a single padded block. Padding `13px 14px`.

---

## The three states

Determined by `canReview` then `reviewed`:

### A. `!canReview` — nothing generated yet

| property | value |
|---|---|
| Card tone | `plain` (`bg-surface`, `border-line`) |
| Icon glyph | `–` (U+2013 EN DASH, not a hyphen) |
| Icon bg | `bg-line-strongest` (`#C9CEDA`) |
| Title | `Clinician review pending` |
| Title color | `text-ink-6` (`#5A6072`) |
| Body | `Generate the Spanish instructions before reviewing.` |
| Button | **not rendered** |

### B. `canReview && !reviewed` — review outstanding

| property | value |
|---|---|
| Card tone | `warn` (`bg-warn-bg-2` `#FFFCF5`, `border-warn-line` `#EBD9B4`) |
| Icon glyph | `!` |
| Icon bg | `bg-warn` (`#E8B44A`) |
| Title | `Clinician review required` |
| Title color | `text-warn-ink` (`#8A6510`) |
| Body | `AI output is not patient-ready until you confirm the wording, the lactation guidance and the medication prep.` |
| Button | `<Button variant="primary" size="sm">Mark reviewed</Button>` |

### C. `canReview && reviewed` — signed

| property | value |
|---|---|
| Card tone | `ok` (`bg-ok-bg-2` `#F4FBF7`, `border-ok-line` `#BFE3CF`) |
| Icon glyph | `✓` (U+2713) |
| Icon bg | `bg-ok` (`#0E8A5A`) |
| Title | `Reviewed by clinician` |
| Title color | `text-ok-ink` (`#0B6B47`) |
| Body | `Dr. A. Okafor confirmed the Spanish instructions, medication prep and safety checks at 10:42.` |
| Button | `<Button variant="successGhost" size="sm">Reviewed ✓</Button>` |

State C's body is built from props: `` `${reviewerName} confirmed the Spanish instructions, medication prep and safety checks at ${reviewerTime}.` ``

Note the body text color is `text-ink-6` (`#5A6072`) in **all three** states — only the title
changes color. Easy to over-apply the tone.

---

## Icon

```
w-5 h-5 rounded-full text-white text-[11px] font-bold shrink-0 mt-px
flex items-center justify-center
```

Three glyphs, three backgrounds, per the tables above. `aria-hidden="true"` — the title text
already says what the icon says.

---

## Button behavior

`onToggleReviewed` is the workflow action from `T-03 §4`. Two things it does that are easy to miss:

1. **It toggles.** Clicking `Reviewed ✓` un-reviews, sets `finalized=false`, and moves the phase
   back to `review`. A clinician who signed by mistake must be able to unsign, and unsigning must
   invalidate a completed handoff.
2. **It guards.** If `hasInstructions` is false it toasts `Generate instructions first` instead of
   changing state — a defense in depth, since this card also hides the button in that case.

The `successGhost` variant (`bg-ok-bg text-ok-ink border-ok-line`) is defined in `T-02 §4`.

---

## Acceptance criteria

- [ ] At `idle` and `loading`: white card, en-dash icon on grey, no button.
- [ ] At `review` with `reviewed=false`: amber card, `!` on amber, blue `Mark reviewed` button.
- [ ] Click → green card, `✓` on green, `Reviewed ✓` in the green ghost style, body naming
      `Dr. A. Okafor` and `10:42`.
- [ ] Click again → back to amber, and the Spanish-instructions badge (`T-07`) reverts to
      `AI generated · needs review`.
- [ ] Un-reviewing from `final` leaves phase `review` and `finalized=false` — the header pill
      (`T-04`) drops from green back to amber.
- [ ] At `apiError`: card is amber with the button visible (`canReview` is true there —
      `T-03 §5`), and reviewing it still does **not** unlock Finalize.
- [ ] Body text is `#5A6072` in all three states.
- [ ] Icon glyph in state A is `–` (U+2013), not `-`.
- [ ] Button keyboard-focusable with a visible ring.
- [ ] No hex literal in the file.

## Out of scope

Any real identity or auth — `Dr. A. Okafor` and `10:42` are demo constants. A real signature would
need a signed-in user and a server timestamp; that is beyond V2 and would make the demo depend on
auth infrastructure the interview does not need.
