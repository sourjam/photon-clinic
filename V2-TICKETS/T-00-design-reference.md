# T-00 — Design Reference (shared appendix)

**Not a build ticket.** This is the extracted design system from
`V2-MOCK-HANDOFF/extracted/desktop-mockups-needed/project/Photon Clinic V2.dc.html`.
Every other ticket assumes you have read this file. It replaces the need to open the mockup.

Everything below was read directly out of the mockup source. Where the mockup expresses a value in
JS (`renderVals()`), it is written here as a plain value.

---

## 1. Canvas

- Design preview viewport: **1360 × 900** (`data-props: {"$preview":{"width":1360,"height":900}}`)
- Page fills the viewport: `height: 100vh`, column flex, no page-level scroll
- Background: `#F1F3F7`
- The **two content columns scroll independently**; the header, action bar and prototype switcher
  are fixed in the flex column.

### Responsive

There is exactly one breakpoint, driven in the mockup by `vw >= 880`:

| | `wide` (≥ 880px) | narrow (< 880px) |
|---|---|---|
| App container overflow | `hidden` | `auto` (whole page scrolls) |
| Header padding | `11px 20px` | `12px 16px` |
| Body display | `grid`, `minmax(0,62fr) minmax(330px,38fr)` | `flex column` |
| Body padding | `16px 20px 20px` | `14px 14px 18px` |
| Body overflow | `hidden` | `visible` |
| Column overflow | `overflow-y:auto; overflow-x:hidden; padding-right:4px` | none |

Body gap is `16px` at both sizes. Column gap (between cards inside a column) is `12px` at both sizes.

In Tailwind terms: narrow is the base style, `wide` maps to a custom `min-width: 880px` variant.
See `T-01 §4`.

---

## 2. Typography

Google Fonts, loaded with `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`:

```
Public Sans: 400, 500, 600, 700
IBM Plex Mono: 400, 500
```

- **Body font:** `'Public Sans', system-ui, -apple-system, sans-serif`
- **Mono font:** `'IBM Plex Mono', monospace` — used for IDs, timestamps, HTTP codes, endpoints,
  the environment badge, and the prototype-chrome label. Mono signals "machine-produced".
- `-webkit-font-smoothing: antialiased` on `body`
- `textarea { font-family: inherit }`, `button { font-family: inherit; cursor: pointer }`

### Type scale actually used (px)

| Size | Weight | Where |
|---|---|---|
| 9.5 | 400 mono | thread bubble timestamp |
| 10 | 600 | field labels (uppercase, `letter-spacing .06em`); prototype-chrome label (mono, `.1em`); thread speaker label (`.05em`) |
| 10.5 | 400 mono | milestone id line, evidence-log rows, treatment-id chip |
| 10.5 | 600 | flagged-question note in thread |
| 10.5 | 700 | **all badges** (`letter-spacing .02em`) |
| 11 | 400 | card-header meta text (`#8A90A0`), "Reading level" line, log count |
| 11 | 500 mono | environment badge, connection subtitle |
| 11.5 | 400/500 | header patient meta, action-bar hint, handoff body, milestone values, toast-adjacent text |
| 11.5 | 600 | overall-status pill label, connection scope values, handoff row values |
| 12 | 700 | section headers `AI PREP` / `PHOTON API` (uppercase, `letter-spacing .08em`) |
| 12 | 400/600 | error body text; small buttons |
| 12.5 | 500/600 | body values, checklist rows, thread body |
| 12.5 | 700 | **all card titles** |
| 12.5 | 600 | action-bar buttons |
| 13 | 400 | clinician-note textarea, Spanish instruction body (`line-height 1.65`) |
| 13 | 700 | Spanish instructions heading |
| 13.5 | 600 | header patient name |
| 13.5 | 700 | medication name |
| 15 | 700 | wordmark "Photon Clinic" (`letter-spacing -0.01em`) |

Line heights: `1.4` (checklist), `1.45`/`1.5` (thread EN gloss, error copy, handoff body), `1.55`
(note textarea, thread body), `1.65` (Spanish instruction paragraphs).

---

## 3. Color tokens

Names below are the token names `T-01` defines. Use these names everywhere.

### Neutrals / surfaces

| Token | Hex | Use |
|---|---|---|
| `page` | `#F1F3F7` | app background |
| `surface` | `#FFFFFF` | all cards, header, action bar |
| `surface-sunken` | `#FCFCFE` | textarea fill, thread composer area |
| `surface-muted` | `#F4F5F8` | neutral badge bg |
| `surface-alt` | `#F6F7FA` | clinician thread bubble |
| `surface-skeleton` | `#EDEFF4` | loading skeleton bars |
| `surface-pending` | `#F0F2F6` | pending milestone dot |

### Text

