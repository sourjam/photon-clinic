# T-11 — Patient follow-up thread (bilingual)

**Phase:** Left column · **Depends on:** T-02, T-03 · **Blocks:** T-18
**Read first:** `T-00-design-reference.md`

**Priority note:** this is the largest card and the lowest priority in the set. `V2-PRD.md` lists a
patient chat pane under "Defer", but the final mockup ships one and it is the only place the
bilingual story is visible interactively. **It ships — but cut this ticket first if time runs short.**
Nothing else depends on it.

---

## Context

A two-way translated thread. The patient types Spanish, the clinician sees English; the clinician
types English, the patient sees Spanish. Every bubble shows **both** languages: the target language
in full weight, the source-language gloss in italic underneath. That double display is the design's
answer to "how does a clinician trust a translation they can't read?"

When a patient message matches a clinical topic — breastfeeding, pain, allergies, safety — it gets
an amber flag reading *flagged for clinician, not answered by AI*. The AI never answers a medical
question; it routes it.

---

## File

`app/visit/components/PatientFollowUpCard.tsx` — `'use client'`.

---

## Props

```tsx
type PatientFollowUpCardProps = {
  thread: ThreadMessage[];
  patientDraft: string;
  clinicianReply: string;
  onPatientDraftChange: (v: string) => void;
  onClinicianReplyChange: (v: string) => void;
  onSendPatient: () => void;
  onSendClinician: () => void;
  onFillExample: () => void;
};
```

---

## Structure

```
<Card>
  <CardHeader title="Patient follow-up" meta="OpenAI translation · questions routed to clinician" />
  {thread.length === 0 ? <EmptyState/> : <ThreadList/>}
  <Composer />          ← always rendered
</Card>
```

---

## 1. Empty state

```
px-4 py-5 text-center text-[12.5px] text-muted-3
```
> `No follow-up questions yet. Either side can start the thread below.`

---

## 2. Thread list

```
px-[14px] py-3 flex flex-col gap-[9px]
```

One wrapper per message: `flex` with `justify-start` (patient) or `justify-end` (clinician).

### Bubble

```
max-w-[86%] px-[11px] py-[9px] border
```

| | patient | clinician |
|---|---|---|
| background | `bg-brand-bg-2` (`#F7F9FF`) | `bg-surface-alt` (`#F6F7FA`) |
| border | `border-brand-line-2` (`#DFE5F6`) | `border-line-2` (`#E4E7EF`) |
| radius | `rounded-[9px_9px_9px_2px]` | `rounded-[9px_9px_2px_9px]` |
| side | left | right |

The 2px corner points at the speaker — bottom-left for the patient, bottom-right for the clinician.

### Bubble contents

```
div: flex justify-between items-baseline gap-[9px] mb-1
  span: text-[10px] font-bold tracking-[.05em] uppercase   ← speaker label
  span: font-mono text-[9.5px] text-muted-4                ← time
div: text-[12.5px] leading-[1.55] text-ink                 ← Spanish (always)
div: text-[11.5px] leading-[1.45] italic mt-1              ← English gloss, prefixed "EN · "
{flagged && <FlagPill />}
```

| | patient | clinician |
|---|---|---|
| speaker label | `Paciente` | `Clínico` |
| label color | `text-brand-ink-3` (`#5A66C0`) | `text-ink-5` (`#4A5162`) |
| gloss color | `text-brand-ink-3` (`#5A66C0`) | `text-muted` (`#7A8090`) |

**Both** bubble types show Spanish on top and the `EN · …` gloss below. It is not mirrored by
speaker — the Spanish line is always the patient-facing text, and the English is always the
clinician-facing one. Preserve that; it means the clinician reads the same column position every
time regardless of who spoke.

`Clínico` carries an acute accent. The gloss separator is `·` (U+00B7) with spaces: `EN · `.

Wrap the Spanish line in `lang="es"` and the gloss in `lang="en"`.

### Flag pill (patient messages only, when `flagged`)

```
mt-[7px] flex items-center gap-[6px]
bg-warn-bg border border-warn-line rounded-[5px] px-2 py-1
  span: w-[5px] h-[5px] rounded-full bg-warn shrink-0
  span: text-[10.5px] font-semibold text-warn-ink
```
> `Clinical question — flagged for clinician, not answered by AI`

Em dash. This string is the product's safety posture in one line — verbatim.

---

## 3. Composer

```
px-[14px] py-3 border-t border-line-soft bg-surface-sunken flex flex-col gap-[11px]
```

### 3.1 Patient half

Label (`<label htmlFor>` with the FieldLabel classes, but `text-brand-ink-4` `#8088BE`):
> `Paciente · escriba en español`

Textarea:
```
w-full border border-brand-line-3 rounded-[7px] bg-surface
px-[11px] py-[10px] min-h-[52px] text-[12.5px] leading-[1.5] text-ink-2 resize-y outline-none
```
- `placeholder="¿Puedo usar la crema si me duele la piel?"` — opening `¿` U+00BF, and `duele`.
- `lang="es"` on the textarea.
- Add the focus ring from `T-06 §1` (`focus:border-brand focus:ring-2 focus:ring-brand/15`).

