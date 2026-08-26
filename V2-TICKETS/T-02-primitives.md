# T-02 — UI primitives: Card, CardHeader, Badge, Button, FieldLabel, SectionHeader, Spinner

**Phase:** Foundation · **Depends on:** T-01 · **Blocks:** T-04 … T-17
**Read first:** `T-00-design-reference.md`

---

## Context

The V2 mockup repeats seven visual patterns across ~20 places. In the prototype they are inline
style objects duplicated by hand; several drifted (two error cards use `#F2C9C4` and the badge
`#F0C4BF` for the same conceptual border). This ticket extracts them once, correctly, so no other
ticket writes a border-radius or a badge palette again.

These are the only primitives. Do not add a `Stack`, a `Text`, an `Icon` set, or a component
library. The design has seven shapes; build seven components.

---

## Files you create

```
app/visit/components/ui/Card.tsx
app/visit/components/ui/CardHeader.tsx
app/visit/components/ui/Badge.tsx
app/visit/components/ui/Button.tsx
app/visit/components/ui/FieldLabel.tsx
app/visit/components/ui/SectionHeader.tsx
app/visit/components/ui/Spinner.tsx
```

All are **server components** (no `'use client'`) except `Button`, which takes an `onClick`.
Actually: keep `Button` a plain component too — it renders a `<button>` and forwards props; the
`'use client'` boundary is owned by whichever card passes the handler. Do not add the directive
to any file in `ui/`.

---

## 1. `Card`

```tsx
type CardProps = {
  children: React.ReactNode;
  /** Tone changes bg + border. Default 'plain' = white card on the default line color. */
  tone?: "plain" | "ok" | "warn" | "err";
  className?: string;
};
```

| tone | background | border |
|---|---|---|
| `plain` | `bg-surface` | `border-line` (`#E1E5EE`) |
| `ok` | `bg-ok-bg-2` (`#F4FBF7`) | `border-ok-line` (`#BFE3CF`) |
| `warn` | `bg-warn-bg-2` (`#FFFCF5`) | `border-warn-line` (`#EBD9B4`) |
| `err` | `bg-err-bg-2` (`#FEF4F3`) | `border-err-line-2` (`#F2C9C4`) |

Always: `border rounded-[9px]`. **No shadow, no padding.** Padding belongs to the card's body,
because some cards (patient context, milestones) have edge-to-edge internal rows and must not be
inset by the container.

`className` merges last so a card can add `overflow-hidden` when its first child has a background
that would otherwise square off the corner radius.

---

## 2. `CardHeader`

```tsx
type CardHeaderProps = {
  title: string;
  /** Right slot: a plain meta string, or a <Badge/>. */
  meta?: string;
  children?: React.ReactNode;   // right slot when it's a node, not a string
};
```

Renders:

```
div: flex items-center justify-between gap-[10px] px-[14px] py-[10px] border-b border-line-soft
  div: text-[12.5px] font-bold text-ink        ← title
  meta ? span: text-[11px] text-muted-2 : children
```

`font-bold` is 700, which is what the mockup uses. When neither `meta` nor `children` is given, the
header is still `justify-between` — harmless, and matches the two cards ("Patient context",
"Sync milestones") that have a title-only header with **no** `justify-between` in the source. To
match those exactly, when there is no right slot render the header as a plain block:
`px-[14px] py-[10px] border-b border-line-soft text-[12.5px] font-bold`. Branch on it.

---

## 3. `Badge`

```tsx
type BadgeProps = {
  tone: "neutral" | "info" | "success" | "warn" | "error";
  children: React.ReactNode;
};
```

Base classes, identical for every tone:

```
inline-block text-[10.5px] font-bold tracking-[.02em] px-[9px] py-[3px] rounded-[12px]
whitespace-nowrap border
```

Tone map:

| tone | classes |
|---|---|
| `neutral` | `bg-surface-muted border-line text-muted-2` |
| `info` | `bg-brand-bg border-brand-line text-brand-ink-2` |
| `success` | `bg-ok-bg border-ok-line text-ok-ink` |
| `warn` | `bg-warn-bg border-warn-line text-warn-ink` |
| `error` | `bg-err-bg border-err-line text-err-ink` |

Define the tone map as a `const` record keyed by tone — do not build class strings by
concatenation, Tailwind's scanner cannot see those.

Every badge in the app goes through this component. There are ~10: overall status pill is **not**
one of them (it has a dot and a different shape — see `T-04`).

---

## 4. `Button`

```tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "success" | "danger" | "dangerGhost";
  size?: "md" | "sm";
  /** Renders at 45% opacity but stays clickable — see §4.1. */
  dimmed?: boolean;
};
```

Base: `inline-flex items-center gap-2 rounded-[7px] font-semibold border`
(`font-semibold` = 600; variants that have no border use `border-transparent`).

