# T-27 — Instruction context & staleness, live evidence log, and the right-column moves

**Phase:** V2.1 cross-cutting · **Depends on:** T-22, T-24, T-25 · **Blocks:** T-28
**Read first:** `T-00-design-reference.md`, then `T-21-v2.1-design-reference.md`

---

## Context

The remaining V2.1 deltas, grouped because they all follow from the same change: **instructions are
now generated for a specific patient and a specific treatment**, and everything downstream has to
track which one.

Three new safety behaviors come out of that:

1. **Dose omission** — if the clinician note states no frequency, the AI leaves dosing out of the
   Spanish rather than inventing it, and says so.
2. **Staleness** — if the treatment changes after generation, the instructions are visibly marked
   stale and the handoff blocks until they are regenerated.
3. **Live evidence** — the log and milestones stop being phase-keyed fixtures and become an
   append-only record of what actually happened.

Plus the two review cards move to the right column.

---

## Files

| File | Change |
|---|---|
| `ClinicianNoteCard.tsx` | stale banner, `min-h` 76px, new button/hint copy |
| `SpanishInstructionsCard.tsx` | dynamic title, dose-missing banner, dose-variant paragraph, new copy |
| `SafetyReviewCard.tsx` | dynamic `dose` meta; **moves to right column** |
| `ClinicianReviewCard.tsx` | body copy; **moves to right column** |
| `SyncMilestonesCard.tsx` | `Sync Photon` header button; facet-derived rows |
| `EvidenceLogCard.tsx` | `max-h` 230px, always-on count, code-derived color |
| `HandoffCard.tsx` | dynamic rows, new body copy |
| `PhotonConnectionCard.tsx` | badge always `Authenticated` |
| `AiErrorCard.tsx` / `PhotonErrorCard.tsx` | one sentence each |
| `PatientFollowUpCard.tsx` | `min-h` 48px, log side effects |
| `demoData.ts` | retire `buildMilestones` / `buildLog`; add seed log |

---

## 1. Generation guards and staleness

### `generate()` — two new guards

```ts
if (!sel)          { showToast("Select a treatment first");    return; }
if (!note.trim())  { showToast("Write a clinician note first"); return; }

set({ ai: "loading", reviewed: false, finalized: false });
after 1300ms:
  set({ ai: "ready", aiForId: sel.id });
  addLog("200", "POST /instructions → generated");
  if (doseMissing) showToast("No frequency in note — dose omitted, confirm before review");
```

`aiForId` records **which treatment** these instructions describe. It is the whole staleness
mechanism.

Note generation no longer touches `patientSync`, `txLookup`, or the milestones — those are
`syncPhoton`'s job now (`T-23 §6`). In V2 one button did both; splitting them is why the facets were
needed.

### `staleForTx`

```ts
staleForTx = hasInstructions && sel !== null && aiForId !== null && aiForId !== sel.id
```

True after selecting a different treatment while instructions are showing. It blocks finalize
(`T-22 §4`) and renders a banner in the clinician note card:

```
mt-[10px] flex items-center gap-2
bg-warn-bg border border-warn-line rounded-[6px] px-[10px] py-[7px]
  <span class="w-[5px] h-[5px] rounded-full bg-warn shrink-0" aria-hidden="true" />
  <span class="text-[11.5px] text-warn-ink">Treatment changed since these instructions were generated. Regenerate before review.</span>
```

Same 5px-dot + amber-pill shape as the thread's flagged-question note (`T-11 §2`). Consistent
vocabulary: amber pill with a dot = "a human needs to look at this".

### Other `ClinicianNoteCard` changes

| | V2 | V2.1 |
|---|---|---|
| textarea `min-h` | 82px | **76px** |
| button, fresh | `Generate Spanish instructions` | `Generate instructions` |
| button, regen | `Regenerate Spanish instructions` | `Regenerate instructions` |
| hint, idle | `Output is drafted by AI and must be clinician-reviewed` | `Doses are copied from the note, never invented` |
| hint, loading | `OpenAI · gpt-4o-mini` | `OpenAI · uses note + patient + treatment` |

Both hints got more specific. The idle hint now states the safety property that `doseMissing`
enforces, rather than a generic review disclaimer — and it is a claim the app can actually keep.

---

## 2. Spanish instructions: dynamic title and dose handling

### Title, derived from the selected treatment

```ts
const esTitle = sel
  ? sel.name
      .replace(/^Hydrocortisone/,                "Crema de hidrocortisona")
      .replace(/^Triamcinolone acetonide cream/, "Crema de triamcinolona")
      .replace(/^Mupirocin ointment/,            "Ungüento de mupirocina")
      .replace(/^Lisinopril tablet/,             "Lisinopril tableta")
      .replace(/^Ondansetron ODT/,               "Ondansetrón ODT")
    + " — cómo usarla"
  : "Instrucciones";
```

