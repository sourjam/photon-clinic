# T-16 — Action bar and toast

**Phase:** Chrome · **Depends on:** T-02, T-03, T-09 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

The bar pinned to the bottom of the app: a contextual hint on the left, three buttons on the right.
It is where the workflow terminates, and its hint line is a running commentary on what the app is
waiting for.

`V2-PRD.md` (2026-08-25 design feedback) is explicit: *"ensure the bottom action bar does not hide
content."* It is a flex sibling of the scrolling body, not a fixed overlay. The columns scroll
behind nothing.

---

## Files

- `app/visit/components/ActionBar.tsx` — `'use client'`
- `app/visit/components/Toast.tsx` — `'use client'`

---

## Part A — Action bar

### Props

```tsx
type ActionBarProps = {
  hint: string;
  onReset: () => void;
  onCopy: () => void;
  onFinalize: () => void;
  canCopy: boolean;      // derived.hasInstructions
  canFinalize: boolean;  // derived.canFinalize
  finalized: boolean;    // derived.finalized
};
```

### Structure

```
<div class="flex items-center justify-between gap-3 flex-wrap
            px-5 py-[11px] bg-surface border-t border-line">
  <div class="text-[11.5px] text-muted">{hint}</div>
  <div class="flex gap-2 flex-wrap">
    <Button variant="ghost" size="md" onClick={onReset}>Reset demo</Button>
    <Button variant="ghost" size="md" dimmed={!canCopy} onClick={onCopy}>Copy Spanish instructions</Button>
    <FinalizeButton />
  </div>
</div>
```

Placed as the **last flex child** of the app container from `T-01 §6`, after the body grid. Not
`position: fixed`.

### Finalize button

| condition | variant | label | dimmed |
|---|---|---|---|
| `finalized` | `success` | `Handoff prepared ✓` | no |
| else | `primary` | `Finalize handoff` | `!canFinalize` |

The `✓` is U+2713 with a leading space.

