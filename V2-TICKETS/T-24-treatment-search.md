# T-24 — Treatment search: Photon medication catalog

**Phase:** V2.1 left column · **Depends on:** T-22 · **Blocks:** T-25, T-28
**Read first:** `T-00-design-reference.md`, then `T-21-v2.1-design-reference.md`

---

## Context

V2 hardcoded one treatment. V2.1 gives the clinician a real catalog search: type a medication name,
get a list of Photon treatment records, select one. The selection then drives the Spanish
instructions, the medication prep fields, the `dose` safety check, the treatment milestone, and the
handoff manifest.

The card's header is careful: **`Treatment search · Photon medication catalog`**, with the meta
**`Catalog lookup only · no prescribing`**. It is a read of a drug database, not a prescription
search. Never label any part of this "prescribe", "Rx", or "order".

This card also hosts the medication prep fields as a footer section — that is `T-25`, built on top
of the container this ticket creates.

---

## Files

- `app/visit/components/TreatmentSearchCard.tsx` — **new**, `'use client'`
- `app/visit/demoData.ts` — add `CATALOG` (`T-21 §7`)
- `app/visit/useVisitWorkflow.ts` — add the actions in §6

---

## Props

```tsx
type TreatmentSearchCardProps = {
  query: string;
  results: CatalogEntry[];
  searched: boolean;
  selected: CatalogEntry | null;      // derived.sel
  isApiError: boolean;                // derived.isApiError
  onQueryChange: (v: string) => void;
  onSearch: () => void;
  onQuickTerm: (term: string) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
  children?: React.ReactNode;         // T-25 mounts medication prep here
};
```

---

## Structure

```
<Card>
  <CardHeader title="Treatment search · Photon medication catalog"
              meta="Catalog lookup only · no prescribing" />

  <div class="px-[14px] py-3 flex flex-col gap-[11px]">
    <SearchRow />
    <QuickTerms />
    <SelectedTreatment />
    {hasResults  && <Results />}
    {noResults   && <NoResults />}
  </div>

  {selected && children}          ← T-25 medication prep, own top border
</Card>
```

`hasResults = searched && results.length > 0` · `noResults = searched && results.length === 0`.

Both depend on `searched`, so before the first search neither renders — the card shows only the
search row, the quick terms, and the selected-treatment card. That is the `Fresh visit` state, and
it is why `searched` exists as separate state rather than being inferred from `results.length`.

The medication prep section uses **`hasSelectionLoose`** (`selected !== null`), so it stays visible
during a lookup error. See `T-21 §4`.

---

## 1. Search row

```
flex gap-2 flex-wrap
```

### Search box

```
flex-1 min-w-[180px] flex items-center gap-2 h-9 px-[11px]
border border-line-input rounded-[7px] bg-surface-sunken
```

`h-9` is 36px. Contents:

```
<span class="text-[12px] text-muted-3" aria-hidden="true">⌕</span>
<input class="w-full border-none bg-transparent outline-none text-[12.5px] text-ink-2" />
```

The glyph is **U+2315 TELEPHONE RECORDER** (`⌕`) — that is genuinely the character the mockup uses
as a magnifier. It renders as a thin search glyph in most fonts. Copy it; do not substitute `🔍`, an
SVG icon, or `Q`.

Placeholder: `hydrocortisone, mupirocin, ondansetron…` (U+2026 ellipsis).

The input has `border-none outline-none` because the **box** is the visual control. Put the focus
ring on the wrapper via `focus-within:` — `focus-within:border-brand focus-within:ring-2
focus-within:ring-brand/15`. The bare input would otherwise be an unfocusable-looking field.

Wire `Enter` to `onSearch`. The mockup has no keyboard submit, and a search field that ignores Enter
is broken in a way nobody will report and everybody will feel. Wrap in a `<form onSubmit>` or handle
`onKeyDown`.

Label it: `<label class="sr-only" htmlFor="treatment-query">Search the Photon medication catalog</label>`.

### Search button

```
h-9 px-[15px] rounded-[7px] bg-brand text-white text-[12.5px] font-semibold border-none
```
→ `Search catalog`

`h-9` matches the box exactly. `px-[15px]` with `py-0` — height comes from `h-9`, not padding, which
is why this one does not use the `T-02` primary sizing.

---