Five prefix replacements, applied in order, plus the em-dash suffix. So
`Hydrocortisone cream 2.5%` → `Crema de hidrocortisona cream 2.5% — cómo usarla`.

**Yes, that leaves the English word `cream` in the middle.** The `Hydrocortisone` rule only replaces
the first word. The other four rules consume their full noun phrase and produce clean Spanish. It is
a bug in the mockup's demo-grade string munging, not a design decision.

Reproduce the behavior — matching the design is the job — but leave a `TODO` and flag it in the PR.
The real fix is `T-28 §6`: the model returns `headingEs`, and none of this regex exists. Do not
hand-patch the regex into looking right; that hides a stand-in that is about to be deleted.

`strength` is parsed separately: `sel.name.match(/[\d.]+\s?(%|mg)/)?.[0]` → `"2.5%"`.

### Paragraph 2 has two variants

```ts
doseMissing
  ? "Aplique la crema en las zonas afectadas según le indique su médico. La frecuencia y la duración se confirmarán antes de empezar."
  : `Aplique una capa fina de la crema ${strength ? `(${strength}) ` : ""}en las zonas afectadas dos veces al día, por 7 días. Luego deténgase. No la use en la cara ni cerca de los ojos.`
```

The dose-present variant interpolates the strength in parentheses:
`Aplique una capa fina de la crema (2.5%) en las zonas afectadas dos veces al día, por 7 días.`

The dose-absent variant **states no frequency and no duration at all** and defers to the clinician.
That is the product's central safety claim made concrete: no numbers rather than invented numbers.

Paragraphs 1, 3, 4 (the lactation callout), and 5 are unchanged from `T-07 §4.1`. The callout keeps
its amber left bar.

> ⚠ The `dos veces al día, por 7 días` in the dose-present variant is **hardcoded** — it does not
> read the note or the `duration` prep field. Set `Duration: 14 days` and the Spanish still says
> 7 días. Known limitation, same root cause as `T-25`'s note. Flag it; `T-28 §6` fixes it by
> generating the text instead of templating it.

### Dose-missing banner

Renders above the instruction panel when `doseMissing && hasInstructions`:

```
flex gap-[9px] items-start
bg-warn-bg border border-warn-line rounded-[7px] px-[11px] py-[10px]
  <span class="w-4 h-4 rounded-full bg-warn text-white text-[10px] font-bold shrink-0 mt-px
               flex items-center justify-center" aria-hidden="true">!</span>
  <div class="text-[11.5px] leading-[1.5] text-warn-ink">
    The note does not state a frequency or duration. Dose details were left out rather than invented — confirm and add them before review.
  </div>
```

16px icon — smaller than the 20px error-card icons (`T-15`), because this is a caution, not a
failure.

### Other copy

| | V2 | V2.1 |
|---|---|---|
| empty state | `Instructions appear here once generated from the clinician note.` | `Instructions appear here once generated from the note, patient and selected treatment.` |
| loading | `Generating patient-friendly Spanish from the clinician note…` | `Generating Spanish from note + patient + treatment…` |
| footer meta | `Reading level: plain Spanish · tone: respectful` | `Doses and durations copied verbatim from the note · plain Spanish` |
| copy toast | `Spanish instructions copied to clipboard` | `Spanish instructions copied` |

Clipboard text is now composed, not a constant:

```ts
const text = esTitle + "\n\n" + esParas.map(p => p.text).join("\n\n");
```

Retire `SPANISH_INSTRUCTIONS_PLAIN` — the copy must match what is on screen, and both are now
derived. This also resolves the `T-07 §4.1` note about the title differing between panel and
clipboard: in V2.1 they are the same string.

Badge logic is **unchanged** (`T-07 §1`, five rows).

---

## 3. Safety review — dynamic `dose` meta, moved right

Only the third row's meta changes:

```ts
sel
  ? [strength, prep.quantity, prep.duration, `${prep.refills} refills`].filter(Boolean).join(" · ")
  : "Select a treatment first"
```

Default renders `2.5% · 30 g tube · 7 days · 0 refills`. Live — editing any prep field updates it
(`T-25`).

Rows 1, 2, 4 and all styling are unchanged (`T-09`). `toggleCheck` now also clears `finalized`
(`T-22 §4`).

`allChecked` is `syncedCount === 3 && checks.lactation` — same 4/4 result, expressed to match the
badge's `3 synced · 1 clinician-reviewed` split.

