import type { HandoffRow, LogEntry, Milestone, MilestoneStatus, Phase, SafetyCheckKey, VisitState } from "./types";
import { fixtureInstructions, fixturePhotonSyncResponse, fixtureTreatmentCatalog } from "../../lib/fixtures";

export const CLINICIAN_NOTE =
  "Suspected eczema flare on forearms. Discussed moisturizing, avoiding fragrance, and short course topical steroid. Patient asks if treatment is safe while breastfeeding.";

export const PATIENT = {
  firstName: "Maria",
  lastName: "Gonzalez",
  dateOfBirth: "1988-04-12",
  sex: "Female",
  phone: "(718) 555-0142",
  externalId: "",
  name: "Maria Gonzalez",
  meta: "DOB 1988-04-12 · Spanish",
  visit: "Dermatology · suspected eczema flare",
  visitReason: "Suspected eczema flare",
  allergies: "Sulfa",
  currentMeds: "Prenatal vitamin",
  raisedInVisit: "Breastfeeding question",
} as const;

export const DEFAULT_PATIENT = {
  firstName: PATIENT.firstName,
  lastName: PATIENT.lastName,
  dateOfBirth: PATIENT.dateOfBirth,
  sex: PATIENT.sex,
  phone: PATIENT.phone,
  externalId: PATIENT.externalId,
} as const;

export const DEFAULT_VISIT_CONTEXT = {
  language: "Spanish",
  specialty: "Dermatology",
  visitReason: PATIENT.visitReason,
  allergies: PATIENT.allergies,
  currentMeds: PATIENT.currentMeds,
  raisedInVisit: PATIENT.raisedInVisit,
} as const;

export const PHOTON = {
  env: "NEUTRON · sandbox",
  host: "api.neutron.health · oauth2",
  scope: "read · write:patient",
  prescribeScope: "not requested",
  patientId: "pat_01HQ7K4M2Z",
  treatmentId: "med_8f21c94a",
} as const;

export const MEDICATION = {
  name: "Hydrocortisone cream 2.5%",
  directions: "Apply thin layer to affected areas twice daily for 7 days",
  quantity: "30 g tube",
  refills: "0",
  pharmacistNotes: "Patient is breastfeeding; clinician reviewed counseling.",
  summary: "2.5% · 30 g · 7 days · 0 refills",
} as const;

export const DEFAULT_TREATMENT = fixtureTreatmentCatalog[0];

export const REVIEWER = { name: "Dr. A. Okafor", time: "10:42" } as const;

export const AI_MODEL = "OpenAI · gpt-4o-mini";

export const PATIENT_FOLLOWUP_EXAMPLE = "¿Es seguro usar esta crema mientras estoy amamantando?";

export const SAFETY_CHECKS = [
  {
    key: "allergy",
    text: "Allergy record synced for Photon screening",
    meta: "GET /allergies · 1 record (sulfa) · no screening performed here",
  },
  {
    key: "interaction",
    text: "Medication history synced for Photon screening",
    meta: "GET /medication_history · 1 record (prenatal vitamin)",
  },
  {
    key: "dose",
    text: "Strength, quantity and duration verified",
    meta: "2.5% · 30 g · 7 days · 0 refills",
  },
  {
    key: "lactation",
    text: "Lactation guidance confirmed with patient",
    meta: "Clinician-confirmed — not an AI or API determination",
  },
] as const satisfies readonly { key: SafetyCheckKey; text: string; meta: string }[];

export const INITIAL_STATE: VisitState = {
  phase: "idle",
  note: CLINICIAN_NOTE,
  reviewed: false,
  finalized: false,
  checks: { allergy: false, interaction: false, dose: false, lactation: false },
  integrationMode: "fixture",
  instructionsHeading: fixtureInstructions.headingEs,
  instructions: fixtureInstructions.blocks,
  instructionsPlainText: fixtureInstructions.plainText,
  patient: DEFAULT_PATIENT,
  draftPatient: DEFAULT_PATIENT,
  patientEditing: false,
  patientDirty: false,
  patientSyncStatus: "none",
  patientId: "",
  visitContext: DEFAULT_VISIT_CONTEXT,
  treatmentId: fixturePhotonSyncResponse().treatmentId,
  selectedTreatment: DEFAULT_TREATMENT,
  treatmentQuery: "hydrocortisone",
  treatmentResults: [],
  treatmentSearchStatus: "idle",
  milestones: buildMilestones("idle"),
  logEntries: buildLog("idle", false),
  thread: [],
  patientDraft: "",
  clinicianReply: "",
  toast: "",
};