## 2. Quick terms

```
flex gap-[6px] flex-wrap items-center
  <span class="text-[11px] text-muted-2">Try:</span>
  … 5 chips …
```

Chip:

```
bg-surface-muted border border-line-2 text-ink-5
text-[11px] font-medium px-[9px] py-1 rounded-[12px]
```

Terms, in order: `hydrocortisone` · `triamcinolone` · `mupirocin` · `lisinopril` · `ondansetron`

These are the five distinct `term` keys in `CATALOG`. Two of them (lisinopril, ondansetron) are not
dermatology drugs — they exist so an interviewer can type something outside the scripted scenario
and watch it work. Keep all five.

Clicking a chip sets the query **and** runs the search (§6). It is a shortcut, not a fill.

---

## 3. Selected-treatment card

The card's status display. Three mutually exclusive states.

```
rounded-[8px] px-[13px] py-3 border {toneClasses}
  flex justify-between items-start gap-[10px]
    div (min-w-0):
      <div class="text-[10px] font-semibold tracking-[.06em] uppercase mb-[3px] {headingColor}">{heading}</div>
      <div class="text-[13.5px] font-bold leading-[1.35]">{name}</div>
      <div class="flex gap-[7px] items-center mt-[6px] flex-wrap">
        <IdChip />
        <span class="text-[11px] text-muted">{form}</span>
      </div>
    div (flex flex-col items-end gap-[6px] shrink-0):
      <Badge tone={badgeTone}>{badgeLabel}</Badge>
      {selected && <ChangeLink />}
```

### The three states

| | `isApiError` | selected | none |
|---|---|---|---|
| heading | `Active treatment` | `Active treatment` | `No treatment selected` |
| heading color | `text-err-ink` | `text-ok-ink` | `text-muted-2` |
| name | `selected?.name ?? "Lookup failed"` | `selected.name` | `Search the catalog to pick one` |
| id chip text | `lookup failed` | `selected.id` | `awaiting selection` |
| form line | `Retry the catalog call` | `selected.form` | `""` (empty, renders nothing) |
| badge | `error` / `Failed` | `success` / `Treatment selected` | `neutral` / `None` |
| card bg | `bg-err-bg-2` (`#FEF4F3`) | `bg-ok-bg-3` (`#F7FBF9`) | `bg-surface-sunken` (`#FCFCFE`) |
| card border | `border-err-line-2` (`#F2C9C4`) | `border-ok-line-2` (`#CFE6DA`) | `border-line-2` (`#E4E7EF`) |

Evaluate `isApiError` **first** — a selected treatment with a failed lookup shows the error styling,
because the id it is displaying is not trustworthy.

`bg-ok-bg-3` (`#F7FBF9`) is a **new token** (`T-21 §5`) — a lighter green than `ok-bg-2` (`#F4FBF7`)
used by the review and handoff cards. Two greens that close together is unusual; it is what the
mockup does, and it keeps this card from competing with the handoff card for attention.

### ID chip

Unlike the patient chip (`T-23`) and the V2 treatment chip (`T-08`), this one **has a border**:

```
font-mono text-[10.5px] px-2 py-[3px] rounded-[5px] border
```

| state | classes |
|---|---|
| `isApiError` | `bg-err-bg border-err-line text-err-ink` |
| selected | `bg-brand-bg-3 border-brand-line-4 text-brand-ink` |
| none | `bg-surface-muted border-line text-muted-2` |

`--color-brand-line-4` (`#C9D2F5`) is new (`T-21 §5`).

### Change link

Only when `selected` (loose). Styled as a text link, not a button:

```
bg-transparent border-none p-0 text-[11px] font-semibold underline text-link-muted
```

`--color-link-muted` is `#6B7280` — Tailwind's stock `gray-500`, the one value in this design that
is not from the project palette (`T-21 §5`). Ship it, flag it in the PR.

It is still a `<button>` element. It is styled like a link because it is a small destructive-ish
affordance that should not compete with `Select`.

---

## 4. Results list

```
div
  header row: flex justify-between items-center mb-[7px]
    <span class="text-[10px] font-semibold tracking-[.06em] uppercase text-muted-3">{resultCount}</span>
    <span class="font-mono text-[10px] text-muted-4">GET /catalog/treatments</span>
  list: border border-line-soft rounded-[7px] overflow-hidden
    … rows …
```

