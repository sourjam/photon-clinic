# T-04 — App header: wordmark, patient identity, environment badge, overall status pill

**Phase:** Chrome · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

---

## Context

The header is the 30-second explainer. A reviewer glancing at this app should read, left to right:
*what tool this is → who the patient is → why they're here → which Photon environment → how far
along the handoff is.* It is one flex row, 48px tall, and it never scrolls.

---

## File

`app/visit/components/AppHeader.tsx` — `'use client'` not required (no handlers); it takes derived
values as props.

---

## Props

```tsx
type AppHeaderProps = {
  patientName: string;      // PATIENT.name
  patientMeta: string;      // PATIENT.meta
  visitSummary: string;     // PATIENT.visit
  environment: string;      // PHOTON.env
  status: OverallStatus;    // see §3
};

type OverallStatus = "preparing" | "prepared" | "actionNeeded";
```

---

## 1. Container

```
flex items-center gap-[14px] flex-wrap
px-4 py-3 bg-surface border-b border-line
wide:px-5 wide:py-[11px]
```

(`px-4 py-3` = `12px 16px` narrow; `wide:px-5 wide:py-[11px]` = `11px 20px`.)

`flex-wrap` matters — at narrow widths the pills drop to a second line rather than compressing the
patient name.

---

## 2. Children, in order

### 2.1 Wordmark

```
div: flex items-center gap-[11px]
  div: w-[17px] h-[17px] bg-brand rounded-[5px] rotate-45      ← the logo diamond
  div: flex items-baseline gap-2
    span: text-[15px] font-bold tracking-[-0.01em]   → "Photon Clinic"
    span: text-[11.5px] text-muted-2 font-medium     → "Clinician workspace"
```

The mark is a 17px rounded square rotated 45°. It has no glyph inside. Do not substitute an icon,
an SVG, or an emoji.

### 2.2 Divider

```
div: w-px h-[26px] bg-line-2
```

### 2.3 Patient identity

```
div: flex items-baseline gap-[7px]
  span: text-[13.5px] font-semibold          → patientName
  span: text-[11.5px] text-muted             → patientMeta   ("DOB 1988-04-12 · Spanish")
```

### 2.4 Visit summary

```
div: text-[11.5px] text-muted                → visitSummary  ("Dermatology · suspected eczema flare")
```

### 2.5 Spacer

```
div: flex-1 min-w-[8px]
```

`min-w-[8px]` guarantees at least a small gap when the row is tight before wrapping kicks in.

### 2.6 Environment badge

Not a `<Badge>` — different shape (6px radius, has a dot, mono type):

```
div: flex items-center gap-[6px] bg-brand-bg border border-brand-line rounded-[6px] px-[9px] py-1
  span: w-[6px] h-[6px] rounded-full bg-brand-dot
  span: font-mono text-[11px] font-medium text-brand-ink-2    → environment ("NEUTRON · sandbox")
```

This badge is **static**. It reflects which credentials the app is configured with, not a live
connection — `T-12`'s connection card is what reports reachability. Keeping them separate is the
point: a reviewer should be able to tell "configured for sandbox" apart from "authenticated".

### 2.7 Overall status pill

Same shape as the env badge, different palette, and it **is** phase-driven:

```
div: flex items-center gap-[7px] rounded-[6px] px-[10px] py-1 border
  span: w-[6px] h-[6px] rounded-full            ← dot
  span: text-[11.5px] font-semibold             ← label
```

---

## 3. Status palette

Derive `status` in `VisitWorkspace` from the workflow (`T-03 §5`), not inside the header:

```ts
const status: OverallStatus =
  finalized ? "prepared"
  : (isAiError || isApiError) ? "actionNeeded"
  : "preparing";
```

| status | label | bg | border | text | dot |
|---|---|---|---|---|---|
| `prepared` | `Prepared for Photon` | `bg-ok-bg` | `border-ok-line` | `text-ok-ink` | `bg-ok` |
| `actionNeeded` | `Action needed` | `bg-err-bg` | `border-err-line` | `text-err-ink` | `bg-err` |
| `preparing` | `Preparing for Photon` | `bg-warn-bg` | `border-warn-line` | `text-warn-ink` | `bg-warn` |

Note the default is **amber, not grey** — even at `idle`, before anything has happened, the pill
reads `Preparing for Photon` in amber. That is deliberate: the workspace is always mid-visit; there
is no neutral "nothing doing" state at the top level.

Amber `#E8B44A` on `#FDF8EE` with `#8A6510` text: the text/bg pair is the contrast-carrying one
(≈5.9:1). The dot is decorative — mark it `aria-hidden="true"` in all three variants, since the
label already carries the meaning.

---

## Acceptance criteria

- [ ] Header renders at 1360px as a single row, total height 48px (±1px).
- [ ] The diamond is a rotated rounded square, 17px, `#3A50E4`, with nothing inside it.
- [ ] All three status variants render with the exact hex triples above.
- [ ] At `idle` the pill reads `Preparing for Photon` in amber (**not** grey, **not** "Not started").
- [ ] At `aiError` **and** at `apiError` the pill reads `Action needed` in red.
- [ ] The pill only reads `Prepared for Photon` when `finalized` is true — reaching `phase='final'`
      with `finalized=false` is impossible per `T-03 §4`, but if you can produce it, the pill must
      stay amber.
- [ ] `NEUTRON · sandbox` renders in IBM Plex Mono; `Maria Gonzalez` renders in Public Sans.
- [ ] At 700px viewport width the row wraps and no text is clipped or ellipsized.
- [ ] Status dots are `aria-hidden`.
- [ ] No hex literal in the file.

## Out of scope

The dark prototype-control strip above the header is `T-17` — it is not product UI and must not be
styled to look like part of the header.
