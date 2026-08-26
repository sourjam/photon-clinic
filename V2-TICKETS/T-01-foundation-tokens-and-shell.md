# T-01 — Foundation: design tokens, fonts, and the app shell

**Phase:** Foundation · **Depends on:** nothing · **Blocks:** everything
**Read first:** `T-00-design-reference.md`

---

## Context

Photon Clinic V2 is a single-screen clinician workspace. This ticket lays the ground: font loading,
the Tailwind v4 token layer, global keyframes, and the empty two-column shell that every other
ticket fills in. Nothing here is visible product content — success is a correctly proportioned
empty frame at 1360×900.

`app/page.tsx`, `app/layout.tsx` and `app/globals.css` currently hold the untouched vinext starter.
You are replacing all three.

---

## Files you touch

| File | Action |
|---|---|
| `app/globals.css` | rewrite |
| `app/layout.tsx` | rewrite |
| `app/page.tsx` | rewrite |
| `app/visit/VisitWorkspace.tsx` | create (skeleton) |

---

## 1. Fonts

Load Public Sans (400/500/600/700) and IBM Plex Mono (400/500) from Google Fonts. The mockup uses
raw `<link>` tags with preconnect:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Put these in `app/layout.tsx`'s `<head>`. (This project is vinext, not stock Next — do **not** reach
for `next/font`; it is not part of this stack. Plain `<link>` tags are correct here.)

`app/layout.tsx` also sets:

```tsx
export const metadata: Metadata = {
  title: "Photon Clinic — Clinician workspace",
  description: "AI-prepared visit context, synced to Photon. Prescribing happens in Photon.",
};
```

Keep `<html lang="en">`. The Spanish content inside the page gets `lang="es"` at the component
level (see `T-07`, `T-11`) — **do not** change the document language.

---

## 2. `app/globals.css` — token layer

Tailwind v4 reads `@theme` for token definitions. Write the whole file:

```css
@import "tailwindcss";

@theme {
  /* ---- surfaces ---- */
  --color-page:            #F1F3F7;
  --color-surface:         #FFFFFF;
  --color-surface-sunken:  #FCFCFE;
  --color-surface-muted:   #F4F5F8;
  --color-surface-alt:     #F6F7FA;
  --color-surface-skeleton:#EDEFF4;
  --color-surface-pending: #F0F2F6;

  /* ---- ink ---- */
  --color-ink:    #1A1D24;
  --color-ink-2:  #22262F;
  --color-ink-3:  #3A3F4C;
  --color-ink-4:  #3F4658;
  --color-ink-5:  #4A5162;
  --color-ink-6:  #5A6072;
  --color-muted:   #7A8090;
  --color-muted-2: #8A90A0;
  --color-muted-3: #9096A6;
  --color-muted-4: #A0A6B4;
  --color-muted-5: #A6ABBA;

  /* ---- lines ---- */
  --color-line:          #E1E5EE;
  --color-line-input:    #DDE1EA;
  --color-line-2:        #E4E7EF;
  --color-line-soft:     #EEF0F5;
  --color-line-softer:   #F0F2F6;
  --color-line-row:      #F2F4F8;
  --color-line-row-2:    #F4F6F9;
  --color-line-strong:   #D5DAE4;
  --color-line-strongest:#C9CEDA;

  /* ---- brand ---- */
  --color-brand:        #3A50E4;
  --color-brand-hover:  #2E40C4;
  --color-brand-ink:    #2A3AB0;
  --color-brand-ink-2:  #3F4A8C;
  --color-brand-ink-3:  #5A66C0;
  --color-brand-ink-4:  #8088BE;
  --color-brand-dot:    #6B7CE8;
  --color-brand-bg:     #F4F6FB;
  --color-brand-bg-2:   #F7F9FF;
  --color-brand-bg-3:   #EDF0FF;
  --color-brand-line:   #DDE3F0;
  --color-brand-line-2: #DFE5F6;
  --color-brand-line-3: #CDD5EE;

  /* ---- ok / green ---- */
  --color-ok:        #0E8A5A;
  --color-ok-ink:    #0B6B47;
  --color-ok-ink-2:  #5A8A74;
  --color-ok-bg:     #EAF7F0;
  --color-ok-bg-2:   #F4FBF7;
  --color-ok-line:   #BFE3CF;
  --color-ok-line-2: #CFE6DA;

  /* ---- warn / amber ---- */
  --color-warn:       #E8B44A;
  --color-warn-ink:   #8A6510;
  --color-warn-ink-2: #9A6A00;
  --color-warn-ink-3: #7A5400;
  --color-warn-ink-4: #6A5420;
  --color-warn-bg:    #FDF8EE;
  --color-warn-bg-2:  #FFFCF5;
  --color-warn-line:  #EBD9B4;

  /* ---- err / red ---- */
  --color-err:        #C5352A;
  --color-err-ink:    #A32A21;
  --color-err-ink-2:  #8C443C;
  --color-err-bg:     #FEF1EF;
  --color-err-bg-2:   #FEF4F3;
  --color-err-line:   #F0C4BF;
  --color-err-line-2: #F2C9C4;
  --color-err-line-3: #E5BDB8;

  /* ---- prototype chrome (dev only) ---- */
  --color-chrome-bg:     #22262F;
  --color-chrome-inset:  #171A21;
  --color-chrome-line:   #3A3F4C;
  --color-chrome-text:   #8E95A8;
  --color-chrome-text-2: #9AA1B4;

  /* ---- fonts ---- */
  --font-sans: 'Public Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  /* ---- the single breakpoint (T-00 §1) ---- */
  --breakpoint-wide: 880px;
}
```

