# T-14 — API evidence log

**Phase:** Right column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

A scrolling list of every call the workflow made, in mono, with timestamps and status codes. It is
the last card in the right column and the one an interviewer will actually read closely — it is the
receipt for every claim the rest of the UI makes.

It mixes Photon calls (`POST /patients`) with OpenAI calls (`openai · instructions.generate`) in one
timeline, which is right: the reviewer wants to see the two systems interleaved, not siloed.

---

## Files

- `app/visit/components/EvidenceLogCard.tsx` — no handlers
- `app/visit/demoData.ts` — append `buildLog()` from §3

---

## Props

```tsx
type EvidenceLogCardProps = { entries: LogEntry[] };   // LogEntry from T-03 types
```

---

## Structure

```
<Card>
  <CardHeader title="API evidence log">
    <span class="text-[11px] text-muted-2">{countLabel}</span>
  </CardHeader>
  <div class="px-3 py-[9px] flex flex-col gap-[6px] max-h-[200px] overflow-auto">
    {entries.length === 0 ? <Empty/> : entries.map(<Row/>)}
  </div>
</Card>
```

`countLabel` is `` `${entries.length} calls` `` when non-empty, and the **empty string** when there
are none — not `0 calls`. The header's right slot simply disappears at boot.

The `max-h-[200px]` scroll region is what keeps the right column from growing past the viewport as
thread messages accumulate. It uses the custom 8px scrollbar from `T-01 §3`.

---

## 1. Empty state

```
py-[14px] px-[2px] text-[11.5px] text-muted-3 text-center
```
> `No calls yet.`

---

## 2. Row

```
flex gap-[9px] items-baseline font-mono text-[10.5px] leading-[1.5]
  span: text-muted-4 shrink-0                            ← timestamp "10:38:02"
  span: font-semibold shrink-0 {codeColor}               ← "200" / "503"
  span: text-ink-5 flex-1                                ← message
```

`codeColor` is `text-err` (`#C5352A`) when `isError`, otherwise `text-ok-ink` (`#0B6B47`).
Note: green code text is `#0B6B47` (the ink green) while red is `#C5352A` (the solid red) — the two
are not from the same rung of their scales. That is what the source does and it reads correctly,
because red needs less weight to stand out than green does.

Both leading spans are `shrink-0` so the message column takes all the slack. Timestamps are
`HH:MM:SS` (8 chars) and codes are 3 chars, so the columns align naturally without a grid.

Wrap the list in `role="log"` so a screen reader announces appended rows. Do not make rows
focusable — they are read-only text.

---

## 3. Log data by phase (append to `demoData.ts`)

```ts
export function buildLog(phase: Phase, finalized: boolean): LogEntry[] {
  const L = (t: string, code: string, msg: string, isError = false): LogEntry =>
    ({ t, code, msg, isError });

  let log: LogEntry[] = [];

  if (phase === "idle") {
    log = [];
  } else if (phase === "loading") {
    log = [L("10:38:02", "200", "POST /auth/token")];
  } else if (phase === "aiError") {
    log = [
      L("10:38:02", "200", "POST /auth/token"),
      L("10:39:11", "504", "openai · instructions.generate", true),
    ];
  } else if (phase === "apiError") {
    log = [
      L("10:38:02", "200", "POST /auth/token"),
      L("10:38:44", "200", "openai · instructions.generate"),
      L("10:39:03", "201", "POST /patients → pat_01HQ7K4M2Z"),
      L("10:39:20", "503", "GET /catalog/treatments", true),
      L("10:39:26", "200", "GET /allergies → 1 record"),
      L("10:39:31", "200", "GET /medication_history → 1 record"),
    ];
  } else {
    // review | final
    log = [
      L("10:38:02", "200", "POST /auth/token"),
      L("10:38:44", "200", "openai · instructions.generate"),
      L("10:39:03", "201", "POST /patients → pat_01HQ7K4M2Z"),
      L("10:39:18", "200", "GET /catalog/treatments → med_8f21c94a"),
      L("10:39:26", "200", "GET /allergies → 1 record"),
      L("10:39:31", "200", "GET /medication_history → 1 record"),
    ];
  }

  if (finalized) {
    log = [...log, L("10:42:07", "200", "handoff prepared · no Rx written")];
  }
  return log;
}
```

Details that carry meaning:

- `POST /patients` returns **201**, not 200. A created resource. The one write in the whole log.
- The `aiError` log has **two** entries: auth succeeded, then OpenAI timed out with a 504. No Photon
  writes ever happened — which is what `T-15`'s error copy and `T-12`'s all-pending milestones both
  assert. All three must agree.
- The `apiError` log keeps the two calls *after* the 503, at later timestamps. They were independent
  and they completed.
- The final row, `handoff prepared · no Rx written`, is the app logging its own boundary. It appears
  only when `finalized`. `10:42:07` is five seconds after the review timestamp in `T-10`
  (`Dr. A. Okafor` at `10:42`) — the sequence is internally consistent, so keep both.
- Arrows are `→` U+2192, separators are `·` U+00B7.

---

## 4. Thread messages append to the log

`T-11` messages become log rows. `VisitWorkspace` composes:

```ts
const entries = [
  ...buildLog(phase, finalized),
  ...thread.map((m) => ({
    t: m.time,
    code: "200",
    msg: `openai · message.translate (${m.from === "patient" ? "es→en" : "en→es"})`,
    isError: false,
  })),
];
```

Thread rows use `HH:MM` (5 chars) while the fixed rows use `HH:MM:SS`. The columns will be slightly
ragged. That is what the source does; leave it. Padding thread times to a fake `:00` would invent
precision the app does not have.

---

## Acceptance criteria

- [ ] At `idle`: `No calls yet.` centered, and the header's right slot is empty (no `0 calls`).
- [ ] At `loading`: 1 row, header reads `1 calls`. (Yes, `1 calls` — the source does not
      pluralize. Leave it; "fixing" it is a silent design change.)
- [ ] At `aiError`: exactly 2 rows, second is `504` in red.
- [ ] At `apiError`: 6 rows, the `503` red and in position 4, with two green rows after it.
- [ ] At `review`: 6 rows, all green, `201` on the `POST /patients` row.
- [ ] At `final`: 7 rows, last is `10:42:07 200 handoff prepared · no Rx written`.
- [ ] Sending two thread messages adds two `openai · message.translate` rows at the end, labeled
      `(es→en)` and `(en→es)`.
- [ ] With 7+ rows the region scrolls at 200px max height with an 8px `#C9CEDA` thumb; the card
      does not grow.
- [ ] Every row is IBM Plex Mono 10.5px.
- [ ] `role="log"` on the list container.
- [ ] No hex literal in either file.

## Out of scope

Real request capture, expandable payloads, copy-to-clipboard on a row, filtering. `T-19` will make
these entries real by recording actual calls; the rendering does not change.
