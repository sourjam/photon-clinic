# Photon Clinic Assistant PRD

## Product Concept

Photon Clinic Assistant is a lightweight bilingual visit assistant for a small specialty clinic. It helps clinicians communicate medication plans with Spanish-speaking patients, capture key prescription context, and hand off the final prescribing step to Photon.

The assistant is not an autonomous prescriber. It translates, structures, and summarizes the visit, while the clinician reviews all medical content and completes prescribing in Photon.

## Specialty

Dermatology clinic.

Dermatology is a good fit because visits often end with topical or oral prescriptions, patients need clear usage instructions, and medication adherence depends heavily on understanding timing, quantity, side effects, and follow-up expectations.

## Primary Users

Clinician:
Needs to explain diagnoses and medication plans clearly, understand patient questions, and quickly prepare prescription context for Photon.

Spanish-speaking patient:
Needs plain-language explanations, translated answers, and medication instructions they can follow after the visit.

Clinic staff:
May help confirm demographics, allergies, current medications, and preferred pharmacy before the clinician prescribes.

## Problem

Small clinics often lack consistent live interpreter availability. Medication counseling becomes slower and riskier when patients and clinicians do not share a primary language. Even when a prescription is correctly written, patients may leave without fully understanding how to use it.

Photon handles the prescribing and pharmacy workflow, but the clinic still needs a patient-friendly multilingual communication layer around that workflow.

## Goals

- Translate clinician instructions from English to Spanish in patient-friendly language.
- Translate patient questions from Spanish back to English for the clinician.
- Capture prescription-relevant context: allergies, current medications, condition, intended treatment, patient concerns, and preferred pharmacy.
- Generate a concise clinician summary before prescribing.
- Generate Spanish medication instructions after the clinician finalizes the prescription in Photon.
- Keep clinician review and approval visible at every step.

## Non-Goals

- Do not replace certified medical interpreters.
- Do not autonomously prescribe or recommend medication without clinician approval.
- Do not build a full EHR, scheduling system, billing system, or patient portal.
- Do not translate Photon embedded UI unless Photon provides official support.
- Do not store unnecessary audio recordings in the MVP.

## MVP Workflow

1. Staff or clinician opens a patient visit.
2. Patient card shows name, DOB, phone, preferred language, allergies, current medications, and preferred pharmacy.
3. Clinician types an English message.
4. Assistant translates the message into Spanish with simple, patient-friendly wording.
5. Patient or staff types a Spanish question.
6. Assistant translates the question into English for the clinician.
7. Clinician confirms intake details and clicks "Search Treatment".
8. Assistant searches or mocks a Photon treatment catalog match, such as "hydrocortisone 2.5% cream".
9. Clinician reviews prescription setup: selected treatment, instructions, days supply, refills, allergies, current medications, and safety flags.
10. Clinician clicks "Open Photon" to complete and sign the prescription in Photon.
11. After a mocked or real Photon prescription event, assistant shows "Prescription Created" and generates Spanish after-visit medication instructions.

## Dashboard Structure

The MVP should be one dashboard rather than several separate pages. The dashboard has two main panes for the bilingual conversation and one persistent Photon workflow rail.

### Left Pane: Clinician Workspace

Purpose:
Give the clinician a command center for intake, English notes, patient-question translation, and prescription prep.

Content:
- Patient intake summary
- English clinician input
- English translation of Spanish patient questions
- AI-extracted clinical notes
- Safety flags
- Prescription setup draft

Primary actions:
- Translate to Spanish
- Save to Visit Notes
- Search Treatment
- Summarize for Prescription

### Right Pane: Patient Communication

Purpose:
Provide the patient-facing Spanish side of the visit.

Content:
- Spanish translation of clinician messages
- Spanish patient input
- Patient-friendly medication explanation
- Final Spanish medication instructions after prescription creation

Primary actions:
- Translate to English
- Copy Spanish Instructions
- Send by SMS placeholder

### Photon Workflow Rail

Purpose:
Show the prescription lifecycle clearly without implying the AI is prescribing.

Steps:
- Intake
- Treatment Search
- Prescription Setup
- Open Photon
- Prescription Created

Each step should show a status: not started, in progress, needs review, or complete.

## Key Dashboard States

### 1. Intake

Purpose:
Capture the minimum patient information needed for a safe prescribing handoff.

Sections:
- Patient demographics
- Preferred language
- Allergies
- Current medications
- Preferred pharmacy
- Photon patient sync status

Primary actions:
- Sync Patient to Photon
- Continue to Treatment Search

### 2. Treatment Search

Purpose:
Let the clinician search for the intended medication and choose a Photon treatment catalog match.

Content:
- Search input
- Treatment result cards
- Photon treatment ID and name
- Lightweight context from the visit, such as condition and patient concerns

Example:
- Search: "hydrocortisone cream"
- Result: "Hydrocortisone 2.5% Topical Cream"
- Photon treatment ID: mocked or sandbox value

Primary actions:
- Select Treatment
- Change Treatment
- Continue to Prescription Setup

### 3. Prescription Setup

Purpose:
Turn the bilingual conversation and selected treatment into structured context the clinician can review before using Photon.