**The card moves to the right column**, position 5. No style change from the move.

---

## 4. Clinician review, milestones, connection

### `ClinicianReviewCard`

Body copy in the reviewed state drops the timestamp:

> `Dr. A. Okafor confirmed the Spanish instructions, medication prep and safety review.`

Remove the `reviewerTime` prop and `REVIEWER.time`. `toggleReviewed` no longer forces a phase
(`T-22 §4`). Everything else unchanged (`T-10`). **Moves to the right column**, position 6.

### `SyncMilestonesCard` — header button

```tsx
<CardHeader title="Sync milestones">
  <Button variant="ghost" size="xs" onClick={onSync}>
    {syncStatus === "pending" ? "Syncing…" : "Sync Photon"}
  </Button>
</CardHeader>
```

The `xs` size from `T-21 §6.3`. Same action as the action bar's (`T-23 §6`) — one function, two call
sites.

### Milestone rows — derived from facets

`buildMilestones(phase)` is deleted. Five rows, always:

| # | Label | Status | Id line |
|---|---|---|---|
| 1 | `Auth check` | always `ok` | `token · 3600s` |
| 2 | `Patient sync` | `none`→`pending`, `pending`→`loading`, else `ok` | `` `${patientId} · ${sync === "updated" ? "updated" : "synced"}` ``, or `""` when no id |
| 3 | `Treatment lookup` | `error` if `txLookup==="error"`; `ok` if `txLookup==="ok" && sel`; else `pending` | `503 · retry available` on error; `sel.id` when ok; else `""` |
| 4 | `Allergy history` | `historySync==="ok"` ? `ok` : `pending` | `1 record · sulfa` |
| 5 | `Medication history` | `historySync==="ok"` ? `ok` : `pending` | `1 record · prenatal vitamin` |

Row 2's id gains a suffix: `pat_01HQ7K4M2Z · synced` or `pat_01HQ7K4M2Z · updated`.

**New status text:** when a row is `ok` *and* its id contains `updated`, the badge reads
**`updated`** instead of `synced`. Row 2 is the only one that can. Everything else in `T-12 §2`'s
status→presentation table is unchanged.

Auth is now hardcoded `ok` in every state, including `fresh` — the app assumes credentials are
configured. Slightly optimistic; `T-19`'s live path will make it real.

### `PhotonConnectionCard`

Badge is always `success` / `Authenticated`. The `connected` prop and `connOk` are retired
(`T-22 §3`).

### Error cards

| card | sentence |
|---|---|
| `AiErrorCard` | `The note was not sent to Photon.` → **`Nothing was written to Photon.`** |
| `PhotonErrorCard` | `Patient and safety sync succeeded.` → **`Patient and history sync succeeded.`** |

Both are precision fixes. "Nothing was written" is stronger and matches the `aiError` scenario,
where a patient sync **may** already have happened (its log seed has a `201 · POST /patients` row) —
so "the note was not sent" would have been the wrong claim, while "nothing was written" is true of
the failed call itself. And "history" is what actually synced; "safety" overclaimed.

---

## 5. Evidence log — live state

### Component changes

| | V2 | V2.1 |
|---|---|---|
| `max-h` | 200px | **230px** |
| count label | hidden when empty | always `` `${n} calls` `` (shows `0 calls`) |
| error color | `entry.isError` flag | `/^[45]/.test(entry.code)` |

Everything else in `T-14 §2` holds.

### Seed log (7 rows, `INITIAL_STATE`)

```
10:38:02 · 200 · POST /auth/token
10:38:20 · 200 · GET /catalog/treatments → 3 results
10:38:24 · 200 · Selected treatment → med_8f21c94a
10:38:41 · 201 · POST /patients → pat_01HQ7K4M2Z
10:38:48 · 200 · GET /allergies → 1 record
10:38:52 · 200 · GET /medication_history → 1 record
10:39:10 · 200 · POST /instructions → generated
```

This is the demo's backstory: search, select, sync, generate. Scenario seeds are in `T-26 §4`.

### Appended rows

Every one goes through `addLog` (`T-22 §5`), which ticks the clock:

| Trigger | code | msg |
|---|---|---|
| Search / quick term | `200` | `GET /catalog/treatments → {n} results` |
| Select treatment | `200` | `Selected treatment → {id}` |
| Sync, create | `201` | `POST /patients → {id}` |
| Sync, update | `200` | `POST /patients → updated existing patient` |
| Sync | `200` | `GET /allergies → 1 record` |
| Sync | `200` | `GET /medication_history → 1 record` |
| Sync, with selection | `200` | `GET /catalog/treatments → {sel.id}` |
| Generate | `200` | `POST /instructions → generated` |
| Retry lookup | `200` | `GET /catalog/treatments → {id or n results}` |
| Patient message | `200` | `POST /translate → clinical question flagged` **or** `POST /translate → es→en` |
| Clinician reply | `200` | `POST /translate → en→es` |
| Finalize | `200` | `Handoff prepared · no Rx written` |