`resultCount` pluralizes properly here, unlike the evidence log's `1 calls` (`T-14`):

```ts
`${results.length} catalog ${results.length === 1 ? "match" : "matches"}`
```

The mono `GET /catalog/treatments` label sitting above the results is the integration evidence,
inline. It tells a technical reviewer these rows came from an API call without making them open the
evidence log.

`overflow-hidden` on the list is required — rows have their own backgrounds and would square off the
7px radius.

### Row

```
flex items-center gap-[10px] px-[11px] py-[9px] border-b border-line-row-2
background: isSelected ? bg-brand-bg-2 (#F7F9FF) : bg-surface
  div (min-w-0 flex-1):
    <div class="text-[12.5px] font-semibold leading-[1.35]">{name}</div>
    <div class="flex gap-2 items-center mt-[3px] flex-wrap">
      <span class="font-mono text-[10px] text-muted">{id}</span>
      <span class="text-[10.5px] text-muted-2">{form}</span>
    </div>
  <SelectButton />
```

Every row carries `border-b`, including the last — same as the safety checklist (`T-09 §1`). It sits
inside the rounded container so it reads as a closing rule.

`min-w-0` on the text column stops long names pushing the button out.

### Select button

```
shrink-0 px-[11px] py-[5px] rounded-[6px] text-[11.5px] border
```

| state | label | classes |
|---|---|---|
| selected | `Selected` | `bg-brand-bg-3 text-brand-ink border-brand-line-4 font-bold` |
| not | `Select` | `bg-surface text-ink-4 border-line-strong font-semibold` |

Note the weight change: **700 when selected, 600 when not.** Same `xs` geometry as `T-21 §6.3`.

The selected row is doubly marked — tinted background *and* a filled button. Redundant on purpose;
the tint is easy to miss on a 9px row.

Give the button an `aria-pressed={isSelected}` and an accessible name that includes the drug, e.g.
`aria-label={`Select ${name}`}` — five buttons all reading "Select" is useless to a screen reader.

---

## 5. No-results state

```
border border-dashed border-line-input rounded-[7px] p-[14px]
text-center text-[12px] text-muted-2
```
> `No catalog matches for “{query}”. Try a generic medication name.`

**Curly quotes** — U+201C and U+201D around the query, not straight `"`. The advice (`Try a generic
medication name`) is the actionable half: the catalog is keyed on generic names, so `Vanos` finds
nothing and `fluocinonide` would.

Dashed border marks it as a placeholder rather than a result. It is one of only three dashed borders
in the design.

---

## 6. Actions

### `setQuery(v)`

Plain setter. No search side effect — typing does not query.

### `runSearch()`

```ts
const q = query.trim().toLowerCase();
if (!q) { showToast("Enter a medication name"); return; }

const r = CATALOG.filter(c => c.term.includes(q) || c.name.toLowerCase().includes(q));

set({
  results: r,
  searched: true,
  // a successful search clears a previous lookup error, but never invents one
  txLookup: r.length ? (txLookup === "error" ? "ok" : txLookup) : txLookup,
});
addLog("200", `GET /catalog/treatments → ${r.length} results`);
if (!r.length) showToast("No catalog matches");
```

Three things worth stating:

- Matching is `term.includes(q) || name.toLowerCase().includes(q)`, so `hydro` matches all three
  hydrocortisone entries by term, and `2.5%` matches two entries by name.
- **A zero-result search still logs `200`.** No matches is a successful query. Logging `404` would
  misrepresent what the API did — and this log is the app's evidence trail.
- `txLookup` is only *upgraded*, never downgraded. A search returning nothing does not put the app
  into the error state; only a real lookup failure does.

### `pickQuickTerm(term)`

```ts
const r = CATALOG.filter(c => c.term === term);          // exact, not includes
set({ query: term, results: r, searched: true, txLookup: r.length ? "ok" : txLookup });
addLog("200", `GET /catalog/treatments → ${r.length} results`);
```

Exact `term` match (not the fuzzy filter `runSearch` uses) — the chips are canonical keys, so they
should return exactly their group. Also note this sets `txLookup: "ok"` unconditionally on a hit,
where `runSearch` is conditional. Minor mockup inconsistency; both end in the same place. Follow it.