export const HANDOFF_ROWS: HandoffRow[] = [
  { k: "Photon patient", v: "pat_01HQ7K4M2Z", mono: true },
  { k: "Treatment", v: "med_8f21c94a", mono: true },
  { k: "Safety data", v: "allergy + med history synced for screening", mono: false },
  { k: "Spanish instructions", v: "reviewed", mono: false },
  { k: "Medication prep", v: "2.5% · 30 g · 7 days · 0 refills", mono: false },
];

export function buildMilestones(phase: Phase): Milestone[] {
  const mk = (label: string, status: MilestoneStatus, id = ""): Milestone => ({ label, status, id });

  if (phase === "idle" || phase === "aiError") {
    return [
      mk("Auth check", "pending"),
      mk("Patient sync", "pending"),
      mk("Treatment lookup", "pending"),
      mk("Allergy history", "pending"),
      mk("Medication history", "pending"),
    ];
  }

  if (phase === "loading") {
    return [
      mk("Auth check", "ok", "token · 3600s"),
      mk("Patient sync", "loading"),
      mk("Treatment lookup", "pending"),
      mk("Allergy history", "pending"),
      mk("Medication history", "pending"),
    ];
  }

  if (phase === "apiError") {
    return [
      mk("Auth check", "ok", "token · 3600s"),
      mk("Patient sync", "ok", "pat_01HQ7K4M2Z"),
      mk("Treatment lookup", "error", "503 · retry available"),
      mk("Allergy history", "ok", "1 record · sulfa"),
      mk("Medication history", "ok", "1 record · prenatal vitamin"),
    ];
  }

  return [
    mk("Auth check", "ok", "token · 3600s"),
    mk("Patient sync", "ok", "pat_01HQ7K4M2Z"),
    mk("Treatment lookup", "ok", "med_8f21c94a"),
    mk("Allergy history", "ok", "1 record · sulfa"),
    mk("Medication history", "ok", "1 record · prenatal vitamin"),
  ];
}

export function buildLog(phase: Phase, finalized: boolean): LogEntry[] {
  const L = (t: string, code: string, msg: string, isError = false): LogEntry => ({ t, code, msg, isError });

  let log: LogEntry[] = [];

  if (phase === "idle") {
    log = [];
  } else if (phase === "loading") {
    log = [L("10:38:02", "200", "POST /auth/token")];
  } else if (phase === "aiError") {
    log = [L("10:38:02", "200", "POST /auth/token"), L("10:39:11", "504", "openai · instructions.generate", true)];
  } else if (phase === "apiError") {
    log = [
      L("10:38:02", "200", "POST /auth/token"),
      L("10:38:44", "200", "openai · instructions.generate"),
      L("10:39:03", "201", "POST /patients → pat_01HQ7K4M2Z"),
      L("10:39:20", "503", "GET /catalog/treatments", true),
      L("10:39:26", "200", "GET /allergies → 1 record"),
      L("10:39:31", "200", "GET /medication_history → 1 record"),
    ];
  } else {
    log = [
      L("10:38:02", "200", "POST /auth/token"),
      L("10:38:44", "200", "openai · instructions.generate"),
      L("10:39:03", "201", "POST /patients → pat_01HQ7K4M2Z"),
      L("10:39:18", "200", "GET /catalog/treatments → med_8f21c94a"),
      L("10:39:26", "200", "GET /allergies → 1 record"),
      L("10:39:31", "200", "GET /medication_history → 1 record"),
    ];
  }

  if (finalized) {
    log = [...log, L("10:42:07", "200", "handoff prepared · no Rx written")];
  }

  return log;
}
