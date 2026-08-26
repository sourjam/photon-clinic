# T-15 — Error states: AI generation failure and Photon lookup failure

**Phase:** Cross-cutting · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

Two failure cards, one per column, each appearing only in its own phase. They are the most
carefully written copy in the design, because each one answers three questions in three lines:
*what failed, what that did to the other system, and what you can do about it.*

The AI card says `The note was not sent to Photon` — blast radius.
The Photon card says `Patient and safety sync succeeded` — what survived.

Neither card apologizes, neither says "Oops", neither uses an emoji. Match that register.

---

## Files

- `app/visit/components/AiErrorCard.tsx` — `'use client'`
- `app/visit/components/PhotonErrorCard.tsx` — `'use client'`

Each is rendered conditionally by `VisitWorkspace`:
`{isAiError && <AiErrorCard … />}` in the left column (position 4, between the note composer and
the Spanish instructions), `{isApiError && <PhotonErrorCard … />}` in the right column (position 4,
between the milestones and the handoff card).

---

## Shared shape

Both cards:

```
<Card tone="err" className="px-[14px] py-[13px]">
  <div class="flex gap-[10-11px] items-start">
    <ErrorIcon />
    <div class="flex-1"> … </div>
  </div>
</Card>
```

Card tone `err` = `bg-err-bg-2` (`#FEF4F3`), `border-err-line-2` (`#F2C9C4`).

### Error icon (identical in both)

```
w-5 h-5 rounded-full bg-err text-white text-[12px] font-bold shrink-0
flex items-center justify-center
```
Glyph: `!`. `aria-hidden="true"` — the title says it.

Gap is `11px` in the AI card and `10px` in the Photon card. Yes, they differ by 1px in the source.
Keep them as-is rather than "harmonizing"; these are the values that were designed against.

---

## Part A — `AiErrorCard`

### Props

```tsx
type AiErrorCardProps = { onRetry: () => void; onWriteManually: () => void };
```

### Content

```
div: text-[12.5px] font-bold text-err-ink
```
> `Instruction generation failed`

```
div: text-[12px] text-err-ink-2 mt-[3px] leading-[1.5]
```
> `OpenAI request timed out. The note was not sent to Photon. Retry, or write the Spanish instructions manually.`

```
div: flex gap-2 mt-[10px]
  <Button variant="danger" size="sm" onClick={onRetry}>Retry generation</Button>
  <Button variant="dangerGhost" size="sm" onClick={onWriteManually}>Write manually</Button>
```

`onRetry` is the same `generate()` action from `T-03 §4` — it goes to `loading`, then `review`
after 1400ms. `onWriteManually` is `manualEntry()`: straight to `review`, toast
`Switched to manual entry`.

Three sentences, three jobs: what broke, what it didn't break, what to do. The middle sentence is
the one that matters — it tells the clinician no partial state exists in Photon, which is why
`T-12` shows all five milestones pending at `aiError`. **These two must stay consistent.**

`Write manually` is a real escape hatch, not a decoration: it drops the clinician into the reviewed
flow without AI output, and the demo continues. (In V2 the panel then shows the fixture text —
`hasInstructions` becomes true. A production build would open an editor. Note this gap; don't
build the editor.)

---

## Part B — `PhotonErrorCard`

### Props

```tsx
type PhotonErrorCardProps = { onRetry: () => void };
```

### Content

```
div: text-[12.5px] font-bold text-err-ink
```
> `Treatment lookup failed`

```
div: font-mono text-[11px] text-err-ink-2 mt-[3px]
```
> `503 · GET /catalog/treatments`

```
div: text-[12px] text-err-ink-2 mt-[5px] leading-[1.5]
```
> `Patient and safety sync succeeded. Handoff is blocked until the treatment resolves.`

```
<Button variant="danger" size="sm" onClick={onRetry} class="mt-[10px]">Retry lookup</Button>
```

One button, not two — there is no manual path around a missing treatment ID.

The mono line naming the exact endpoint and status is what makes this credible to a technical
reviewer. It matches the `503` row in the evidence log (`T-14 §3`) and the
`503 · retry available` id on milestone row 3 (`T-12 §3`). **Three places, one failure, consistent
detail.**

`onRetry` is `retryApi()` from `T-03 §4`: phase → `review`, toast
`Treatment lookup succeeded · med_8f21c94a`. The demo always recovers on retry — acceptable for a
scripted demo, and the toast naming the resolved ID is a nice beat.

---

## Announcing errors

Both cards should announce when they appear. Give each `role="alert"` on the outer `<Card>`. That
is appropriate here — an unexpected failure that blocks the workflow is exactly what `alert` is
for, and each card appears at most once per phase transition.

Do not also put the error in the toast; that would double-announce.

---

## Acceptance criteria

- [ ] `AiErrorCard` renders only at `aiError`; `PhotonErrorCard` only at `apiError`.
- [ ] Both use `#FEF4F3` on `#F2C9C4` with a 20px solid `#C5352A` circle containing a white `!`.
- [ ] AI card: two buttons — solid red `Retry generation`, white/red-bordered `Write manually`.
- [ ] Photon card: one solid red `Retry lookup`.
- [ ] `Retry generation` → `loading` → `review` after 1400ms.
- [ ] `Write manually` → `review` immediately with the `Switched to manual entry` toast.
- [ ] `Retry lookup` → `review` with the `Treatment lookup succeeded · med_8f21c94a` toast.
- [ ] At `aiError`, all five milestones read `pending` (cross-check `T-12`) and the log has exactly
      2 rows ending in a red `504` (cross-check `T-14`).
- [ ] At `apiError`, the Spanish instructions panel still shows content (cross-check `T-07`), the
      handoff card reads `Blocked` (cross-check `T-13`), and milestone 3 shows
      `503 · retry available` (cross-check `T-12`).
- [ ] Both copy blocks match character-for-character, including `·` and the sentence order.
- [ ] `role="alert"` on both cards.
- [ ] No hex literal in either file.

## Out of scope

A generic `<ErrorCard>` abstraction — there are two, they differ in structure (two buttons vs. one,
mono endpoint line vs. none), and unifying them costs more than it saves. Also out of scope: retry
backoff, error boundaries, and network-level error handling, all of which arrive with `T-19`.
