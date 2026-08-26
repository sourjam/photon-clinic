# T-18 — Assembly and visual QA

**Phase:** Integration · **Depends on:** T-01 … T-17 · **Blocks:** T-19
**Read first:** `T-00-design-reference.md`

---

## Context

Every card exists and works in isolation. This ticket wires them into `VisitWorkspace`, then walks
all six phases checking that the columns tell the *same story* — because the design's credibility
depends on cross-card consistency, and each previous ticket could only verify its own half of each
claim.

Three consistency contracts are load-bearing. If any one fails, the app is lying:

1. **`aiError` ⇒ Photon untouched.** All five milestones `pending`, log has exactly 2 rows,
   error copy says `The note was not sent to Photon`.
2. **`apiError` ⇒ only the treatment lookup failed.** Left column fully populated, milestones 1/2/4/5
   green and 3 red, handoff `Blocked`, `503` in three places with matching detail.
3. **`final` ⇒ a human signed.** Review card green, instructions badge `reviewed`, all four checks
   ticked, header pill green, manifest rendered, log ends `no Rx written`.

---

## File

`app/visit/VisitWorkspace.tsx` — replace the `T-01` skeleton with the full tree.

---

## 1. Composition

```tsx
"use client";

export function VisitWorkspace() {
  const { state, derived, actions } = useVisitWorkflow();
  // derive: status (T-04), treatmentIdState (T-08), handoffStatus (T-13),
  //         milestones = buildMilestones(state.phase),
  //         logEntries = [...buildLog(phase, finalized), ...threadRows]  (T-14 §4),
  //         hint = getActionHint(phase, reviewed)  (T-16)
  return ( … );
}
```

Tree, exactly (regions from `T-01 §6`, order from `T-00 §10`):

```
page div  (flex flex-col h-screen bg-page)
├── {showSwitcher && <PrototypeSwitcher/>}                       T-17
├── app div  (flex flex-col flex-1 min-h-0 overflow-auto wide:overflow-hidden)
│   ├── <AppHeader/>                                             T-04
│   ├── body div  (grid at wide, 62fr/38fr, gap-4)
│   │   ├── <section> LEFT  (flex flex-col gap-3 min-w-0 wide:overflow-y-auto wide:pr-1)
│   │   │   ├── <SectionHeader title="AI Prep" meta="OpenAI · clinician-reviewed"/>
│   │   │   ├── <PatientContextCard/>                            T-05
│   │   │   ├── <ClinicianNoteCard/>                             T-06
│   │   │   ├── {isAiError && <AiErrorCard/>}                    T-15
│   │   │   ├── <SpanishInstructionsCard/>                       T-07
│   │   │   ├── <MedicationPrepCard/>                            T-08
│   │   │   ├── <SafetyReviewCard/>                              T-09
│   │   │   ├── <ClinicianReviewCard/>                           T-10
│   │   │   └── <PatientFollowUpCard/>                           T-11
│   │   └── <aside> RIGHT  (same column classes)
│   │       ├── <SectionHeader title="Photon API" meta="Clinical API · no Elements"/>
│   │       ├── <PhotonConnectionCard/>                          T-12
│   │       ├── <SyncMilestonesCard/>                            T-12
│   │       ├── {isApiError && <PhotonErrorCard/>}               T-15
│   │       ├── <HandoffCard/>                                   T-13
│   │       └── <EvidenceLogCard/>                               T-14
│   └── <ActionBar/>                                             T-16
└── <Toast/>                                                     T-16  (sibling of app div)
```

`<section>`/`<aside>` with `aria-label` matching each section header gives the two columns real
landmarks. The right column is genuinely complementary content, so `<aside>` is correct.

Prop-drill from the hook. **No context provider** — `V2-PRD.md` defers it and the tree is 2 levels.

---

## 2. Cross-card consistency matrix

Walk every phase via the switcher and verify every cell. This table is the actual deliverable of
this ticket.

| | `idle` | `loading` | `review` | `final` | `aiError` | `apiError` |
|---|---|---|---|---|---|---|
| Header pill | amber `Preparing for Photon` | amber | amber | **green** `Prepared for Photon` | **red** `Action needed` | **red** `Action needed` |
| Note button | `Generate…` | `Generating…` + spinner | `Regenerate…` | `Regenerate…` | `Generate…` | `Regenerate…` |
| Note hint | policy | `OpenAI · gpt-4o-mini` | policy | policy | policy | policy |
| Instructions body | empty state | skeleton ×3 | **content** | content | **nothing** | **content** |
| Instructions badge | `Not generated` | `Generating…` | `needs review` / `reviewed` | `reviewed` | `Failed` | `needs review` |
| Treatment chip (T-08) | `awaiting lookup` | `awaiting lookup` | `med_8f21c94a` | `med_8f21c94a` | `awaiting lookup` | `lookup failed` |
| Review card | white, no button | white, no button | amber, button | **green** | white, no button | amber, button |
| AI error card | — | — | — | — | **shown** | — |
| Connection badge | `Not connected` | `Authenticated` | `Authenticated` | `Authenticated` | `Authenticated` | `Authenticated` |
| Milestones | 5 pending | 1 ok, 1 spinning, 3 pending | 5 ok | 5 ok | **5 pending** | 4 ok, **1 error** |
| Photon error card | — | — | — | — | — | **shown** |
| Handoff | `Waiting` white | `Waiting` white | `Not finalized` amber | **`Ready` green + manifest** | `Waiting` white | **`Blocked` red** |
| Log rows | 0 (`No calls yet.`) | 1 | 6 | **7** | **2** (1 red) | 6 (1 red) |
| Copy button | dimmed | dimmed | full | full | dimmed | full |
| Finalize | dimmed | dimmed | depends on checks | **green `Handoff prepared ✓`** | dimmed | **dimmed always** |
| Action hint | boundary line | `Generating…` | review prompt | boundary line | `nothing sent to Photon` | `handoff blocked` |

