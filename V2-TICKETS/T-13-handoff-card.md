# T-13 — Prepared-for-Photon handoff card

**Phase:** Right column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

The terminal state of the entire app. Not "prescription created" — **"prepared for Photon"**. When
finalized it expands into a five-row manifest of exactly what is ready to carry across, and closes
with a sentence stating that nothing was sent to a pharmacy.

`V2-DESIGN-LLM-HANDOFF.md` bans a "Prescription created" card outright. This card is the honest
replacement, and the footnote at its bottom is the single most important sentence in the product.

---

## File

`app/visit/components/HandoffCard.tsx` — no handlers.

---

## Props

```tsx
type HandoffCardProps = {
  status: "waiting" | "notFinalized" | "blocked" | "ready";
  rows: HandoffRow[];   // only rendered when status === "ready"
};

type HandoffRow = { k: string; v: string; mono: boolean };
```

Derive `status` in `VisitWorkspace` — evaluate in this order:

```ts
const status =
  finalized       ? "ready"
  : isApiError    ? "blocked"
  : hasInstructions ? "notFinalized"
  : "waiting";
```

`isApiError` is checked before `hasInstructions` even though both are true at `apiError` — a
blocked handoff outranks an unfinalized one.

---

## Structure

```
<Card tone={cardTone} className="px-[14px] py-[13px]">
  <div class="flex justify-between items-center gap-[10px]">
    <div class="text-[12.5px] font-bold {titleColor}">Prepared for Photon</div>
    <Badge tone={badgeTone}>{badgeLabel}</Badge>
  </div>
  <div class="text-[11.5px] leading-[1.5] text-ink-6 mt-[5px]">{body}</div>

  {status === "ready" && <Manifest />}
</Card>
```

No `CardHeader`. The title is **always** `Prepared for Photon`, in all four states — the card
announces its purpose, and the badge announces how close it is.

---

## The four states

| status | card tone | title color | badge | badge tone | body |
|---|---|---|---|---|---|
| `waiting` | `plain` | `text-ink-6` | `Waiting` | `neutral` | `Generate instructions and sync patient context to build the handoff.` |
| `notFinalized` | `warn` | `text-warn-ink` | `Not finalized` | `warn` | `Clinician review and safety sign-off are required before finalizing.` |
| `blocked` | `err` | `text-err-ink` | `Blocked` | `error` | `Treatment lookup must succeed before the handoff can be finalized.` |
| `ready` | `ok` | `text-ok-ink` | `Ready` | `success` | `All context is synced and clinician-reviewed. Continue prescribing in Photon.` |

Card tones map to the backgrounds/borders defined in `T-02 §1`:
`plain` = white/`#E1E5EE`, `warn` = `#FFFCF5`/`#EBD9B4`, `err` = `#FEF4F3`/`#F2C9C4`,
`ok` = `#F4FBF7`/`#BFE3CF`.

Body text is `text-ink-6` (`#5A6072`) in **all four** states. Only the title takes the tone color.

The `ready` body ends with `Continue prescribing in Photon.` — an instruction to leave this app.
That is the intended end of the demo.

---

## Manifest (`ready` only)

```
mt-3 pt-3 border-t border-ok-line-2 flex flex-col gap-2
  … 5 rows …
  <Footnote />
```

Each row:

```
flex justify-between gap-[10px] items-baseline
  span: text-[11.5px] text-ink-6                    ← key
  span: {mono ? monoValue : plainValue}             ← value, right-aligned
```

| value style | classes |
|---|---|
| mono | `font-mono text-[11.5px] font-medium text-ink text-right` |
| plain | `text-[11.5px] font-semibold text-ok-ink text-right` |

Machine identifiers render in mono ink; human-confirmed facts render in green. The visual split
tells you which half of the manifest came from an API and which half came from a person.

### The five rows (append to `demoData.ts` as `HANDOFF_ROWS`)

```ts
export const HANDOFF_ROWS: HandoffRow[] = [
  { k: "Photon patient",       v: "pat_01HQ7K4M2Z",                          mono: true  },
  { k: "Treatment",            v: "med_8f21c94a",                            mono: true  },
  { k: "Safety data",          v: "allergy + med history synced for screening", mono: false },
  { k: "Spanish instructions", v: "reviewed",                                mono: false },
  { k: "Medication prep",      v: "2.5% · 30 g · 7 days · 0 refills",         mono: false },
];
```

Row 3 says `synced for screening`, not `screened`. Same discipline as `T-09`: the app moved the
data, Photon does the screening.

### Footnote

```
text-[11px] text-ok-ink-2 leading-[1.5] mt-1 pt-[9px] border-t border-dashed border-ok-line-2
```
> `Prescribing happens in Photon, outside this MVP. Nothing here has been sent to a pharmacy.`

Two sentences, both load-bearing. Verbatim. The dashed rule above it separates the manifest (what
*is* ready) from the disclaimer (what deliberately did *not* happen).

---

## Acceptance criteria

- [ ] Title reads `Prepared for Photon` in all four states.
- [ ] `idle`/`loading` → white card, `Waiting` neutral badge, no manifest.
- [ ] `review` (not finalized) → amber card, `Not finalized` badge, no manifest.
- [ ] `apiError` → red card, `Blocked` badge, no manifest — even though `hasInstructions` is true.
- [ ] `final` → green card, `Ready` badge, manifest of exactly 5 rows plus the footnote.
- [ ] Rows 1–2 render mono in `#1A1D24`; rows 3–5 render sans, semibold, `#0B6B47`.
- [ ] Body copy is `#5A6072` in all four states.
- [ ] The manifest's top border is solid `#CFE6DA`; the footnote's is dashed `#CFE6DA`.
- [ ] Footnote text matches character-for-character.
- [ ] The words "prescription created", "Rx written", or any active-prescription ID appear
      **nowhere** in this file.
- [ ] No hex literal in the file.

## Out of scope

A "Open Photon" deep link, a copy/export of the manifest, a webhook-driven status. Those belong to
later work; V2 ends at a rendered, reviewed handoff summary.