| Token | Hex | Use |
|---|---|---|
| `ink` | `#1A1D24` | primary text, toast bg |
| `ink-2` | `#22262F` | textarea text, dark chrome bg |
| `ink-3` | `#3A3F4C` | secondary body, completed checklist text |
| `ink-4` | `#3F4658` | ghost-button label |
| `ink-5` | `#4A5162` | section header, evidence-log message |
| `ink-6` | `#5A6072` | review body, handoff body, action-bar ghost label |
| `muted` | `#7A8090` | header meta, milestone id |
| `muted-2` | `#8A90A0` | card-header meta |
| `muted-3` | `#9096A6` | field labels, empty-state text |
| `muted-4` | `#A0A6B4` | log timestamps, thread timestamp |
| `muted-5` | `#A6ABBA` | placeholder text |

### Borders

| Token | Hex | Use |
|---|---|---|
| `line` | `#E1E5EE` | **card border**, header/action-bar border, section divider |
| `line-input` | `#DDE1EA` | textarea border |
| `line-2` | `#E4E7EF` | header divider, dashed rules, thread bubble (clinician) |
| `line-soft` | `#EEF0F5` | card-header bottom border |
| `line-softer` | `#F0F2F6` | patient-context cell dividers, connection inner rule |
| `line-row` | `#F2F4F8` | checklist row separators |
| `line-row-2` | `#F4F6F9` | milestone row separators |
| `line-strong` | `#D5DAE4` | ghost-button border |
| `line-strongest` | `#C9CEDA` | unchecked checkbox border, scrollbar thumb |

### Brand blue

| Token | Hex | Use |
|---|---|---|
| `brand` | `#3A50E4` | primary buttons, logo diamond, links, spinner accent |
| `brand-hover` | `#2E40C4` | link hover |
| `brand-ink` | `#2A3AB0` | Spanish-instruction heading, treatment-id chip text |
| `brand-ink-2` | `#3F4A8C` | env badge text, info badge text |
| `brand-ink-3` | `#5A66C0` | patient voice (thread label, EN gloss, example chip) |
| `brand-ink-4` | `#8088BE` | "Paciente · escriba en español" label |
| `brand-dot` | `#6B7CE8` | env badge dot |
| `brand-bg` | `#F4F6FB` | env badge bg, info badge bg |
| `brand-bg-2` | `#F7F9FF` | Spanish instruction panel, patient thread bubble |
| `brand-bg-3` | `#EDF0FF` | treatment-id chip bg |
| `brand-line` | `#DDE3F0` | env badge border, info badge border |
| `brand-line-2` | `#DFE5F6` | Spanish panel / patient bubble border |
| `brand-line-3` | `#CDD5EE` | Spanish composer border, example chip border |

### Green (synced / reviewed / ready)

| Token | Hex | Use |
|---|---|---|
| `ok` | `#0E8A5A` | solid: checkbox fill, milestone dot, review icon, finalized button |
| `ok-ink` | `#0B6B47` | success text |
| `ok-ink-2` | `#5A8A74` | muted success footnote |
| `ok-bg` | `#EAF7F0` | success badge bg |
| `ok-bg-2` | `#F4FBF7` | success card bg (review card, handoff card) |
| `ok-line` | `#BFE3CF` | success border |
| `ok-line-2` | `#CFE6DA` | handoff inner divider (solid + dashed) |

### Amber (needs review / safety)

| Token | Hex | Use |
|---|---|---|
| `warn` | `#E8B44A` | solid: lactation checkbox, review icon, quote bar, flag dot |
| `warn-ink` | `#8A6510` | warning text |
| `warn-ink-2` | `#9A6A00` | "Allergies"/"Raised in visit" field labels |
| `warn-ink-3` | `#7A5400` | those cells' values |
| `warn-ink-4` | `#6A5420` | lactation callout body inside Spanish panel |
| `warn-bg` | `#FDF8EE` | warning badge bg, highlighted context cells, lactation callout |
| `warn-bg-2` | `#FFFCF5` | warning card bg (review card, handoff card) |
| `warn-line` | `#EBD9B4` | warning border |

### Red (errors only)

| Token | Hex | Use |
|---|---|---|
| `err` | `#C5352A` | solid: error icon circle, danger button |
| `err-ink` | `#A32A21` | error title text |
| `err-ink-2` | `#8C443C` | error body text |
| `err-bg` | `#FEF1EF` | error badge bg / overall pill bg |
| `err-bg-2` | `#FEF4F3` | error card bg |
| `err-line` | `#F0C4BF` | error badge border |
| `err-line-2` | `#F2C9C4` | error card border |
| `err-line-3` | `#E5BDB8` | error ghost-button border |

### Prototype chrome (dev only, never product UI)

