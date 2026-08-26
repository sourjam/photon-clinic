# T-19 — Server action seams for real OpenAI and Photon

**Phase:** Next phase · **Depends on:** T-18 · **Blocks:** nothing
**Read first:** `T-00-design-reference.md`, then `V2-PRD.md` §"Photon API Maximization Plan"

**This ticket is not required for design parity.** T-01 … T-18 produce a complete, demo-ready UI on
fixture data. This one replaces the fixtures with real calls. Scope it separately; it is where the
interview's technical depth actually lives, and it should not be rushed to make a pixel deadline.

---

## Context

The mockup fakes three things: a 1400ms timer standing in for OpenAI, a phase-keyed table standing
in for Photon's responses, and keyword regexes standing in for translation. Each has a single call
site, deliberately, so this ticket is a swap rather than a rewrite.

The product constraint from `V2-PRD.md` is firm: **maximize real Photon backend Clinical API usage,
stop short of Photon Elements and prescription writing.** The UI already reflects that boundary —
`Prescribe scope: not requested` (`T-12`), the handoff footnote (`T-13`), `no Rx written` in the log
(`T-14`). Do not add an endpoint that would make any of those statements false.

---

## The three seams

| # | Fixture | Location | Replace with |
|---|---|---|---|
| 1 | `setTimeout(…, 1400)` in `generate()` | `useVisitWorkflow.ts` (`T-03 §4`) | `POST /api/instructions` |
| 2 | `buildMilestones(phase)` / `buildLog(phase, finalized)` | `demoData.ts` (`T-12 §3`, `T-14 §3`) | real per-call state accumulated from Photon responses |
| 3 | `esToEn` / `enToEs` / `isClinical` | `T-11 §4` | `POST /api/translate` |

---

## 1. Architecture

Per `V2-PRD.md` §"Thin Architecture With Real Photon" — keep it small. No service interfaces, no
adapter factories, no repository layer, no D1.

```
app/api/instructions/route.ts    generatePatientInstructions(note, patientContext)
app/api/photon/sync/route.ts     syncPatient + treatment lookup + safety sync (one orchestrated call)
app/api/translate/route.ts       translate(text, direction) + clinical-topic classification
lib/ai.ts                        OpenAI client + the two prompts
lib/photon.ts                    token exchange, graphqlRequest, patient/treatment/safety helpers
lib/types.ts                     request/response types shared by routes and the hook
```

Zod validation at the two network boundaries (request bodies in, provider responses out) and
nowhere else. Secrets are Worker bindings — never `NEXT_PUBLIC_*`, never reachable from the client.

The client keeps owning workflow state. These routes return data; they do not own the phase.

---

## 2. Seam 1 — OpenAI instructions

`generate()` becomes: set `phase='loading'` → `await fetch('/api/instructions', …)` → on success
`phase='review'` with the returned text in state; on failure `phase='aiError'`.

The response must be **structured**, because `T-07` renders five distinct blocks, one of which is a
styled lactation callout:

```ts
type InstructionsResponse = {
  headingEs: string;        // "Crema de hidrocortisona 2.5% — cómo usarla"
  blocks: Array<
    | { kind: "text"; es: string }
    | { kind: "callout"; es: string }   // renders with the amber left bar
  >;
  plainText: string;        // the clipboard version (T-03 SPANISH_INSTRUCTIONS_PLAIN shape)
};
```

Do **not** return a markdown blob and parse it in the component. The callout is a semantic
distinction the model should make — "this is the part where I decline to answer and defer to the
clinician" — and typing it forces the prompt to be explicit about that.

### Prompt requirements (from `design-PRD.md` §"AI Behavior")

- Plain-language Spanish, no idioms, respectful tone.
- **Preserve medication names, dose numbers and frequencies exactly.** Verify this in output.
- Never answer a patient's medical question — flag it for the clinician.
- Never invent a diagnosis, medication, or dose.
- Flag uncertainty rather than guessing.
- Emit the breastfeeding/lactation guidance as a `callout` block, phrased so the clinician must
  confirm before the patient starts.

Fall back to `SPANISH_INSTRUCTIONS_PLAIN` if the model returns unparseable output? **No.** Fail to
`aiError` and let the clinician retry or write manually (`T-15`). Silently substituting fixture text
for a failed generation would be the worst possible bug in this product.

---

## 3. Seam 2 — Photon Clinical API

Order, per `V2-PRD.md` §"Photon API Maximization Plan":

