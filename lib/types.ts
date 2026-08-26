import type { InstructionBlock, IntegrationMode, LogEntry, Milestone } from "../app/visit/types";

export type InstructionsResponse = {
  mode: IntegrationMode;
  headingEs: string;
  blocks: InstructionBlock[];
  plainText: string;
  logEntry: LogEntry;
};

export type SelectedTreatmentInput = {
  id: string;
  name: string;
};

export type PhotonPatientInput = {
  externalId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: "FEMALE" | "MALE" | "UNKNOWN";
  phone?: string;
};

export type InstructionsRequest = {
  note: string;
  treatment?: SelectedTreatmentInput;
  patient?: PhotonPatientInput;
};

export type PhotonSyncRequest = {
  patient?: PhotonPatientInput;
  treatment?: SelectedTreatmentInput;
};

export type PhotonSyncResponse = {
  mode: IntegrationMode;
  ok: boolean;
  patientId: string;
  treatmentId: string;
  patient?: PhotonPatientInput & { externalId: string };
  milestones: Milestone[];
  logEntries: LogEntry[];
  errorStage?: "auth" | "patient" | "treatment" | "safety";
};

export type PhotonTreatmentSearchResponse = {
  mode: IntegrationMode;
  results: Array<{
    id: string;
    name: string;
    form?: string;
  }>;
};

export type TranslateDirection = "es→en" | "en→es";

export type TranslateResponse = {
  mode: IntegrationMode;
  translated: string;
  isClinicalQuestion: boolean;
  logEntry: LogEntry;
};