| Token | Hex |
|---|---|
| `chrome-bg` | `#22262F` |
| `chrome-inset` | `#171A21` |
| `chrome-line` | `#3A3F4C` |
| `chrome-text` | `#8E95A8` |
| `chrome-text-2` | `#9AA1B4` |

---

## 4. Radii & shapes

| Value | Use |
|---|---|
| `4px` | skeleton bars, checkbox, flag pill |
| `5px` | logo diamond, small chips, demo-switcher buttons, mono id chips |
| `6px` | env badge, overall pill, scrollbar thumb, lactation callout right side (`0 6px 6px 0`) |
| `7px` | **all buttons**, all textareas |
| `8px` | Spanish instruction inner panel |
| `9px` | **all cards**, toast, thread bubbles (with one 2px corner — see `T-11`) |
| `12px` | **all badges** (pill) |
| `13px` | example chip (`Ejemplo: lactancia`) |
| `50%` | status dots, error icon, milestone dots, review icon |

Only one shadow exists in the whole design: the toast,
`0 12px 30px -8px rgba(0,0,0,.4)`. **Cards have no shadow** — separation comes from a 1px border.

---

## 5. Recurring recipes

### 5.1 Card

```
background: surface
border: 1px solid line          (#E1E5EE)
border-radius: 9px
```

Card header (when present):

```
padding: 10px 14px
border-bottom: 1px solid line-soft   (#EEF0F5)
title: 12.5px / 700 / ink
optional right slot: 11px / 400 / muted-2, or a Badge
layout: flex, space-between, align-center, gap 10px
```

Card body padding varies per card — each ticket states it exactly.

### 5.2 Badge (used ~10 places)

```
font-size: 10.5px
font-weight: 700
letter-spacing: .02em
padding: 3px 9px
border-radius: 12px
white-space: nowrap
background / border(1px) / color = one of the four tones below
```

| Tone | bg | border | color |
|---|---|---|---|
| `neutral` | `#F4F5F8` | `#E1E5EE` | `#8A90A0` |
| `info` | `#F4F6FB` | `#DDE3F0` | `#3F4A8C` |
| `success` | `#EAF7F0` | `#BFE3CF` | `#0B6B47` |
| `warn` | `#FDF8EE` | `#EBD9B4` | `#8A6510` |
| `error` | `#FEF1EF` | `#F0C4BF` | `#A32A21` |

### 5.3 Field label (used ~15 places)

```
font-size: 10px
font-weight: 600
letter-spacing: .06em
text-transform: uppercase
color: muted-3 (#9096A6)   — or warn-ink-2 (#9A6A00) in highlighted cells
margin-bottom: 3px
```

### 5.4 Buttons

| Variant | bg | color | border | padding | radius | font |
|---|---|---|---|---|---|---|
| `primary` | `brand` | `#fff` | none | `9px 16px` | 7px | 12.5px/600 |
| `primary-sm` | `brand` | `#fff` | none | `7px 13px` | 7px | 12px/600 |
| `ghost` | `#fff` | `ink-4` | `1px line-strong` | `9px 14px` | 7px | 12.5px/600 |
| `ghost-sm` | `#fff` | `ink-4` | `1px line-strong` | `6px 12px` | 7px | 12px/600 |
| `success` | `ok` | `#fff` | none | `9px 16px` | 7px | 12.5px/600 |
| `success-sm` | `ok-bg` | `ok-ink` | `1px ok-line` | `7px 13px` | 7px | 12px/600 |
| `danger-sm` | `err` | `#fff` | none | `7px 13px` | 7px | 12px/600 |
| `danger-ghost-sm` | `#fff` | `err-ink-2` | `1px err-line-3` | `7px 13px` | 7px | 12px/600 |

**Disabled/blocked look = `opacity: 0.45`.** The mockup never sets `disabled`; blocked buttons stay
clickable and fire a toast explaining what is missing. Preserve that — it is better UX than a dead
button, and `T-16` specifies the toast messages.

### 5.5 Section header (`AI PREP`, `PHOTON API`)

```
flex row, align-center, gap 9px, margin-bottom 4px
h2:    12px / 700 / letter-spacing .08em / uppercase / ink-5 (#4A5162) / margin 0
rule:  flex:1; height:1px; background: line (#E1E5EE)
meta:  11px / 400 / muted-2 (#8A90A0)
```

---

## 6. Animation

Two keyframes, both defined globally:

```css
@keyframes spin  { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
```

Usage:

- **Spinner (in-button):** `12px × 12px`, `border: 2px solid rgba(255,255,255,.35)`,
  `border-top-color: #fff`, `border-radius: 50%`, `animation: spin .7s linear infinite`.
- **Spinner (milestone dot):** `18px × 18px`, `background: #fff`, `border: 2px solid #DDE3F0`,
  `border-top-color: #3A50E4`, `animation: spin .7s linear infinite`.
