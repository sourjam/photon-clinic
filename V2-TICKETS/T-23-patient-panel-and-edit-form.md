# T-23 — Patient panel: read-only view, edit form, and Photon sync

**Phase:** V2.1 left column · **Depends on:** T-22 · **Blocks:** T-28
**Read first:** `T-00-design-reference.md`, then `T-21-v2.1-design-reference.md`

---

## Context

V2 had one hardcoded patient rendered as four static cells. V2.1 makes the patient **editable** and
introduces a two-stage commit that is the whole point of the card:

> **Saving stages the change · Sync Photon writes it**

Editing a name updates local state and marks the record *dirty*. Nothing reaches Photon until the
clinician runs Sync. The badge, the footer note, and the milestone row all report that gap honestly,
so at no point does the UI claim Photon holds data it does not.

This card **replaces** `PatientContextCard`, which is deleted. Its allergy / current-meds /
"raised in visit" cells do not survive — that content now lives in the safety-check metas
(`GET /allergies · 1 record (sulfa)`) and the milestone id lines (`1 record · prenatal vitamin`).
Do not try to preserve them here; the panel is about demographics.

---

## Files

- `app/visit/components/PatientPanel.tsx` — **new**, `'use client'`
- `app/visit/components/ui/Input.tsx` — **new** (`T-21 §6.1`)
- `app/visit/components/PatientContextCard.tsx` — **delete**
- `app/visit/demoData.ts` — add `DEFAULT_PATIENT`
- `app/visit/useVisitWorkflow.ts` — add the actions in §5–§6

---

## Props

```tsx
type PatientPanelProps = {
  patient: PatientRecord;
  draftPatient: PatientRecord;
  editing: boolean;
  dirty: boolean;
  syncStatus: PatientSyncStatus;   // "none" | "pending" | "synced" | "updated"
  patientId: string;               // "" when never synced
  onToggleEdit: () => void;
  onDraftChange: (field: keyof PatientRecord, value: string) => void;
  onSexChange: (sex: PatientSex) => void;
  onSave: () => void;
  onCancel: () => void;
};
```

---

## 1. Card header

```
flex items-center justify-between gap-[10px] px-[14px] py-[10px] border-b border-line-soft
  div: text-[12.5px] font-bold                → "Patient"
  div: flex items-center gap-2
    <Badge tone={badgeTone}>{badgeLabel}</Badge>
    <Button variant="ghost" size="xs" onClick={onToggleEdit}>{editing ? "Close" : "Edit patient"}</Button>
```

`size="xs"` is the new `px-[11px] py-[5px] rounded-[6px] text-[11.5px]` size from `T-21 §6.3`.
Note the **6px** radius — this button is deliberately smaller and softer than the card's action
buttons.

### Badge — five outcomes from two inputs

Evaluate the label first, then apply the dirty override to the tone:

```ts
let tone: BadgeTone, label: string;
if (syncStatus === "updated")      { tone = "success"; label = "Updated in Photon"; }
else if (syncStatus === "synced")  { tone = "success"; label = dirty ? "Synced · changes pending" : "Synced to Photon"; }
else if (syncStatus === "pending") { tone = "info";    label = "Syncing…"; }
else                               { tone = "neutral"; label = "Not synced"; }

// dirty local edits downgrade a green badge to amber, without changing the label
if (dirty && (syncStatus === "synced" || syncStatus === "updated")) tone = "warn";
```

The override is the subtle part: a dirty *synced* patient reads
`Synced · changes pending` in **amber**, and a dirty *updated* patient reads `Updated in Photon` in
amber. The label says what Photon holds; the color says whether it is current. Both are true at
once, and the design refuses to pick one.

---

## 2. Read-only view (`!editing`)

Two blocks: a cell row, then a sync footer.

### 2.1 Cell row

```
flex flex-wrap
```

Five cells, each:

