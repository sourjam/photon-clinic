# T-06 — Clinician note composer

**Phase:** Left column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

The English clinician note is the input to the whole workflow — everything downstream (the Spanish
instructions, the medication prep, the handoff) derives from it. The card is a labeled textarea and
one blue button, with a standing disclaimer that the AI output requires review.

The card header's right slot says `English · source of truth`. That phrase is doing real work: it
tells the clinician which of the two languages on screen is the one they are accountable for.

---

## File

`app/visit/components/ClinicianNoteCard.tsx` — `'use client'` (owns a change handler).

---

## Props

```tsx
type ClinicianNoteCardProps = {
  note: string;
  onNoteChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;        // derived.isLoading
  hasInstructions: boolean;  // derived.hasInstructions
};
```

---

## Structure

```
<Card>
  <CardHeader title="Clinician note" meta="English · source of truth" />
  <div class="px-[14px] py-3">
    <textarea … />
    <div class="flex items-center gap-[10px] flex-wrap mt-[10px]">
      <Button … />
      <span class="text-[11.5px] text-muted-2">{hint}</span>
    </div>
  </div>
</Card>
```

Body padding is `12px 14px`.

---

## 1. Textarea

```
w-full border border-line-input rounded-[7px] bg-surface-sunken
px-3 py-[11px] min-h-[82px]
text-[13px] leading-[1.55] text-ink-2
resize-y outline-none
```

- `placeholder="Enter visit notes in English…"` (U+2026 ellipsis, not three periods)
- Placeholder color comes from the global rule in `T-01 §3` (`#A6ABBA`) — do not set it here.
- `resize-y` (the mockup's `resize: vertical`). Not `resize-none`, not `resize`.
- Controlled: `value={note}` + `onChange={e => onNoteChange(e.target.value)}`.

`outline-none` removes the focus ring, which the mockup does and which is an accessibility
regression. **Add a focus ring back:** `focus:border-brand focus:ring-2 focus:ring-brand/15`.
This is visually quiet — a 1px border tint plus a soft halo, consistent with the design's
restraint — and it makes keyboard use possible. Apply the same treatment to the two textareas in
`T-11`.

Label the control: `<label htmlFor="clinician-note" class="sr-only">Clinician note, English</label>`,
or point `aria-labelledby` at the card header's title node. The visible "Clinician note" heading is
the accessible name either way; do not leave the textarea unlabeled.

---

## 2. Generate button

`<Button variant="primary" size="md" onClick={onGenerate}>`, containing a `<Spinner variant="onBrand" />`
**only when `isLoading`**, then the label.

Label:

| condition | label |
|---|---|
| `isLoading` | `Generating…` |
| `hasInstructions` | `Regenerate Spanish instructions` |
| otherwise | `Generate Spanish instructions` |

Order matters — check `isLoading` first.

The button gets `opacity-80` while loading (the mockup's `opacity: isLoading ? 0.8 : 1`). Use the
`dimmed` prop? No — `dimmed` is 45% and means "blocked". Add `className={isLoading ? "opacity-80" : ""}`.
These are different signals and must not collapse into one.

The button stays clickable while loading. `onGenerate` clears the pending timer and restarts
(`T-03 §4`), so a double-click is harmless.

---

## 3. Hint text

```
text-[11.5px] text-muted-2
```

| condition | text |
|---|---|
| `isLoading` | `OpenAI · gpt-4o-mini` |
| otherwise | `Output is drafted by AI and must be clinician-reviewed` |

The swap is a nice touch worth preserving: at rest the hint states the policy; in flight it names
the model doing the work, which is exactly what an interviewer wants to see.

---

## Acceptance criteria

- [ ] Textarea is pre-filled with `CLINICIAN_NOTE` at boot and is editable.
- [ ] Textarea min-height is 82px and drags taller but not shorter than 82px, and not wider.
- [ ] Focus shows a visible ring; tabbing from the textarea reaches the Generate button.
- [ ] At `idle`: button reads `Generate Spanish instructions`, hint reads the policy line.
- [ ] Click → button reads `Generating…` with a spinning 12px ring, hint reads `OpenAI · gpt-4o-mini`,
      button at 80% opacity.
- [ ] After 1400ms → button reads `Regenerate Spanish instructions`, hint back to the policy line.
- [ ] At `apiError` the button reads `Regenerate…` (because `hasInstructions` is true there — see
      `T-03 §5`).
- [ ] Header right slot reads `English · source of truth` at 11px `#8A90A0`.
- [ ] Spinner rotates at 0.7s, and is static under `prefers-reduced-motion: reduce`.
- [ ] No hex literal in the file.

## Out of scope

Rendering the generated instructions (`T-07`), the AI failure card (`T-15`), and any real model
call (`T-19`). This card's only job is to hold the note and fire `onGenerate`.
