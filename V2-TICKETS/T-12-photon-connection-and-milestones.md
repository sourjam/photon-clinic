# T-12 — Photon connection card + sync milestones

**Phase:** Right column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

The right column exists to make the Photon integration *visible and checkable*. These two cards are
the top of it: what the app is connected to and with what scope, then a five-row list of every API
call the workflow depends on, each with a live status and the identifier it returned.

The scope row includes `Prescribe scope: not requested`. That is the app stating, in its own
connection metadata, that it never asked for the ability to prescribe. It is the strongest form of
the boundary claim in the entire design — stronger than any disclaimer sentence — because it is
falsifiable.

---

## Files

- `app/visit/components/PhotonConnectionCard.tsx` — no handlers
- `app/visit/components/SyncMilestonesCard.tsx` — no handlers
- `app/visit/demoData.ts` — append `buildMilestones()` from §3

---

## Part A — Connection card

### Props

```tsx
type PhotonConnectionCardProps = {
  host: string;           // PHOTON.host  "api.neutron.health · oauth2"
  scope: string;          // PHOTON.scope "read · write:patient"
  prescribeScope: string; // PHOTON.prescribeScope "not requested"
  connected: boolean;     // derived.connOk === !isIdle
};
```

### Structure

```
<Card className="px-[14px] py-3">
  <div class="flex justify-between items-center gap-[10px]">
    <div>
      <div class="text-[12.5px] font-bold">Connection</div>
      <div class="font-mono text-[11px] text-muted mt-[3px]">{host}</div>
    </div>
    <Badge tone={connected ? "success" : "neutral"}>
      {connected ? "Authenticated" : "Not connected"}
    </Badge>
  </div>

  <div class="flex gap-[14px] mt-[11px] pt-[11px] border-t border-line-softer">
    <div>
      <FieldLabel>Scope</FieldLabel>
      <div class="text-[11.5px] font-semibold">{scope}</div>
    </div>
    <div>
      <FieldLabel>Prescribe scope</FieldLabel>
      <div class="text-[11.5px] font-semibold text-muted-2">{prescribeScope}</div>
    </div>
  </div>
</Card>
```

No `CardHeader` — the title is inline so the badge can sit beside it above the host line.

Note the `FieldLabel`s here have **no** `mb-[3px]`-equivalent gap in the source... they do: the
FieldLabel component's own `mb-[3px]` applies. Fine as-is.

`Prescribe scope`'s value is deliberately grey (`text-muted-2`) while `Scope`'s is full-ink — the
absent capability is styled as absent.

`connected` is true in every phase except `idle`, including both error phases. Auth succeeding is
what makes a *later* call's failure meaningful.

---

## Part B — Sync milestones card

### Props

```tsx
type SyncMilestonesCardProps = { milestones: Milestone[] };   // Milestone from T-03 types
```

Five rows, always five, always in this order:

1. `Auth check`
2. `Patient sync`
3. `Treatment lookup`
4. `Allergy history`
5. `Medication history`

### Structure

```
<Card className="overflow-hidden">
  <CardHeader title="Sync milestones" />        ← title-only
  <div class="py-1">
    … 5 rows …
  </div>
</Card>
```

### Row

```
flex gap-[10px] px-[14px] py-[9px] border-b border-line-row-2
  <StatusDot />
  <div class="flex-1 min-w-0">
    <div class="flex justify-between items-center gap-2">
      <span class="text-[12.5px] font-semibold {labelColor}">{label}</span>
      <Badge tone={badgeTone}>{statusText}</Badge>
    </div>
    {id && <div class="font-mono text-[10.5px] {idColor} mt-[2px]">{id}</div>}
  </div>
```

`min-w-0` on the inner flex column is required — `pat_01HQ7K4M2Z` will otherwise push the badge out
of the 330px-minimum column.

The `id` line is **hidden entirely when empty** (the mockup uses `display: none`; conditional
rendering is equivalent and cleaner). A row with no id is shorter than one with an id — that is
correct, rows are not fixed-height.

### Status → presentation