`Copy Spanish instructions` dims when `!hasInstructions` but **stays clickable** — clicking it at
`idle` copies the fixture text anyway (the mockup's `copyEs` is unconditional). Leave that: the
dim is a hint, not a lock, per `T-02 §4.1`.

`Finalize handoff` also stays clickable when dimmed, and clicking it fires the blocked-reason toast
from `T-03 §4.1`. That is the whole point of the dimmed-not-disabled pattern — the user finds out
*why*.

### Hint text by phase

| phase | hint |
|---|---|
| `idle` | `Nothing generated yet · prescribing happens in Photon, outside this MVP` |
| `loading` | `Generating Spanish instructions…` |
| `review` + `reviewed` | `Reviewed · ready to finalize the handoff` |
| `review` + `!reviewed` | `Mark the AI output reviewed to enable the handoff` |
| `final` | `Handoff prepared · no prescription was created by this app` |
| `aiError` | `Generation failed · nothing sent to Photon` |
| `apiError` | `Treatment lookup failed · handoff blocked` |

Compute this in `VisitWorkspace` (or a small `getActionHint(phase, reviewed)` helper in
`demoData.ts`) and pass the string in. The bar itself stays dumb.

Two of these seven do product work rather than status reporting: the `idle` hint and the `final`
hint both restate the prescribing boundary. That is deliberate — the boundary is stated at the
start and at the end of the workflow, in the place the eye rests between actions.

---

## Part B — Toast

### Props

```tsx
type ToastProps = { message: string };   // renders nothing when empty
```

### Structure

```
fixed bottom-[70px] left-1/2 -translate-x-1/2 z-50
bg-ink text-white text-[12.5px] font-medium
px-[17px] py-[9px] rounded-[9px]
shadow-[0_12px_30px_-8px_rgba(0,0,0,.4)]
```

`bg-ink` is `#1A1D24`. This is the only shadow in the design (`T-00 §4`) — inline it as an
arbitrary value rather than adding a shadow token, since nothing else will ever use it.

`bottom-[70px]` clears the ~53px action bar with room to spare.

Rendered by `VisitWorkspace` **outside** the app container (a sibling of it, inside the page div),
so no `overflow: hidden` ancestor can clip it.

### Behavior

Owned by `useVisitWorkflow` (`T-03 §4`): `showToast(msg)` sets the message and clears it after
**2200ms**, restarting the timer on each call. The component is pure — it renders the current
message or `null`.

### Announcement

Wrap in `<div role="status" aria-live="polite" aria-atomic="true">`, always mounted, with the
message text swapped inside. **Always mounted** matters: an `aria-live` region added to the DOM at
the same moment its content appears is unreliably announced.

This region is also what carries the blocked-action explanations for assistive tech, since dimmed
buttons are not `disabled` (`T-02 §4.1`).

---

## Every toast message in the app

Collected here so no two tickets invent variants. All of them route through `showToast`.

| Trigger | Message | Ticket |
|---|---|---|
| Copy (either call site) | `Spanish instructions copied to clipboard` | T-07, T-16 |
| Finalize succeeds | `Handoff prepared — continue in Photon` | T-16 |
| Finalize blocked — API error | `Resolve the treatment lookup first` | T-03 |
| Finalize blocked — no output | `Generate the Spanish instructions first` | T-03 |
| Finalize blocked — unreviewed | `Mark the AI output reviewed first` | T-03 |
| Finalize blocked — checklist | `Complete the safety review first` | T-03 |
| Review with no output | `Generate instructions first` | T-10 |
| Write manually | `Switched to manual entry` | T-15 |
| Retry lookup | `Treatment lookup succeeded · med_8f21c94a` | T-15 |
| Empty Spanish draft | `Escriba una pregunta primero` | T-11 |
| Empty clinician reply | `Type a reply first` | T-11 |
| Clinical question sent | `Clinical question flagged for clinician` | T-11 |

Twelve total. Note `Handoff prepared — continue in Photon` uses an em dash; the two
`Generate…first` messages differ (`Generate the Spanish instructions first` from Finalize,
`Generate instructions first` from Review) — that is in the source, keep both.

---

## Part C — Copy to clipboard

One handler in `useVisitWorkflow`, used by both `T-07`'s Copy button and the action bar:

```ts
const copySpanish = () => {
  try { navigator.clipboard.writeText(SPANISH_INSTRUCTIONS_PLAIN); } catch {}
  showToast("Spanish instructions copied to clipboard");
};
```

The `try/catch` swallowing failure is what the mockup does. Keep the toast unconditional — in a
demo, a clipboard permission failure that silently shows nothing is worse than an optimistic
confirmation. (Note this as a known compromise; a production version would branch on the promise.)

---

## Acceptance criteria

- [ ] The bar sits below the columns as a flex sibling. Scrolling the left column to its bottom
      reveals the last card fully, with nothing hidden behind the bar.
- [ ] All seven hint strings appear in their phases, including both `review` variants.
- [ ] `Copy Spanish instructions` is 45% opacity at `idle`/`loading`/`aiError` and full elsewhere.
- [ ] Clicking dimmed Copy still copies and still toasts.
- [ ] `Finalize handoff` is 45% opacity until `hasInstructions && reviewed && allChecked && !isApiError`.
- [ ] Clicking it while blocked toasts the correct reason from the `T-03 §4.1` ladder — verify all
      four branches.
- [ ] On success it becomes a solid green `Handoff prepared ✓` and the header pill (`T-04`) turns
      green.
- [ ] `Reset demo` returns the app to `idle` with an empty thread, unchecked boxes, and the note
      restored to `CLINICIAN_NOTE`.
- [ ] Toast appears centered 70px from the bottom, dark, with the single shadow, and disappears
      after 2200ms.
- [ ] Firing two toasts in quick succession shows the second and does not clear early.
- [ ] The `aria-live` region is in the DOM at boot, before any toast fires.
- [ ] No hex literal in either file.

## Out of scope

A toast queue or stack — one message at a time, replaced. Undo affordances. Confirmation before
`Reset demo` (it is a demo control; the friction is not worth it).
