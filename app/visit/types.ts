export type Phase = "idle" | "loading" | "review" | "final" | "aiError" | "apiError";

export type SafetyCheckKey = "allergy" | "interaction" | "dose" | "lactation";

export type SafetyChecks = Record<SafetyCheckKey, boolean>;

export type ThreadSpeaker = "patient" | "clinician";

export type ThreadMessage = {
  id: string;
  from: ThreadSpeaker;
  /** Spanish text: the patient's original, or the translation of a clinician reply. */
  es: string;
  /** English text: the clinician's original, or the translation of a patient question. */
  en: string;
  /** "HH:MM" */
  time: string;
  /** Patient messages only: matched the clinical-topic heuristic. */
  flagged?: boolean;
};

export type MilestoneStatus = "pending" | "loading" | "ok" | "error";

export type Milestone = {
  label: string;
  status: MilestoneStatus;
  /** Mono detail line. Empty string means hide the line entirely. */
  id: string;
};

export type HandoffRow = {
  k: string;
  v: string;
  mono: boolean;
};

export type LogEntry = {
  /** "HH:MM:SS" */
  t: string;
  /** HTTP-ish status code, shown in green or red. */
  code: string;
  msg: string;
  isError?: boolean;
};

export type IntegrationMode = "fixture" | "live";

export type InstructionBlock =
  | { kind: "text"; es: string }
  | { kind: "callout"; es: string };

export type VisitState = {
  phase: Phase;
  note: string;
  reviewed: boolean;
  finalized: boolean;
  checks: SafetyChecks;
  integrationMode: IntegrationMode;
  instructionsHeading: string;
  instructions: InstructionBlock[];
  instructionsPlainText: string;
  patientId: string;
  treatmentId: string;
  milestones: Milestone[];
  logEntries: LogEntry[];
  thread: ThreadMessage[];
  patientDraft: string;
  clinicianReply: string;
  toast: string;
};
