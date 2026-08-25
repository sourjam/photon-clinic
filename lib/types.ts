import type { InstructionBlock, IntegrationMode, LogEntry, Milestone } from "../app/visit/types";

export type InstructionsResponse = {
  mode: IntegrationMode;
  headingEs: string;
  blocks: InstructionBlock[];
  plainText: string;
  logEntry: LogEntry;
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

export type TranslateDirection = "es→en" | "en→es";

export type TranslateResponse = {
  mode: IntegrationMode;
  translated: string;
  isClinicalQuestion: boolean;
  logEntry: LogEntry;
};