Sections:
- Condition discussed
- Selected Photon treatment
- Draft patient instructions
- Notes to pharmacist
- Days supply and refills, if used in the mock
- Allergies and current medications mentioned
- Patient concerns/questions
- Safety checklist

States:
- Needs clinician review
- Ready for Photon

Primary actions:
- Edit Setup
- Open Photon Prescribing

### 4. Prescription Created

Purpose:
Show that Photon completed the prescription step and trigger patient-facing instructions.

Content:
- Photon prescription status
- Photon order status, if available
- Medication name
- Final English summary for clinician review
- Final Spanish medication instructions for patient

Primary actions:
- Copy Spanish Instructions
- Send by SMS placeholder
- Save to Visit Notes

## AI Behavior

Translation style:
- Plain-language Spanish.
- Avoid idioms.
- Preserve medication names, dose numbers, and frequencies exactly.
- Flag uncertainty instead of guessing.
- Keep clinician-facing English translations literal enough for clinical review.

Safety behavior:
- Always remind that final medical decisions are clinician-reviewed.
- Highlight allergies, pregnancy/breastfeeding mentions, current medications, and severe symptoms.
- Do not invent diagnoses, medications, or dosing.
- If a patient asks a medical question, translate and summarize it for the clinician rather than answering independently.
- MVP input is typed text only.

## Photon Integration

Useful Photon capabilities:
- Create or update patient records.
- Include allergies and medication history when syncing a patient.
- Search the Photon treatment catalog to map a medication name to a Photon treatment ID.
- Deep-link to the Photon Clinical App with a preselected patient.
- Embed Photon prescribing workflow via Photon Elements if time permits.
- Receive prescription/order events through webhooks.
- Use medication history and interaction checks where available.

MVP integration target:
- Start with mocked Photon status and a realistic "Open Photon" handoff.
- Mock treatment search results if sandbox access is not available.
- If time allows, implement patient sync and treatment search against Photon sandbox.

For the demo, Photon is used for:
- Patient sync
- Treatment catalog lookup
- Prescribing handoff
- Prescription-created status
- Order status, if included

Photon is not used for:
- General charting
- Appointment scheduling
- Patient messaging
- AI translation
- Audio transcription
- Autonomous medication decisions

## Data Model

Patient:
- id
- photonPatientId
- name
- dateOfBirth
- phone
- preferredLanguage
- allergies
- currentMedications
- preferredPharmacy

VisitMessage:
- id
- speaker: clinician | patient
- sourceLanguage
- sourceText
- translatedLanguage
- translatedText
- createdAt

PrescriptionPrep:
- condition
- intendedTreatment
- selectedTreatmentId
- selectedTreatmentName
- instructions
- daysSupply
- refills
- pharmacistNotes
- safetyFlags
- allergiesMentioned
- medicationsMentioned
- patientQuestions

TreatmentSearchResult:
- id
- name
- source: photon | mock
- selected

PhotonStatus:
- patientSyncStatus
- treatmentSearchStatus
- prescriptionStatus
- orderStatus
- lastEventAt

## Mockup Requirements

The first mockup should feel like an actual clinic tool, not a marketing page.

Visual direction:
- Quiet clinical workspace.
- Dense but readable layout.
- Clear two-way translation panes.
- Patient context always visible.
- Safety flags should be prominent but not alarming.
- Primary action should guide the workflow toward Photon handoff.

Suggested first screen:
- Header: patient name, visit type, language pair, Photon status.
- Main area: two-column translator with clinician workspace on the left and patient Spanish communication on the right.
- Right or top workflow rail: Intake, Treatment Search, Prescription Setup, Open Photon, Prescription Created.
- Patient context and safety checklist should remain visible.
- Bottom action bar should move the workflow forward with "Search Treatment", "Summarize for Prescription", and "Open Photon".

## Success Criteria

- A reviewer can understand the product idea within 30 seconds.
- The demo clearly shows how AI helps the clinician and patient communicate.
- The Photon role is explicit: final prescribing and pharmacy workflow.
- The UI does not imply the AI is independently prescribing.
- The mocked workflow can be explained as a realistic path to real Photon API integration.

## Demo Script

1. Open Maria Gonzalez's dermatology visit.
2. Clinician explains: "This looks like eczema. I want you to apply the steroid cream twice daily for 7 days, then stop."
3. Assistant translates into Spanish.
4. Patient asks in Spanish whether it is safe while breastfeeding.
5. Assistant translates the question and flags it as a safety consideration.
6. Clinician updates the plan and asks about allergies/current meds.
7. Clinician searches treatment and selects a Photon catalog result for hydrocortisone cream.
8. Assistant generates prescription setup summary.
9. Clinician opens Photon prescribing.
10. Mock Photon event shows prescription created.
11. Assistant generates Spanish after-visit medication instructions.

## Future Roadmap

Voice and audio support:
- Add browser microphone input for clinician and patient turns.
- Transcribe English clinician speech before translating to Spanish.
- Transcribe Spanish patient speech before translating to English.
- Add clear recording states, pause/stop controls, and visible consent language.
- Avoid storing raw audio by default; store only reviewed transcript text.
- Handle noisy clinic environments, transcription corrections, and turn-taking UX.

Expanded language support:
- Add language selector beyond English and Spanish.
- Add preferred-language defaults from the patient profile.
- Add clinician review warnings for low-confidence translations.
