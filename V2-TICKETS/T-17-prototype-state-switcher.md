# T-17 — Prototype state switcher (dev chrome, not product UI)

**Phase:** Dev chrome · **Depends on:** T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

A dark strip above the app with six buttons that jump straight to any phase. It exists so the demo
can be driven to any state in one click during an interview, and so QA can check all six without
replaying the workflow.

`V2-PRD.md` (2026-08-25 design feedback) requires it stay **outside product UI**. The design does
this with an unmissable dark bar and a mono label reading `Prototype control · not product UI`.
That styling is the feature — it must be impossible to mistake for part of the app.

---

## File

`app/visit/components/PrototypeSwitcher.tsx` — `'use client'`.

---

## Props

```tsx
type PrototypeSwitcherProps = {
  phase: Phase;
  onPick: (phase: Phase) => void;   // → setPhase from T-03 §4
};
```

`setPhase` (not the individual actions) is what this calls — it applies the reviewed/finalized
presets per phase so each jump lands in a coherent state.

---

## Structure

```
<div class="flex items-center gap-3 flex-wrap px-4 py-[7px] bg-chrome-bg text-white">
  <span class={labelClasses}>Prototype control · not product UI</span>
  <div class="flex gap-[2px] bg-chrome-inset rounded-[6px] p-[2px]">
    … 6 buttons …
  </div>
  <span class="text-[11px] text-chrome-text">{hint}</span>
</div>
```

Mounted as the **first child of the page div**, above the app container (`T-01 §6`), so it takes
its natural height and the app fills the rest.

### Label

```
font-mono text-[10px] font-medium tracking-[.1em] uppercase text-chrome-text
border border-chrome-line rounded-[4px] px-[7px] py-[2px]
```
> `Prototype control · not product UI`

Mono, uppercase, wide tracking, boxed — every signal available for "this is instrumentation".

### Buttons

```
border-none rounded-[5px] px-[10px] py-[5px] text-[11.5px] font-semibold
active   → bg-brand text-white
inactive → bg-transparent text-chrome-text-2
```

Six, in this order:

| phase | label |
|---|---|
| `idle` | `Initial` |
| `loading` | `AI loading` |
| `review` | `Review needed` |
| `final` | `Prepared` |
| `aiError` | `AI error` |
| `apiError` | `API error` |

The labels are user-facing descriptions, not the internal phase names. Keep the mapping.

### Hint

```
text-[11px] text-chrome-text
```

| phase | hint |
|---|---|
| `idle` | `Nothing generated or synced yet.` |
| `loading` | `OpenAI request in flight.` |
| `review` | `AI output awaiting clinician sign-off.` |
| `final` | `Happy path — reviewed and handed off.` |
| `aiError` | `Generation failed; Photon untouched.` |
| `apiError` | `Treatment lookup failed; handoff blocked.` |

Em dash in the `final` hint; semicolons in the two error hints.

---

## Gating it out of production

The switcher is a demo affordance. Gate it so it cannot ship into a real deployment by accident:

```tsx
{import.meta.env.DEV && <PrototypeSwitcher … />}
```

Vite exposes `import.meta.env.DEV`; this project is Vite-based (`vinext`), so that is the idiomatic
check here — not `process.env.NODE_ENV`.

**But** the interview demo will likely run a production build (`npm run preview`), and the switcher
is wanted there. So make it a deliberate opt-in instead:

```tsx
const showSwitcher = import.meta.env.DEV || import.meta.env.VITE_SHOW_PROTOTYPE_CONTROLS === "true";
```

Document the flag in the repo README. Default off in production builds; the demo sets it on.

Group the `role="group" aria-label="Prototype state controls"` on the button row, and mark the
active one with `aria-pressed="true"`.

---

## Acceptance criteria

- [ ] Strip renders above the header, dark `#22262F`, full width, ~42px tall (7px padding top and
      bottom around a 28px button track). Tolerance ±2px.
- [ ] Six buttons in the documented order with the documented labels.
- [ ] The active button is solid `#3A50E4`; the rest are transparent on the `#171A21` inset track.
- [ ] Clicking each jumps to that phase and the entire screen updates — verify against the tables in
      `T-07`, `T-12`, `T-13`, `T-14`, which each specify per-phase output.
- [ ] Jumping to `final` shows a green header pill and the full handoff manifest.
- [ ] Jumping to `idle` clears the reviewed/finalized flags but leaves the note text (`setPhase`
      only presets those two flags — it does **not** reset the note, thread, or checks; `reset()` in
      `T-16` is what does that). Verify the distinction.
- [ ] All six hints render.
- [ ] The strip is visually unmistakable as non-product chrome — dark, mono, labeled.
- [ ] Hidden in a production build unless `VITE_SHOW_PROTOTYPE_CONTROLS=true`.
- [ ] `aria-pressed` on the active button.
- [ ] No hex literal in the file.

## Out of scope

Deep-linking phases via URL, persisting the selected phase, or exposing any control beyond these
six. Anything that starts to look like a product settings panel is wrong by definition here.