### `selectTreatment(id)`

```ts
const entry = CATALOG.find(c => c.id === id);
set({
  selectedId: id,
  txLookup: "ok",
  checks: { ...checks, dose: true },
  finalized: false,
});
addLog("200", `Selected treatment → ${id}`);
showToast(`Treatment selected · ${entry.name}`);
```

Selecting **ticks the `dose` safety check**, because picking a catalog entry is what fixes strength
and form. It also clears `finalized` — the handoff manifest names the treatment id.

It does **not** clear `aiForId`. That is what makes `staleForTx` fire (`T-27 §1`): the instructions
still exist, they are just for the previous drug, and the clinician note card grows a banner saying
so. Selecting a treatment while instructions are showing must **not** silently invalidate them —
it must visibly mark them stale.

The `Selected treatment → med_…` log row is not an HTTP call. It is logged at `200` anyway, as a
workflow event in the same timeline. The mockup does this and it is reasonable for an evidence log
whose job is "what happened, in order" — but note it in the PR, since a strict reading of "API
evidence log" would exclude it.

### `clearSelection()`

```ts
set({ selectedId: null, finalized: false, checks: { ...checks, dose: false } });
showToast("Treatment cleared");
```

Unticks `dose` — the inverse of selecting. No log row (nothing was called).

### `retryApi()` — rewritten from V2

The Photon error card's retry (`T-15`) no longer jumps phases:

```ts
const r = CATALOG.filter(c => c.term === "hydrocortisone");
set({ txLookup: "ok", results: r, searched: true, checks: { ...checks, dose: true } });
addLog("200", `GET /catalog/treatments → ${sel ? sel.id : `${r.length} results`}`);
showToast("Treatment lookup succeeded");
```

Toast drops the id suffix that V2 had (`… · med_8f21c94a` → just `Treatment lookup succeeded`).

---

## Acceptance criteria

- [ ] Boots with `hydrocortisone` in the field, 3 results listed, `Hydrocortisone cream 2.5%`
      selected and tinted, header `3 catalog matches`.
- [ ] Selected-treatment card is green (`#F7FBF9` on `#CFE6DA`) reading `Active treatment` /
      `Hydrocortisone cream 2.5%` / `med_8f21c94a` / `Topical cream · 30 g` / `Treatment selected`.
- [ ] Typing `lisinopril` and pressing **Enter** returns 2 results and logs
      `200 · GET /catalog/treatments → 2 results`.
- [ ] Typing `zzz` + Search shows the dashed no-match panel with curly quotes around `zzz`, toasts
      `No catalog matches`, still logs `200`, and does **not** enter the error state.
- [ ] Empty query + Search toasts `Enter a medication name` and logs nothing.
- [ ] Each quick-term chip returns exactly its group: 3 / 2 / 1 / 2 / 1.
- [ ] Selecting a different result: button flips to bold `Selected`, row tints, previous row
      reverts, toast names the drug, `dose` check ticks, `finalized` clears.
- [ ] Selecting a different treatment while instructions are showing makes the stale banner appear
      in the clinician note card (`T-27`) and blocks finalize with
      `Regenerate instructions for the new treatment`.
- [ ] `Change` clears the selection: card goes grey/`None`/`awaiting selection`, `dose` unticks,
      medication prep section disappears, toast `Treatment cleared`.
- [ ] With no selection, `Generate instructions` toasts `Select a treatment first` (`T-27 §1`).
- [ ] In the `Lookup error` scenario: card is red/`Failed`/`lookup failed`/`Retry the catalog call`,
      **and the medication prep section is still visible** (loose selection — `T-21 §4`).
- [ ] `Retry lookup` on the Photon error card restores 3 hydrocortisone results and clears the error.
- [ ] The `⌕` glyph renders as a search mark, not tofu.
- [ ] Search box shows a focus ring when the inner input is focused.
- [ ] Each `Select` button has a distinct accessible name.
- [ ] No hex literal in the file.

## Out of scope

Live Photon catalog calls (`T-20`'s `GET /api/photon/treatments` route — wired in `T-28 §6`),
pagination, fuzzy/typo-tolerant matching, favourites, recent searches, dose autocomplete from the
catalog entry. And under no circumstances: a prescribe action, an order button, or the word "Rx"
anywhere in this card.