```
flex-[1_1_140px] px-[14px] py-[10px]
border-r border-line-softer        ← last cell: none
  <FieldLabel>{label}</FieldLabel>            ← default 3px bottom margin
  <div class="text-[12.5px] font-semibold {valueColor}">{value}</div>
```

| # | Label | Value | Fallback |
|---|---|---|---|
| 1 | `Name` | `` `${first} ${last}`.trim() `` | `—` (U+2014) |
| 2 | `Date of birth` | `dob` | `—` |
| 3 | `Sex` | `sex` | `—` |
| 4 | `Phone` | `phone` | `—` |
| 5 | `External ID` | `ext` | `none` |

`valueColor` is `text-muted-5` (`#A6ABBA`) when the value is the fallback (`—` or `none`), otherwise
`text-ink`. External ID's fallback is the word `none`, not a dash — it is legitimately absent rather
than missing.

All five cells share `flex-[1_1_140px]`, unlike `T-05`'s four differently-weighted cells. Equal
basis is right here: these are all short demographic values.

### 2.2 Sync footer

```
flex items-center gap-[9px] flex-wrap px-[14px] py-[9px]
border-t border-line-softer bg-surface-sunken
  <IdChip />
  <span class="text-[11px] text-muted">{syncNote}</span>
```

**ID chip** — mono, fill-only, no border (same family as `T-08`'s treatment chip):

```
font-mono text-[11px] px-2 py-[3px] rounded-[5px]
patientId ? "bg-brand-bg-3 text-brand-ink" : "bg-surface-muted text-muted-2"
```

Label is `patientId` or the literal `no Photon ID yet`.

**Sync note**, in this order:

```
syncStatus === "none"     → "Not yet created in Photon"
dirty                     → "Local edits not yet written to Photon"
syncStatus === "updated"  → "Existing Photon patient was updated"
otherwise                 → "Patient record created in Photon"
```

`dirty` outranks `updated`: if there are unwritten edits, that is the more urgent fact.

Wrap the read-only cells in a `<dl>` if it stays visually identical, same reasoning as `T-05`.

---

## 3. Edit form (`editing`)

```
px-[14px] py-3 grid grid-cols-3 gap-x-3 gap-y-[10px]
```

`grid-cols-3` = `repeat(3, minmax(0,1fr))`; gaps are `10px 12px` → `gap-y-[10px] gap-x-3`.

Every field is `<FieldLabel dense={false}>` (4px margin — `T-21 §6.2`) over an `<Input>`.

| # | Label | Control | Placeholder | Span |
|---|---|---|---|---|
| 1 | `First name` | Input | — | 1 |
| 2 | `Last name` | Input | — | 1 |
| 3 | `Date of birth` | Input | `YYYY-MM-DD` | 1 |
| 4 | `Sex` | segmented, §3.1 | — | 1 |
| 5 | `Phone` | Input | — | 1 |
| 6 | `External ID` + `optional` | Input | `EHR-00421` | 1 |
| 7 | actions, §3.2 | — | — | `col-span-3` |

### The `optional` suffix on field 6

Inside the label, after the text, a span that **undoes** the label's own styling:

```
font-normal normal-case tracking-normal text-muted-5
```

(the mockup: `font-weight:400;text-transform:none;letter-spacing:0;color:#A6ABBA`)

So it renders `EXTERNAL ID optional` — uppercase bold label, lowercase grey qualifier. It is the
only optional field in the form and the only one that says so.

### 3.1 Sex — segmented control

```
flex gap-1
```

Three buttons, `Female` / `Male` / `Other`, each:

```
flex-1 rounded-[6px] px-1 py-[7px] text-[11.5px] font-semibold border
```

| state | border | background | text |
|---|---|---|---|
| selected | `border-brand` (`#3A50E4`) | `bg-brand-bg-3` (`#EDF0FF`) | `text-brand-ink` (`#2A3AB0`) |
| unselected | `border-line-input` (`#DDE1EA`) | `bg-surface-sunken` (`#FCFCFE`) | `text-ink-6` (`#5A6072`) |

`flex-1` makes all three equal width, filling exactly one grid column — the segmented control is the
same footprint as an `<Input>`, which is why it can sit in the grid without a span.

**Accessibility:** these are three buttons in the mockup, which gives no group semantics and no
arrow-key navigation. Build it as a radio group instead — visually hidden `<input type="radio">`
inside each `<label>`, wrapped in a `<fieldset>` with a visually-hidden `<legend>Sex</legend>`, and
style off `peer-checked:`. Same pixels, correct semantics, and it announces "Female, radio button,
1 of 3". Same pattern `T-09` used for the safety checkboxes.

### 3.2 Action row

```
col-span-3 flex items-center gap-[10px] flex-wrap pt-[2px]
  <Button variant="primary" size="sm" onClick={onSave}>Save patient</Button>
  <Button variant="ghost"   size="sm" onClick={onCancel}>Cancel</Button>
  <span class="text-[11px] text-muted-2">Saving stages the change · Sync Photon writes it</span>
```

`Save patient` is `px-[14px] py-[7px]` in the mockup — one pixel wider than `T-02`'s
`sm` (`px-[13px]`). Use `sm` and accept the pixel, or add the override; do not restyle the variant.

`Cancel` uses `text-ink-6` (`#5A6072`), not `ghost`'s usual `text-ink-4` (`#3F4658`). Minor, and
`ghost` is close enough — but if you are matching exactly, override the color here.

**That hint string is the card's thesis.** It is the only place the two-stage commit is explained.
Verbatim, including the `·`.

---

## 4. Edit/save/cancel semantics

Three actions, and the draft-copy timing matters:

```ts
togglePatientEdit: () => set({ patientEditing: !editing, draftPatient: { ...patient } })
```

Note it copies `patient` → `draftPatient` on **both** open and close. Opening seeds the form from
the committed record; closing discards whatever was typed. So the `Close` button is a second
Cancel — there is no way to leave the form with uncommitted draft state hanging around.

```ts
savePatient: () => {
  const changed = JSON.stringify(draftPatient) !== JSON.stringify(patient);
  set({
    patient: { ...draftPatient },
    patientEditing: false,
    patientDirty: changed || patientDirty,   // sticky: never cleared by saving
    finalized: false,
  });
  showToast(changed ? "Patient saved · run Sync Photon to write it" : "No changes to save");
}
```

Two details:

- `patientDirty` is **sticky** — `changed || patientDirty`. Saving twice, the second time with no
  edits, does not clear the flag. Only a successful `syncPhoton` clears it (§6). That is what makes
  the flag mean "Photon is behind" rather than "the form was touched".
- The no-op toast (`No changes to save`) is worth keeping. Opening the form, changing nothing, and
  hitting Save is a real thing people do, and silence would read as a failure.

```ts
cancelPatient: () => set({ patientEditing: false, draftPatient: { ...patient } })
```

Field setters write to `draftPatient` only. Nothing in the form touches `patient`, `patientSync`, or
`patientId`.

---

## 5. Header wiring

The app header's patient name and meta now derive from `patient` (`T-26 §1`):

```ts
patientName = `${first} ${last}`.trim() || "No patient";
patientMeta = (dob ? `DOB ${dob} · ` : "") + "Spanish";
```

Clearing both name fields and saving puts `No patient` in the header. That is the correct
degradation and it is worth testing — it proves the header is reading live state, not a constant.

`Spanish` stays hardcoded. Language selection is future roadmap (`design-PRD.md`), not V2.1.

---

## 6. `syncPhoton` — the write

Triggered from two places: the milestones card header (`T-27 §4`) and the action bar (`T-26 §2`).
One action, shared.

```ts
syncPhoton: () => {
  set({ patientSync: "pending" });
  after 900ms:
    const existed = patientId !== "";
    const id = patientId || "pat_01HQ7K4M2Z";
    set({
      patientSync: existed ? "updated" : "synced",
      patientId: id,
      patientDirty: false,
      historySync: "ok",
      txLookup: sel ? "ok" : txLookup,
      checks: { ...checks, allergy: true, interaction: true, dose: sel ? true : checks.dose },
    });
    addLog(existed ? "200" : "201", existed
      ? "POST /patients → updated existing patient"
      : `POST /patients → ${id}`);
    addLog("200", "GET /allergies → 1 record");
    addLog("200", "GET /medication_history → 1 record");
    if (sel) addLog("200", `GET /catalog/treatments → ${sel.id}`);
    showToast(existed ? "Patient updated in Photon" : "Patient synced to Photon");
}
```

Notes:

- `201` on create, `200` on update. The status code is the evidence that the app distinguished the
  two paths — `T-14 §3` called this out for the V2 log and it is more meaningful now that repeat
  syncs are reachable.
- Sync **ticks three safety checks** (`allergy`, `interaction`, and `dose` when a treatment is
  selected). Those three represent data having moved, so the sync that moves it should mark them.
  `lactation` is untouched — it is the clinician-judgment check (`T-09`) and no API call can satisfy
  it.
- Sync clears `patientDirty`. This is the only thing that does.
- Guard the timer in a ref and clear it on unmount, same as the generate timer (`T-03 §7`).

---

## Acceptance criteria

- [ ] Boots read-only with `Maria Gonzalez`, `1988-04-12`, `Female`, `(718) 555-0142`, and
      `External ID: none` in grey.
- [ ] Badge reads `Synced to Photon` (green); footer chip reads `pat_01HQ7K4M2Z` in blue mono;
      note reads `Patient record created in Photon`.
- [ ] `Edit patient` opens the 3-column form seeded from the committed record; the button becomes
      `Close`.
- [ ] Sex renders as three equal-width segments with `Female` selected in blue; arrow keys move
      between them and a screen reader announces "1 of 3".
- [ ] `External ID` label renders `EXTERNAL ID` bold-uppercase followed by `optional` in lowercase
      grey.
- [ ] Change the last name → `Save patient` → form closes, badge becomes amber
      `Synced · changes pending`, footer note becomes `Local edits not yet written to Photon`,
      header shows the new name, toast reads `Patient saved · run Sync Photon to write it`.
- [ ] Save again with no further edits → toast `No changes to save`, and the badge **stays amber**
      (sticky dirty).
- [ ] `Sync Photon` → badge `Syncing…` (info) for 900ms → `Updated in Photon` (green, not amber),
      note `Existing Photon patient was updated`, toast `Patient updated in Photon`, and 4 new log
      rows starting with a `200 · POST /patients → updated existing patient`.
- [ ] From the `Fresh visit` scenario (no `patientId`): sync logs **`201`** and
      `POST /patients → pat_01HQ7K4M2Z`, badge lands on `Synced to Photon`, toast reads
      `Patient synced to Photon`.
- [ ] Sync ticks `allergy` and `interaction`; `lactation` stays unticked.
- [ ] Edit → type → `Cancel` discards; `Edit patient` again shows the original values.
- [ ] Edit → type → `Close` also discards.
- [ ] Clearing both name fields and saving puts `No patient` in the header and `—` in the Name cell.
- [ ] `Save patient` clears `finalized` — finalize, then edit and save, and the handoff card drops
      out of `Ready`.
- [ ] Every input has a visible focus ring and an associated label.
- [ ] `PatientContextCard.tsx` is deleted and unreferenced.
- [ ] No hex literal in the file.

## Out of scope

Patient search across the Photon org, multiple patients, a patient picker, DOB or phone format
validation, PHI redaction. The live Photon `POST /patients` write is `T-20`'s route — this ticket
uses the simulated 900ms path, and `T-28 §6` swaps it.