Row below (`flex gap-[7px] items-center mt-2 flex-wrap`):
- Example chip: `bg-surface border border-brand-line-3 text-brand-ink-3 text-[11px] font-medium px-[10px] py-[5px] rounded-[13px]` → `Ejemplo: lactancia`. Calls `onFillExample`.
- Spacer `flex-1`
- `<Button variant="primary" size="sm" onClick={onSendPatient}>Translate to English →</Button>`

The arrow is `→` (U+2192) preceded by a space.

### 3.2 Clinician half

```
border-t border-dashed border-line-2 pt-[11px]
```

Label (`FieldLabel`, default tone): `Clinician reply · English`

Textarea: same box as above but `border-line-input` instead of `border-brand-line-3`,
`placeholder="Yes — it is safe to keep using it while breastfeeding…"` (em dash, ellipsis).

Row below: `flex justify-end mt-2` →
`<Button variant="primary" size="sm" onClick={onSendClinician}>Translate to Spanish →</Button>`

The dashed rule between the two halves is the only dashed border in the whole design besides the
handoff card's inner divider. It separates two *different speakers' inputs*, which is a stronger
break than the solid rules between sections.

---

## 4. Send behavior (implement in `useVisitWorkflow`, `T-03`)

### `sendPatientMessage()`

```
t = patientDraft.trim()
if (!t) → toast "Escriba una pregunta primero"; return       ← Spanish toast, deliberate
flagged = isClinical(t)
append { id, from:'patient', es: t, en: esToEn(t), time: stamp(thread.length), flagged }
clear patientDraft
if (flagged) → toast "Clinical question flagged for clinician"
```

The empty-input toast is in Spanish because the person who hit that button was typing Spanish. Keep
it.

### `sendClinicianReply()`

```
t = clinicianReply.trim()
if (!t) → toast "Type a reply first"; return
append { id, from:'clinician', en: t, es: enToEs(t), time: stamp(thread.length) }
clear clinicianReply
```

No flagging on clinician messages.

### Translation heuristics (temporary — `T-19` replaces them)

These are keyword matchers standing in for a model call. Port them as-is; they make the demo work
offline and their call sites are the seam `T-19` swaps.

```ts
function esToEn(t: string): string {
  const l = t.toLowerCase();
  if (/amamant|lactan|pecho|seno/.test(l)) return "Is it safe to use this cream while I'm breastfeeding?";
  if (/duele|dolor|arde|quema/.test(l))    return "Can I use the cream if my skin hurts or stings?";
  if (/cuánto|cuanto|tiempo|días|dias/.test(l)) return "How long do I need to use the cream?";
  return `"${t}" — translated for clinician review.`;
}

function enToEs(t: string): string {
  const l = t.toLowerCase();
  if (/safe|breastfeed/.test(l)) return "Sí, puede seguir usando la crema mientras amamanta. No la aplique en el pecho y avíseme si algo cambia.";
  if (/stop|days|week/.test(l))  return "Úsela durante 7 días y luego deténgase. Si no mejora, llame a la clínica.";
  return `«${t}» — traducción para la paciente.`;
}

function isClinical(t: string): boolean {
  return /amamant|lactan|pecho|seno|duele|dolor|arde|quema|embarazo|alergia|efecto|seguro|segura/i.test(t);
}
```

Note the fallbacks use different quote marks by language: straight `"` for English, `«»` for
Spanish. That is a real typographic convention and it is in the source — keep it.

`onFillExample` sets `patientDraft` to:
> `¿Es seguro usar esta crema mientras estoy amamantando?`

which matches both `amamant` (flagging) and the breastfeeding branch of `esToEn`. It is the
scripted demo beat — one click reproduces the scenario from the PRD's demo script.

### Evidence-log side effect

Each thread message adds a row to the API evidence log (`T-14`):
`{ t: message.time, code: "200", msg: "openai · message.translate (es→en)" }` — or `(en→es)` for
clinician messages. `T-14` owns the rendering; the thread just needs to be readable from there.
The arrow is `→` U+2192.

---

## Acceptance criteria

- [ ] Empty state shows at boot; composer is visible below it.
- [ ] `Ejemplo: lactancia` fills the Spanish textarea with the exact accented sentence.
- [ ] Sending it appends a left-aligned `Paciente` bubble with the 2px bottom-left corner, the
      Spanish text, `EN · Is it safe to use this cream while I'm breastfeeding?` in italic blue,
      and the amber flag pill.
- [ ] A toast reads `Clinical question flagged for clinician`.
- [ ] Sending an empty Spanish draft toasts `Escriba una pregunta primero` and appends nothing.
- [ ] A clinician reply appends a right-aligned `Clínico` bubble, 2px bottom-right corner, Spanish
      on top and grey italic English gloss below.
- [ ] Timestamps run `10:44`, `10:46`, `10:48`, … (+2 min per message).
- [ ] Two evidence-log rows appear after two messages, labeled `es→en` and `en→es`.
- [ ] Both textareas have visible focus rings and are labeled.
- [ ] `lang` attributes: `es` on Spanish text and the Spanish textarea, `en` on glosses.
- [ ] The dashed divider between composer halves renders dashed, not solid.
- [ ] No hex literal in the file.

## Out of scope

Real translation (`T-19`), message persistence, editing or deleting messages, read receipts,
typing indicators, SMS delivery. The design PRD mentions "Send by SMS placeholder" — that belongs
to the superseded V1 mockups and is **not** in V2.