| variant | classes |
|---|---|
| `primary` | `bg-brand text-white border-transparent` |
| `ghost` | `bg-surface text-ink-4 border-line-strong` |
| `success` | `bg-ok text-white border-transparent` |
| `danger` | `bg-err text-white border-transparent` |
| `dangerGhost` | `bg-surface text-err-ink-2 border-err-line-3` |

| size | primary/success/danger/dangerGhost | ghost |
|---|---|---|
| `md` | `px-4 py-[9px] text-[12.5px]` | `px-[14px] py-[9px] text-[12.5px]` |
| `sm` | `px-[13px] py-[7px] text-[12px]` | `px-3 py-[6px] text-[12px]` |

(`px-4` = 16px, `px-3` = 12px — these match the mockup's `9px 16px` and `6px 12px`.)

`dimmed` adds `opacity-45`.

One special case that does **not** fit the variant table — the "Reviewed ✓" state of the review
button (`T-10`) and the finalized action-bar button (`T-16`) use a *success-tinted ghost*:
`bg-ok-bg text-ok-ink border-ok-line`. Add it as variant `successGhost`.

### 4.1 Why `dimmed` and not `disabled`

The mockup renders blocked primary actions at `opacity: 0.45` but leaves them clickable; clicking
fires a toast naming the missing precondition ("Mark the AI output reviewed first"). That is a
deliberate, better pattern than a dead button — the user learns why. Preserve it.

Consequence for accessibility: a dimmed button must **not** get `disabled` or `aria-disabled`,
because it does respond. Instead the blocked reason should reach assistive tech through the toast,
which `T-16` renders in an `aria-live="polite"` region.

---

## 5. `FieldLabel`

```tsx
type FieldLabelProps = { children: React.ReactNode; tone?: "default" | "warn" };
```

```
text-[10px] font-semibold tracking-[.06em] uppercase mb-[3px]
tone default → text-muted-3      (#9096A6)
tone warn    → text-warn-ink-2   (#9A6A00)
```

Renders a `<div>`, not a `<label>` — these label static values, not form controls. The two real
form controls (`T-06`, `T-11`) use `<label htmlFor>` with the same classes; pass `as="label"` if
you prefer one component, or just repeat the four classes there. Either is fine; be consistent.

---

## 6. `SectionHeader`

```tsx
type SectionHeaderProps = { title: string; meta: string };
```

```
div: flex items-center gap-[9px] mb-1
  h2:   m-0 text-[12px] font-bold tracking-[.08em] uppercase text-ink-5
  div:  flex-1 h-px bg-line
  span: text-[11px] text-muted-2
```

Used exactly twice:

| title | meta |
|---|---|
| `AI Prep` | `OpenAI · clinician-reviewed` |
| `Photon API` | `Clinical API · no Elements` |

The `·` is U+00B7 MIDDLE DOT, not a hyphen or bullet. It appears ~30 times across the app.

---

## 7. `Spinner`

```tsx
type SpinnerProps = { variant: "onBrand" | "milestone" };
```

| variant | classes |
|---|---|
| `onBrand` | `inline-block w-3 h-3 rounded-full border-2 border-white/35 border-t-white animate-spin-fast` |
| `milestone` | `w-[18px] h-[18px] rounded-full bg-surface border-2 border-brand-line border-t-brand animate-spin-fast shrink-0` |

`onBrand` sits inside the blue "Generating…" button (12px). `milestone` replaces the status dot in
the sync-milestone list (18px) and must keep the same footprint as the other dots so rows don't
jump. `animate-spin-fast` is the `.7s` utility from `T-01 §4` — **not** Tailwind's built-in
`animate-spin` (1s, wrong tempo against the 1400ms simulated latency).

Add `role="status"` and `<span className="sr-only">Loading</span>`? No — these spinners always sit
next to a visible text label that already announces the state. Adding a second announcement is
noise. Give them `aria-hidden="true"`.

---

## Acceptance criteria

- [ ] `npm run build` passes.
- [ ] A scratch page rendering all 5 badge tones side by side matches the hex table in `T-00 §5.2`
      when sampled with a color picker.
- [ ] All 6 button variants × 2 sizes render; measured heights are 33px (`md`) and 28px (`sm`)
      at the stated font sizes. Tolerance ±1px.
- [ ] `Card` with each of the 4 tones renders the right bg/border pair.
- [ ] No component in `ui/` has `'use client'`.
- [ ] No hex literal in any file.
- [ ] Tone→class maps are static object literals (grep for template literals building class
      names — there should be none).

## Out of scope

Any component that knows about the visit domain. If it takes a `phase`, a patient, or a milestone,
it is not a primitive — it belongs to its own ticket.
