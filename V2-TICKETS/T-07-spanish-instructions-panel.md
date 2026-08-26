# T-07 — Spanish patient instructions panel (idle / loading / content)

**Phase:** Left column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

This is the payoff of the AI half of the demo: the clinician's English note, rendered as Spanish a
patient can actually follow. It is also the card with the most states — empty, skeleton, and
content — and the one whose badge tells the reviewer, at a glance, whether a human has signed off.

The Spanish copy is not machine-literal translation; it is patient-facing counseling written at a
plain reading level. Treat every character of it as final copy.

---

## File

`app/visit/components/SpanishInstructionsCard.tsx` — `'use client'` (handlers).

---

## Props

```tsx
type SpanishInstructionsCardProps = {
  isIdle: boolean;
  isLoading: boolean;
  isAiError: boolean;
  hasInstructions: boolean;
  reviewed: boolean;
  onRegenerate: () => void;
  onCopy: () => void;
};
```

---

## Structure

```
<Card>
  <CardHeader title="Spanish patient instructions">
    <Badge tone={badgeTone}>{badgeLabel}</Badge>
  </CardHeader>

  {isIdle        && <EmptyState />}
  {isLoading     && <Skeleton />}
  {hasInstructions && <Content />}
</Card>
```

The three are mutually exclusive given the phase model, so plain conditionals are fine — no
`switch`, no state-machine component. Note `isAiError` renders **none** of the three: the card shows
only its header with a red `Failed` badge, and the error detail lives in the separate `AiErrorCard`
(`T-15`) that sits above this one.

---

## 1. Badge (header right slot)

Evaluate in this exact order:

| # | condition | label | tone |
|---|---|---|---|
| 1 | `isLoading` | `Generating…` | `info` |
| 2 | `isAiError` | `Failed` | `error` |
| 3 | `hasInstructions && reviewed` | `AI generated · reviewed` | `success` |
| 4 | `hasInstructions` | `AI generated · needs review` | `warn` |
| 5 | else | `Not generated` | `neutral` |

Rows 3 and 4 are the heart of the product's honesty claim: the same AI output reads amber until a
clinician has confirmed it, then green. Do not collapse them.

---

## 2. Empty state (`isIdle`)

```
div: px-4 py-[26px] text-center text-[12.5px] text-muted-3
```
> `Instructions appear here once generated from the clinician note.`

---

## 3. Skeleton (`isLoading`)

```
div: px-[14px] py-4 flex flex-col gap-[9px]
  div × 3: h-[11px] rounded-[4px] bg-surface-skeleton animate-pulse-soft
           widths: w-[82%] · w-[94%] · w-[71%]
           delays: none · [animation-delay:.15s] · [animation-delay:.3s]
  div: text-[11.5px] text-muted-2 mt-1
```
> `Generating patient-friendly Spanish from the clinician note…`

The three widths are uneven on purpose — equal bars read as a loading widget, uneven ones read as
text arriving. The stagger is 150ms.

Mark the skeleton container `aria-hidden="true"` and put the status line in a
`role="status"` element so a screen reader hears the sentence once, not three phantom bars.

---

## 4. Content (`hasInstructions`)

```
div: p-[14px] flex flex-col gap-[11px]
  <InnerPanel />
  <FooterRow />
```

### 4.1 Inner panel

```
bg-brand-bg-2 border border-brand-line-2 rounded-[8px] px-[15px] py-[14px]
```

Wrap the whole panel in `lang="es"` — the document is `lang="en"` (`T-01 §1`) and this is the one
place where a screen reader must switch voices. This matters more than usual for a bilingual
clinical tool.

**Heading**

```
text-[13px] font-bold text-brand-ink mb-2
```
> `Crema de hidrocortisona 2.5% — cómo usarla`

(Em dash U+2014. Note this heading is *not* identical to the first line of
`SPANISH_INSTRUCTIONS_PLAIN` in `demoData.ts`, which omits `— cómo usarla`. Both are correct: the
panel has a title, the clipboard version does not. Keep them separate rather than deriving one from
the other.)

**Body**

```
text-[13px] leading-[1.65] text-ink-2 flex flex-col gap-2
```

Five blocks, in order:

1. > Lo que vemos parece un brote de eczema en los antebrazos. La piel está irritada, pero se controla bien con cuidado diario.

2. > Aplique una capa fina de la crema en las zonas afectadas **dos veces al día, por 7 días**. Luego deténgase. No la use en la cara ni cerca de los ojos.

   The bolded span is a real `<strong>`. Dose and duration are bolded because they are the two facts
   patients get wrong.

3. > Use jabón y crema humectante sin fragancia todos los días, incluso cuando la piel esté mejor.

4. **Lactation callout** — this one is styled:

   ```
   bg-warn-bg border-l-[3px] border-warn px-[11px] py-[9px] rounded-[0_6px_6px_0] text-warn-ink-4
   ```
   > Sobre la lactancia: este tipo de crema se usa habitualmente durante la lactancia, pero **su médico debe confirmarlo con usted antes de empezar**. No la aplique en el pecho.

   `<strong>` on `su médico debe confirmarlo con usted antes de empezar`. The asymmetric radius
   (square left, 6px right) is what makes the amber bar read as a margin rule rather than a chip.

   This callout is the single most important piece of copy in the app: it is where the AI declines
   to answer a medical question and routes it to the clinician. Do not reword, do not soften, do
   not let it lose the amber bar.

5. > Llame a la clínica si la piel empeora, aparece pus o fiebre, o si no mejora en 2 semanas.

### 4.2 Footer row

```
flex items-center gap-[9px] flex-wrap
  span: text-[11px] text-muted-2   → "Reading level: plain Spanish · tone: respectful"
  div:  flex-1
  <Button variant="ghost" size="sm" onClick={onRegenerate}>Regenerate</Button>
  <Button variant="ghost" size="sm" onClick={onCopy}>Copy</Button>
```

`onCopy` here is the same handler the action bar uses (`T-16`) — writes
`SPANISH_INSTRUCTIONS_PLAIN` to the clipboard and toasts
`Spanish instructions copied to clipboard`. Pass one function down to both call sites; do not
implement clipboard logic twice.

---

## Acceptance criteria

- [ ] All five badge rows reachable and correct: switch through `idle → loading → review → final`
      and `aiError`, and toggle `reviewed` in `review`.
- [ ] At `apiError` the panel shows **content**, not the empty state (`hasInstructions` is true
      there — `T-03 §5`). Its badge reads `AI generated · needs review`.
- [ ] At `aiError` the card body is empty and the badge reads `Failed`.
- [ ] Skeleton bars pulse at 1.3s with 0 / .15s / .3s offsets and are static under
      `prefers-reduced-motion`.
- [ ] Every accented character renders correctly: `está`, `día`, `deténgase`, `jabón`, `médico`,
      `clínica`, `así`. Copy-paste from this ticket; do not retype.
- [ ] `lang="es"` is on the inner panel and nowhere higher.
- [ ] Two `<strong>` elements exist in the content: the dose phrase and the clinician-confirmation
      phrase.
- [ ] Lactation callout has a 3px `#E8B44A` left border and a `0 6px 6px 0` radius.
- [ ] `Copy` writes the plain-text version (with a blank line between paragraphs and **no**
      `— cómo usarla` in the first line) and fires the toast.
- [ ] No hex literal in the file.

## Out of scope

The AI error card (`T-15`), the review sign-off card (`T-10`), and generating this text from a real
model (`T-19`). This card renders fixed copy — that is correct for now, and `T-19` swaps the source
without touching the layout.
