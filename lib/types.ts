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

export type InstructionsRequest = {
  note: string;
  treatment?: SelectedTreatmentInput;
};

export type PhotonSyncRequest = {
  treatment?: SelectedTreatmentInput;
};

export type PhotonSyncResponse = {
  mode: IntegrationMode;
  ok: boolean;
  patientId: string;
  treatmentId: string;
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