Thread rows are now appended by the send actions, **not** concatenated at render time. Delete the
`evidenceEntries` composition in `VisitWorkspace` (`T-14 §4`) or messages log twice.

The message wording changed: V2's `openai · message.translate (es→en)` → V2.1's
`POST /translate → es→en`, matching the real route from `T-19`.

---

## 6. Handoff card

Body copy when not finalized and not blocked:

> `` `${readyCount} of 4 readiness items complete. Finalize once the safety review and clinician sign-off are done.` ``

The second sentence names the safety review explicitly — which is how the design compensates for
the safety review not being one of the four readiness dots (`T-26 §2`).

Rows are dynamic:

| Row | Value |
|---|---|
| `Photon patient` | `patientId \|\| "—"` (mono) |
| `Treatment` | `sel?.id ?? "—"` (mono) |
| `Safety data` | `allergy + med history synced for screening` (plain) |
| `Spanish instructions` | `reviewed` (plain) |
| `Medication prep` | `[strength, quantity, duration, refills + " refills"].filter(Boolean).join(" · ")` (plain) |

Retire the static `HANDOFF_ROWS` and the per-row patch in `VisitWorkspace`. Status logic, the four
tones, and the footnote are unchanged (`T-13`) — including
`Prescribing happens in Photon, outside this MVP. Nothing here has been sent to a pharmacy.`

---

## 7. `PatientFollowUpCard`

Two textarea `min-h` values 52px → **48px**. Send actions call `addLog` (§5). Nothing else.

---

## Acceptance criteria

- [ ] Delete the dose clause (`— apply thin layer twice daily for 7 days`) from the note and
      regenerate → amber dose-missing banner appears, paragraph 2 states no frequency or duration,
      and a toast reads `No frequency in note — dose omitted, confirm before review`.
- [ ] Restore the clause and regenerate → banner gone, paragraph 2 reads
      `Aplique una capa fina de la crema (2.5%) en las zonas afectadas dos veces al día, por 7 días.`
- [ ] Select a different treatment while instructions show → stale banner in the note card; finalize
      toasts `Regenerate instructions for the new treatment`; regenerating clears both.
- [ ] Title for `Mupirocin ointment 2%` reads `Ungüento de mupirocina 2% — cómo usarla`.
- [ ] Title for `Hydrocortisone cream 2.5%` reads
      `Crema de hidrocortisona cream 2.5% — cómo usarla` — the known regex artifact, with its TODO.
- [ ] Generate with no treatment → `Select a treatment first`; with an empty note →
      `Write a clinician note first`.
- [ ] `Copy` copies the composed title + 5 paragraphs and toasts `Spanish instructions copied`.
- [ ] Safety row 3 meta reads `2.5% · 30 g tube · 7 days · 0 refills` and updates live when a prep
      field changes; with no selection it reads `Select a treatment first`.
- [ ] Safety review and clinician review render in the **right** column, between the Photon error
      card and the handoff card.
- [ ] Review card body has no timestamp.
- [ ] Milestones card header has a `Sync Photon` button that reads `Syncing…` for 900ms.
- [ ] After a second sync, milestone 2 reads `pat_01HQ7K4M2Z · updated` with an **`updated`** badge.
- [ ] Connection badge reads `Authenticated` even in the `Fresh visit` scenario.
- [ ] Log seeds 7 rows, `7 calls`; `fresh` seeds 1 row, `1 calls`; scrolls at 230px.
- [ ] Each thread message adds exactly one `POST /translate → …` row.
- [ ] A flagged question logs `POST /translate → clinical question flagged`.
- [ ] `504` and `503` rows render red; `201` renders green.
- [ ] Handoff body reads `3 of 4 readiness items complete. Finalize once…` at boot.
- [ ] Handoff `Medication prep` row tracks live prep edits.
- [ ] `buildMilestones`, `buildLog`, `HANDOFF_ROWS`, `SPANISH_INSTRUCTIONS_PLAIN` and `REVIEWER.time`
      are all deleted and unreferenced.
- [ ] No hex literal in any `.tsx`.

## Out of scope

Real generation (`T-28 §6`). Reconciling the hardcoded `dos veces al día, por 7 días` with the
`duration` field — that is a prompt change, not a template change, and belongs with the live seam.