| status | dot | glyph | badge tone | badge text | label color | id color |
|---|---|---|---|---|---|---|
| `ok` | `w-[18px] h-[18px] rounded-full bg-ok text-white` | `✓` | `success` | `synced` | `text-ink` | `text-muted` |
| `loading` | `<Spinner variant="milestone" />` | — | `info` | `syncing` | `text-ink` | `text-muted` |
| `error` | `w-[18px] h-[18px] rounded-full bg-err text-white` | `!` | `error` | `failed` | `text-ink` | `text-err-ink` |
| `pending` | `w-[18px] h-[18px] rounded-full bg-surface-pending text-muted-5 border border-line-2` | — | `neutral` | `pending` | `text-muted-2` | `text-muted` |

Dot base for all: `rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-px`.

Only the `error` row's id line turns red; everything else is `#7A8090`.

---

## 3. Milestone data by phase (append to `demoData.ts`)

```ts
export function buildMilestones(phase: Phase): Milestone[] {
  const mk = (label: string, status: MilestoneStatus, id = ""): Milestone => ({ label, status, id });

  if (phase === "idle" || phase === "aiError") {
    return [
      mk("Auth check", "pending"),
      mk("Patient sync", "pending"),
      mk("Treatment lookup", "pending"),
      mk("Allergy history", "pending"),
      mk("Medication history", "pending"),
    ];
  }
  if (phase === "loading") {
    return [
      mk("Auth check", "ok", "token · 3600s"),
      mk("Patient sync", "loading"),
      mk("Treatment lookup", "pending"),
      mk("Allergy history", "pending"),
      mk("Medication history", "pending"),
    ];
  }
  if (phase === "apiError") {
    return [
      mk("Auth check", "ok", "token · 3600s"),
      mk("Patient sync", "ok", "pat_01HQ7K4M2Z"),
      mk("Treatment lookup", "error", "503 · retry available"),
      mk("Allergy history", "ok", "1 record · sulfa"),
      mk("Medication history", "ok", "1 record · prenatal vitamin"),
    ];
  }
  // review | final
  return [
    mk("Auth check", "ok", "token · 3600s"),
    mk("Patient sync", "ok", "pat_01HQ7K4M2Z"),
    mk("Treatment lookup", "ok", "med_8f21c94a"),
    mk("Allergy history", "ok", "1 record · sulfa"),
    mk("Medication history", "ok", "1 record · prenatal vitamin"),
  ];
}
```

Two things worth noticing, because they are what make the demo credible:

- **`aiError` shows everything pending.** If the AI generation failed, the app never touched
  Photon. The error copy in `T-15` says so explicitly (`The note was not sent to Photon`). A design
  that showed a synced patient here would be lying about blast radius.
- **`apiError` shows the two *later* calls succeeding** after the failed one. Allergy and medication
  history are independent of the treatment lookup, so they completed. Only the treatment resolution
  is missing, which is exactly why the handoff is blocked and nothing else is.

---

## Acceptance criteria

- [ ] Connection badge: `Not connected` (neutral) only at `idle`; `Authenticated` (green) in all
      five other phases including both errors.
- [ ] `Prescribe scope` value renders grey `#8A90A0`; `Scope` value renders full ink.
- [ ] Milestones show 5 rows in every phase — never fewer, never reordered.
- [ ] At `idle` and `aiError`: all five `pending`, grey dots, grey labels, **no id lines at all**.
- [ ] At `loading`: row 1 `synced` with `token · 3600s`; row 2 shows an 18px spinner with the
      `syncing` badge and no id; rows 3–5 pending.
- [ ] At `apiError`: row 3 has a red `!` dot, `failed` badge, and a red `503 · retry available`
      line; rows 4 and 5 are green and synced.
- [ ] At `review`/`final`: all five green, row 3 reads `med_8f21c94a`.
- [ ] The spinner row is the same height as an id-less `ok` row (no vertical jump when it resolves).
- [ ] `pat_01HQ7K4M2Z` does not overflow at a 330px column width.
- [ ] Mono font on every id line.
- [ ] No hex literal in either file.

## Out of scope

Real API calls, retry from this card (the retry button lives in `T-15`'s error card), and any
"click a milestone to see the payload" affordance. The evidence log (`T-14`) is where the raw calls
are shown.