1. **Auth** — M2M token exchange server-side. Milestone `Auth check`, id `token · {expires}s`.
2. **Patient create/update** — stable `externalId` so re-running the demo updates rather than
   duplicating. Milestone `Patient sync`, id = returned Photon patient ID.
3. **Treatment/catalog search** — for the prepared medication. Milestone `Treatment lookup`,
   id = returned treatment ID. This one gates the handoff (`canFinalize`).
4. **Allergy sync** — milestone `Allergy history`, id `{n} record · {names}`.
5. **Medication history sync** — milestone `Medication history`, id `{n} record · {names}`.

Five calls, five milestones, same labels and same order as `T-12`. The UI does not change.

### State shape

Replace `buildMilestones(phase)` with real per-milestone state:

```ts
type SyncState = Record<MilestoneLabel, { status: MilestoneStatus; id: string }>;
```

`buildLog` similarly becomes an append-only array the routes populate with real timestamps, methods,
paths and status codes. Keep the existing `LogEntry` shape (`T-03`) — the rendering in `T-14` needs
no change, which is the payoff of having typed it up front.

### Error mapping

- Treatment lookup fails → `phase='apiError'`, that milestone `error` with the real code, the
  other four keep their real statuses. `T-15`'s copy (`Patient and safety sync succeeded`) must
  match what actually happened — if patient sync also failed, the copy is wrong and needs a
  variant. Handle that case or constrain the demo so it cannot occur.
- Auth fails → this is not a phase the design covers. Add a variant of `PhotonErrorCard` naming the
  auth failure, and leave all five milestones `error`/`pending` accordingly. Flag this gap to the
  user before building it — it is new design surface, not a translation of existing design.

### The boundary

Never call a prescribe endpoint. Never request a prescribe scope. If sandbox credentials happen to
grant one, the app still must not use it, and `Prescribe scope: not requested` must stay literally
true.

---

## 4. Seam 3 — translation

`POST /api/translate` with `{ text, direction: "es→en" | "en→es" }` returning
`{ translated: string, isClinicalQuestion: boolean }`.

The classification moves server-side with the translation — one call, one round trip, and the model
is better at "is this a medical question" than the regex is. The `flagged` flag on the thread
message (`T-11`) comes from `isClinicalQuestion`.

Keep the regexes as an offline fallback **for this seam only** — a translation failure mid-demo
should degrade to the heuristic rather than break the thread, because the thread is not on the
critical path to the handoff. This is the opposite call from seam 1, and the difference is
deliberate: a wrong Spanish *instruction* is a safety problem; a wrong Spanish *chat translation*
in a demo is not.

---

## 5. Configuration

```
OPENAI_API_KEY
PHOTON_CLIENT_ID
PHOTON_CLIENT_SECRET
PHOTON_AUDIENCE / PHOTON_TOKEN_URL / PHOTON_API_URL
VITE_SHOW_PROTOTYPE_CONTROLS   (T-17, client-visible, non-secret)
```

Wrangler bindings for the secrets. Document each in the README with where to obtain it. The app
must start and render without any of them — falling back to fixture mode with a visible indicator —
so a reviewer can open the repo and see the UI without credentials.

That fallback indicator is new design surface. Suggest: reuse the prototype-chrome strip styling
(`T-17`) with the text `Fixture mode · no live credentials`. Confirm with the user before shipping it.

---

## Acceptance criteria

- [ ] With credentials set, `Generate Spanish instructions` produces real model output rendered in
      the `T-07` layout, including a genuine callout block.
- [ ] Medication name, `2.5%`, `dos veces al día` and `7 días` survive generation verbatim.
- [ ] The five milestones populate with real Photon IDs; the evidence log shows real timestamps,
      paths and status codes.
- [ ] Re-running the demo updates the same Photon patient rather than creating a duplicate.
- [ ] Killing network access mid-generate lands in `aiError` with all milestones `pending` — the
      `T-18 §2` consistency contract still holds against real failures.
- [ ] Forcing a treatment-lookup failure lands in `apiError` with the other four milestones real and
      green, and Finalize stays blocked.
- [ ] No prescribe scope requested, no prescribe endpoint called — verify in the network log.
- [ ] Secrets never reach the client bundle (`grep` the build output).
- [ ] Without credentials the app renders in fixture mode with the indicator, and every `T-18`
      acceptance criterion still passes.
- [ ] No component's markup changed from `T-18` except where a genuinely new state was added.

## Out of scope

Photon Elements, prescription creation, webhooks, order status, D1 persistence, reload hydration,
multi-patient support, auth/login. All deferred per `V2-PRD.md`.