Row `Instructions body` at `aiError` is `nothing` — header and badge only. Row `Finalize` at
`apiError` is dimmed **regardless** of reviewed/checks state, because `canFinalize` requires
`!isApiError`.

---

## 3. Full happy-path walkthrough

Run this end to end without touching the switcher:

1. Load. Phase `idle`. Note pre-filled, all checks off, header amber, log empty.
2. Click `Generate Spanish instructions`. Spinner, skeleton, `1 calls` in the log.
3. ~1400ms later: content appears, badge amber `needs review`, review card amber, milestones all
   green, log 6 rows, handoff `Not finalized`.
4. Click `Finalize handoff` → toast `Mark the AI output reviewed first`. Nothing changes.
5. Click `Mark reviewed`. Review card green, instructions badge green.
6. Click `Finalize handoff` → toast `Complete the safety review first`.
7. Tick all four safety boxes. Badge → `3 synced · 1 clinician-reviewed` green.
8. Click `Finalize handoff` → toast `Handoff prepared — continue in Photon`, button turns green,
   header pill green, handoff manifest appears, log gains `handoff prepared · no Rx written`.
9. Click `Ejemplo: lactancia`, then `Translate to English →`. Patient bubble with flag pill, toast,
   log gains an `es→en` row.
10. Type a clinician reply, `Translate to Spanish →`. Clinician bubble, log gains `en→es`.
11. Click `Reset demo`. Everything back to step 1, thread empty, checks off.

Every step must work without a console error or a layout jump.

---

## 4. Layout QA

- [ ] **1360×900** (the design viewport): both columns fit with the left column scrolling and the
      right column ending near the fold. No horizontal scrollbar anywhere. Left column ≈808px,
      right ≈496px.
- [ ] **1024×768**: still two columns; right column at its content width, left compresses. Patient
      context cells may wrap — acceptable.
- [ ] **881×700**: two columns, right column at its 330px floor. Mono IDs do not overflow.
- [ ] **879×700**: single stacked column, AI Prep first, Photon API second, the app container
      scrolls as one, action bar at the bottom of the flow.
- [ ] **375×812**: usable. Header wraps to 2–3 lines, action bar buttons wrap, nothing clipped.
- [ ] Long content: paste 2000 characters into the clinician note. The textarea grows, the left
      column scrolls, the right column is unaffected, the action bar stays put.
- [ ] Send 15 thread messages. The evidence log scrolls internally at 200px; the right column does
      not grow unboundedly.
- [ ] No card ever overlaps the action bar.

---

## 5. Accessibility pass

- [ ] Tab through the entire page. Focus order: switcher → note textarea → generate → instruction
      buttons → safety checkboxes → review button → thread composer → action bar. Every stop has a
      visible focus indicator.
- [ ] All four safety checkboxes toggle with `Space` and announce checked state.
- [ ] Both textareas have accessible names.
- [ ] Toast announces via the always-mounted `aria-live` region; both error cards announce via
      `role="alert"`.
- [ ] Spanish content is inside `lang="es"`; the document is `lang="en"`.
- [ ] `prefers-reduced-motion: reduce` stops the spinner and the skeleton pulse; text labels still
      convey the state.
- [ ] Status dots and icon glyphs are `aria-hidden`; no meaning is carried by color alone
      (every colored state has a text label beside it — verify the milestone rows especially).
- [ ] Zoom to 200%: no content lost, no horizontal scroll at 1360px base.

---

## 6. Code QA

- [ ] `npm run build` passes with no warnings.
- [ ] `npx tsc --noEmit` clean. No `any`, no `@ts-expect-error`.
- [ ] `grep -rE '#[0-9A-Fa-f]{6}' app --include=*.tsx` returns **nothing**. All color lives in
      `app/globals.css`.
- [ ] No `useEffect` that writes state on mount except the two timers in `useVisitWorkflow`.
- [ ] Unmounting mid-`loading` and mid-toast produces no React warning.
- [ ] `'use client'` appears only where a component owns state or handlers — not in `ui/`.
- [ ] Every string rendered in the UI traces back to `demoData.ts` or a ticket's verbatim block.

---

## 7. Known deviations from the mockup (intended)

Record these in the PR description so nobody "fixes" them later:

| Deviation | Why |
|---|---|
| CSS media query instead of a JS `window.innerWidth` breakpoint | No resize listener, correct first paint (`T-01 §7`) |
| Boots to `idle`, not `final` | The mockup's `final` default was for screenshotting (`T-03 §3`) |
| Focus rings on all interactive elements | Mockup used `outline: none` throughout |
| Real `<input type="checkbox">` behind the styled box | Mockup used a clickable `<div>` (`T-09`) |
| `role="alert"` / `aria-live` regions | Not present in the mockup |
| `prefers-reduced-motion` handling | Not present in the mockup |
| Prototype switcher gated behind an env flag | Mockup always shows it (`T-17`) |

Everything else should be pixel-identical.

---

## Out of scope

Real OpenAI and Photon calls — `T-19`. Automated tests beyond manual QA. Performance work (this
tree is small; there is nothing to optimize yet).