- **Skeleton bars:** `animation: pulse 1.3s ease-in-out infinite`, staggered `0s / .15s / .3s`.

Respect `prefers-reduced-motion: reduce` — swap both animations for a static state. The mockup does
not do this; we do. (See `T-01 §5`.)

Custom scrollbar (WebKit):

```css
::-webkit-scrollbar { height: 8px; width: 8px; }
::-webkit-scrollbar-thumb { background: #C9CEDA; border-radius: 6px; }
```

---

## 7. Phase model (summary — full spec in `T-03`)

Six phases drive the entire screen:

```
'idle' | 'loading' | 'review' | 'final' | 'aiError' | 'apiError'
```

Derived booleans every component reads:

```ts
isIdle          = phase === 'idle'
isLoading       = phase === 'loading'
isAiError       = phase === 'aiError'
isApiError      = phase === 'apiError'
hasInstructions = phase === 'review' || phase === 'final' || phase === 'apiError'
finalized       = state.finalized && phase === 'final'
allChecked      = all 4 safety checks true
canReview       = hasInstructions
canFinalize     = hasInstructions && reviewed && allChecked && !isApiError
```

Note the non-obvious one: **`apiError` still shows generated instructions.** The story is "the AI
worked, Photon's treatment lookup did not", so the left column is populated while the right column
shows a failure and the handoff is blocked.

---

## 8. Fixed demo content (verbatim — copy, do not retype)

Lives in `app/visit/demoData.ts`. Full strings appear in the tickets that consume them.

- Patient: `Maria Gonzalez`, `DOB 1988-04-12 · Spanish`, `Dermatology · suspected eczema flare`
- Environment: `NEUTRON · sandbox`, `api.neutron.health · oauth2`
- Photon patient id: `pat_01HQ7K4M2Z` · Treatment id: `med_8f21c94a`
- Medication: `Hydrocortisone cream 2.5%`, `30 g tube`, `0` refills, 7 days
- Allergy: `Sulfa` · Current med: `Prenatal vitamin` · Flag: `Breastfeeding question`
- Reviewer: `Dr. A. Okafor`, `10:42`
- Model attribution: `OpenAI · gpt-4o-mini`

---

## 9. File layout (do not deviate)

```
app/
  globals.css                        # T-01: @theme tokens, keyframes, base rules
  layout.tsx                         # T-01: fonts, metadata, html lang
  page.tsx                           # T-01: server component → <VisitWorkspace />
  visit/
    types.ts                         # T-03
    demoData.ts                      # T-03 (+ each card ticket appends its fixture)
    useVisitWorkflow.ts              # T-03: the state machine hook
    VisitWorkspace.tsx               # T-01 skeleton → T-18 full assembly ('use client')
    components/
      ui/
        Card.tsx                     # T-02
        CardHeader.tsx               # T-02
        Badge.tsx                    # T-02
        Button.tsx                   # T-02
        FieldLabel.tsx               # T-02
        SectionHeader.tsx            # T-02
        Spinner.tsx                  # T-02
      AppHeader.tsx                  # T-04
      PatientContextCard.tsx         # T-05
      ClinicianNoteCard.tsx          # T-06
      SpanishInstructionsCard.tsx    # T-07
      MedicationPrepCard.tsx         # T-08
      SafetyReviewCard.tsx           # T-09
      ClinicianReviewCard.tsx        # T-10
      PatientFollowUpCard.tsx        # T-11
      PhotonConnectionCard.tsx       # T-12
      SyncMilestonesCard.tsx         # T-12
      HandoffCard.tsx                # T-13
      EvidenceLogCard.tsx            # T-14
      AiErrorCard.tsx                # T-15
      PhotonErrorCard.tsx            # T-15
      ActionBar.tsx                  # T-16
      Toast.tsx                      # T-16
      PrototypeSwitcher.tsx          # T-17
```

---

## 10. Column composition order

**Left column (`AI PREP`, 62fr):**
1. SectionHeader — `AI Prep` / meta `OpenAI · clinician-reviewed`
2. PatientContextCard
3. ClinicianNoteCard
4. AiErrorCard *(only when `isAiError`)*
5. SpanishInstructionsCard
6. MedicationPrepCard
7. SafetyReviewCard
8. ClinicianReviewCard
9. PatientFollowUpCard

**Right column (`PHOTON API`, 38fr, min 330px):**
1. SectionHeader — `Photon API` / meta `Clinical API · no Elements`
2. PhotonConnectionCard
3. SyncMilestonesCard
4. PhotonErrorCard *(only when `isApiError`)*
5. HandoffCard
6. EvidenceLogCard

Below both: ActionBar (full width). Above everything: PrototypeSwitcher (dev only), then AppHeader.
Toast is `position: fixed`, `bottom: 70px`, centered.