`--breakpoint-wide` gives you the `wide:` variant (`wide:grid`, `wide:overflow-hidden`, …).
Tailwind v4 derives variants from `--breakpoint-*` automatically. **Every responsive rule in this
codebase uses `wide:` and nothing else** — do not introduce `sm:`/`md:`/`lg:`.

---

## 3. `app/globals.css` — base layer

Append after `@theme`:

```css
@layer base {
  *{ box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    background: var(--color-page);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    color: var(--color-ink);
  }
  a { color: var(--color-brand); text-decoration: none; }
  a:hover { color: var(--color-brand-hover); text-decoration: underline; }
  textarea { font-family: inherit; }
  textarea::placeholder { color: var(--color-muted-5); }
  button { font-family: inherit; cursor: pointer; }
  ::-webkit-scrollbar { height: 8px; width: 8px; }
  ::-webkit-scrollbar-thumb { background: var(--color-line-strongest); border-radius: 6px; }
}
```

Delete the starter's `:root { color-scheme … }` block and its Inter font stack.

**Do not add a dark mode.** The design is light-only and every token is a fixed clinical value.

---

## 4. `app/globals.css` — animation layer

```css
@keyframes spin  { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }

@utility animate-spin-fast { animation: spin .7s linear infinite; }
@utility animate-pulse-soft { animation: pulse 1.3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .animate-spin-fast, .animate-pulse-soft { animation: none; }
}
```

The reduced-motion rule is an addition to the mockup, not a departure from it — a static spinner
still reads as "in flight" because the surrounding label says `Generating…` / `syncing`.

---

## 5. `app/page.tsx`

Server component, nothing else:

```tsx
import { VisitWorkspace } from "./visit/VisitWorkspace";

export default function Page() {
  return <VisitWorkspace />;
}
```

Remove `export const revalidate` and the entire starter body.

---

## 6. `app/visit/VisitWorkspace.tsx` — the shell

`'use client'`. In this ticket it renders empty regions with the exact box model; `T-18` fills them.

Structure and the classes that produce it:

```
<div>                                     page:  flex flex-col h-screen bg-page
  <div data-region="prototype-chrome" />   T-17 mounts here (fixed height, not flex:1)
  <div>                                    app:   flex flex-col flex-1 min-h-0 bg-page
                                                  overflow-auto  wide:overflow-hidden
    <header data-region="header" />        T-04
    <div>                                  body:  see below
      <section data-region="left" />       left column
      <aside  data-region="right" />       right column
    </div>
    <div data-region="action-bar" />       T-16
  </div>
  <!-- T-16 renders <Toast /> here, outside the app container -->
</div>
```

**Body container classes** (this is the load-bearing part — get it exactly right):

```
flex flex-col gap-4 p-[14px_14px_18px] flex-1 min-h-0 items-stretch overflow-visible
wide:grid wide:grid-cols-[minmax(0,62fr)_minmax(330px,38fr)] wide:p-[16px_20px_20px] wide:overflow-hidden
```

- `gap-4` is 16px — matches the mockup's `gap: '16px'` at both widths.
- `62fr / 38fr` with `minmax(0, …)` on the left is what stops long mono IDs from blowing out the
  grid. Keep both `minmax` wrappers.
- The right column has a **hard 330px floor**; below that the grid would crush the evidence log.

**Column classes** (identical for both columns):

```
flex flex-col gap-3 min-w-0
wide:min-h-0 wide:overflow-y-auto wide:overflow-x-hidden wide:pr-1
```

- `gap-3` is 12px — the card spacing inside a column.
- `min-w-0` on both columns is required, otherwise mono text in the evidence log forces overflow.
- The columns scroll **independently** at `wide`; at narrow the whole app container scrolls and the
  columns do not.

---

## 7. Why this shell, stated once

The mockup implements the breakpoint in JS (`window.innerWidth >= 880`, re-measured on `resize`).
**Do not port that.** A JS-measured breakpoint means a resize listener, a `vw` state field, and a
first paint at the wrong width during hydration. CSS media queries give the same result with none
of it. This is the one place where "match the visual output, not the prototype's structure" (handoff
README) has real teeth.

---

## Acceptance criteria

- [ ] `npm run build` passes.
- [ ] `npm run dev` at 1360×900 shows a `#F1F3F7` page with no scrollbar on `<body>`.
- [ ] DevTools shows the body as a 2-column grid; measured column widths are ~808px and ~496px.
      (1360 − 40px horizontal padding − 16px gap = 1304 available, split 62/38.) Tolerance ±2px.
- [ ] At 879px wide, the layout is a single stacked column and the app container scrolls.
- [ ] At 881px wide, it is two columns and each column scrolls independently.
- [ ] A test element with `class="text-brand font-mono text-[12.5px]"` renders `#3A50E4`,
      IBM Plex Mono, 12.5px. (Confirms tokens, font loading, and arbitrary values all work.)
- [ ] `document.fonts.check("700 15px 'Public Sans'")` is `true` after load.
- [ ] No `next/font` import anywhere.
- [ ] No hex literal appears in any `.tsx` file.

## Out of scope

Header content, cards, action bar, state — every one of those is its own ticket. Ship an empty
frame. Resist filling it.
