"use client";

import { useEffect, useRef, useState } from "react";
import { buildLog, buildMilestones, INITIAL_STATE, PATIENT_FOLLOWUP_EXAMPLE } from "./demoData";
import type { PatientSex, Phase, SafetyCheckKey, VisitPatient, VisitState } from "./types";
import type {
  InstructionsResponse,
  PhotonPatientInput,
  PhotonSyncResponse,
  PhotonTreatmentSearchResponse,
  TranslateDirection,
  TranslateResponse,
} from "../../lib/types";

const TOAST_DELAY_MS = 2200;
const SYNCED_KEYS = ["allergy", "interaction", "dose"] as const satisfies readonly SafetyCheckKey[];

type DerivedVisitState = {
  isIdle: boolean;
  isLoading: boolean;
  isAiError: boolean;
  isApiError: boolean;
  hasInstructions: boolean;
  finalized: boolean;
  checksDone: number;
  allChecked: boolean;
  syncedCount: number;
  canReview: boolean;
  canFinalize: boolean;
  connOk: boolean;
  treatmentStale: boolean;
  patientSynced: boolean;
  patientDirty: boolean;
};

type VisitActions = {
  setPhase: (phase: Phase) => void;
  generate: () => void;
  regenerate: () => void;
  manualEntry: () => void;
  retryApi: () => void;
  toggleReviewed: () => void;
  finalize: () => void;
  reset: () => void;
  setNote: (value: string) => void;
  setTreatmentQuery: (value: string) => void;
  searchTreatments: () => void;
  searchTreatmentTerm: (term: string) => void;
  selectTreatment: (id: string) => void;
  togglePatientEdit: () => void;
  syncPatient: () => void;
  setDraftPatientField: (field: keyof VisitPatient, value: string) => void;
  savePatient: () => void;
  cancelPatientEdit: () => void;
  setPatientDraft: (value: string) => void;
  setClinicianReply: (value: string) => void;
  copySpanishInstructions: () => void;
  sendPatientMessage: () => void;
  sendClinicianReply: () => void;
  fillPatientExample: () => void;
  toggleCheck: (key: SafetyCheckKey) => void;
  showToast: (message: string) => void;
};

export type VisitWorkflow = {
  state: VisitState;
  derived: DerivedVisitState;
  actions: VisitActions;
};

function getPhasePreset(
  phase: Phase,
): Pick<
  VisitState,
  | "phase"
  | "reviewed"
  | "finalized"
  | "integrationMode"
  | "instructionsHeading"
  | "instructions"
  | "instructionsPlainText"
  | "patient"
  | "draftPatient"
  | "patientEditing"
  | "patientDirty"
  | "patientSyncStatus"
  | "patientId"
  | "treatmentId"
  | "milestones"
  | "logEntries"
> {
  const finalized = phase === "final";

  return {
    phase,
    reviewed: finalized,
    finalized,
    integrationMode: "fixture",
    instructionsHeading: INITIAL_STATE.instructionsHeading,
    instructions: INITIAL_STATE.instructions,
    instructionsPlainText: INITIAL_STATE.instructionsPlainText,
    patient: INITIAL_STATE.patient,
    draftPatient: INITIAL_STATE.draftPatient,
    patientEditing: false,
    patientDirty: false,
    patientSyncStatus: phase === "idle" ? "none" : "synced",
    patientId: phase === "idle" ? "" : "pat_01HQ7K4M2Z",
    treatmentId: INITIAL_STATE.treatmentId,
    milestones: buildMilestones(phase),
    logEntries: buildLog(phase, finalized),
  };
}

function getDerived(state: VisitState): DerivedVisitState {
  const { phase, checks, reviewed } = state;
  const isIdle = phase === "idle";
  const isLoading = phase === "loading";
  const isAiError = phase === "aiError";
  const isApiError = phase === "apiError";
  const hasInstructions = phase === "review" || phase === "final" || phase === "apiError";
  const finalized = state.finalized && phase === "final";
  const checksDone = Object.values(checks).filter(Boolean).length;
  const allChecked = checksDone === 4;
  const syncedCount = SYNCED_KEYS.filter((key) => checks[key]).length;
  const canReview = hasInstructions;
  const connOk = !isIdle;
  const treatmentStale = hasInstructions && state.selectedTreatment.id !== state.treatmentId;
  const patientSynced = state.patientSyncStatus === "synced" || state.patientSyncStatus === "updated";
  const canFinalize =
    hasInstructions && reviewed && allChecked && !isApiError && !treatmentStale && patientSynced && !state.patientDirty;

  return {
    isIdle,
    isLoading,
    isAiError,
    isApiError,
    hasInstructions,
    finalized,
    checksDone,
    allChecked,
    syncedCount,
    canReview,
    canFinalize,
    connOk,
    treatmentStale,
    patientSynced,
    patientDirty: state.patientDirty,
  };
}

function stamp(threadLength: number): string {
  const base = 10 * 60 + 44 + threadLength * 2;
  const h = Math.floor(base / 60);
  const m = base % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function esToEn(text: string): string {
  const l = text.toLowerCase();
  if (/amamant|lactan|pecho|seno/.test(l)) return "Is it safe to use this cream while I'm breastfeeding?";
  if (/duele|dolor|arde|quema/.test(l)) return "Can I use the cream if my skin hurts or stings?";
  if (/cuánto|cuanto|tiempo|días|dias/.test(l)) return "How long do I need to use the cream?";
  return `"${text}" — translated for clinician review.`;
}

function enToEs(text: string): string {
  const l = text.toLowerCase();
  if (/safe|breastfeed/.test(l)) {
    return "Sí, puede seguir usando la crema mientras amamanta. No la aplique en el pecho y avíseme si algo cambia.";
  }
  if (/stop|days|week/.test(l)) return "Úsela durante 7 días y luego deténgase. Si no mejora, llame a la clínica.";
  return `«${text}» — traducción para la paciente.`;
}

function isClinical(text: string): boolean {
  return /amamant|lactan|pecho|seno|duele|dolor|arde|quema|embarazo|alergia|efecto|seguro|segura/i.test(text);
}

async function postJson<TResponse>(url: string, body?: Record<string, unknown>): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) throw new Error(`${url} failed with ${response.status}`);
  return response.json() as Promise<TResponse>;
}

async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`${url} failed with ${response.status}`);
  return response.json() as Promise<TResponse>;
}

function combineSingleMode(currentMode: InstructionsResponse["mode"], nextMode: InstructionsResponse["mode"]) {
  return currentMode === "live" || nextMode === "live" ? "live" : "fixture";
}

async function requestTranslation(text: string, direction: TranslateDirection): Promise<TranslateResponse> {
  return postJson<TranslateResponse>("/api/translate", { text, direction });
}

function toPhotonPatientInput(patient: VisitPatient): PhotonPatientInput {
  return {
    externalId: patient.externalId || undefined,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    sex: patient.sex === "Male" ? "MALE" : patient.sex === "Female" ? "FEMALE" : "UNKNOWN",
    phone: patient.phone || undefined,
  };
}

function fromPhotonPatientInput(patient: PhotonPatientInput & { externalId: string }): VisitPatient {
  return {
    externalId: patient.externalId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    sex: patient.sex === "MALE" ? "Male" : patient.sex === "FEMALE" ? "Female" : "Other",
    phone: patient.phone ?? "",
  };
}

export function useVisitWorkflow(): VisitWorkflow {
  const [state, setState] = useState<VisitState>(INITIAL_STATE);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  };

  const showToast = (message: string) => {
    clearToastTimer();
    setState((current) => ({ ...current, toast: message }));
    toastTimerRef.current = setTimeout(() => {
      setState((current) => ({ ...current, toast: "" }));
      toastTimerRef.current = null;
    }, TOAST_DELAY_MS);
  };

  const beginGenerate = async () => {
    setState((current) => ({
      ...current,
      phase: "loading",
      reviewed: false,
      finalized: false,
    }));

    try {
      const instructions = await postJson<InstructionsResponse>("/api/instructions", {
        note: state.note,
        patient: toPhotonPatientInput(state.patient),
        treatment: state.selectedTreatment,
      });
      setState((current) => ({
        ...current,
        phase: "review",
        reviewed: false,
        finalized: false,
        integrationMode: combineSingleMode(current.integrationMode, instructions.mode),
        instructionsHeading: instructions.headingEs,
        instructions: instructions.blocks,
        instructionsPlainText: instructions.plainText,
        logEntries: [...current.logEntries, instructions.logEntry],
      }));
    } catch {
      setState((current) => ({
        ...current,
        phase: "aiError",
        reviewed: false,
        finalized: false,
        logEntries: [
          ...current.logEntries,
          {
            t: new Date().toTimeString().slice(0, 8),
            code: "502",
            msg: "openai · instructions.generate",
            isError: true,
          },
        ],
      }));
    }
  };

  const syncPatient = async () => {
    setState((current) => ({
      ...current,
      patientSyncStatus: "pending",
      finalized: false,
      milestones: buildMilestones("loading"),
    }));

    try {
      const photon = await postJson<PhotonSyncResponse>("/api/photon/sync", {
        patient: toPhotonPatientInput(state.patient),
        treatment: state.selectedTreatment,
      });
      setState((current) => ({
        ...current,
        phase: current.phase === "apiError" ? "review" : current.phase,
        integrationMode: combineSingleMode(current.integrationMode, photon.mode),
        patientId: photon.patientId,
        treatmentId: photon.treatmentId,
        patientSyncStatus: current.patientDirty ? "updated" : "synced",
        patientDirty: false,
        patient: photon.patient ? fromPhotonPatientInput(photon.patient) : current.patient,
        draftPatient: photon.patient ? fromPhotonPatientInput(photon.patient) : current.draftPatient,
        milestones: photon.milestones,
        logEntries: [...current.logEntries, ...photon.logEntries],
      }));
    } catch {
      setState((current) => ({
        ...current,
        phase: "apiError",
        patientSyncStatus: "none",
        milestones: buildMilestones("apiError"),
        logEntries: buildLog("apiError", false),
      }));
      showToast("Photon patient sync failed");
    }
  };

  const runTreatmentSearch = async (rawTerm: string) => {
    const term = rawTerm.trim();
    if (term.length < 2) {
      showToast("Type at least 2 characters to search");
      return;
    }

    setState((current) => ({ ...current, treatmentQuery: term, treatmentSearchStatus: "loading" }));
    try {
      const response = await getJson<PhotonTreatmentSearchResponse>(
        `/api/photon/treatments?term=${encodeURIComponent(term)}`,
      );
      setState((current) => ({
        ...current,
        integrationMode: current.integrationMode === "live" || response.mode === "live" ? "live" : "fixture",
        treatmentResults: response.results,
        treatmentSearchStatus: "ready",
        logEntries: [
          ...current.logEntries,
          {
            t: new Date().toTimeString().slice(0, 8),
            code: "200",
            msg: `GET /catalog/treatments → ${response.results.length} result${response.results.length === 1 ? "" : "s"}`,
          },
        ],
      }));
    } catch {
      setState((current) => ({ ...current, treatmentSearchStatus: "error" }));
      showToast("Treatment search failed");
    }
  };

  useEffect(() => {
    return () => {
      clearToastTimer();
    };
  }, []);

  const derived = getDerived(state);

  const actions: VisitActions = {
    setPhase: (phase) => {
      setState((current) => ({ ...current, ...getPhasePreset(phase) }));
    },
    generate: beginGenerate,
    regenerate: beginGenerate,
    manualEntry: () => {
      setState((current) => ({ ...current, phase: "review", reviewed: false, finalized: false }));
      showToast("Switched to manual entry");
    },
    retryApi: () => {
      setState((current) => ({ ...current, phase: "review", reviewed: false, finalized: false }));
      showToast(`Treatment lookup succeeded · ${state.treatmentId}`);
    },
    toggleReviewed: () => {
      if (!derived.hasInstructions) {
        showToast("Generate instructions first");
        return;
      }
      setState((current) => ({
        ...current,
        phase: "review",
        reviewed: !current.reviewed,
        finalized: false,
      }));
    },
    finalize: () => {
      if (derived.isApiError) {
        showToast("Resolve the treatment lookup first");
        return;
      }
      if (derived.treatmentStale) {
        showToast("Regenerate instructions for the selected treatment");
        return;
      }
      if (!derived.hasInstructions) {
        showToast("Generate the Spanish instructions first");
        return;
      }
      if (derived.patientDirty) {
        showToast("Use Sync patient before finalizing");
        return;
      }
      if (!derived.patientSynced) {
        showToast("Sync the patient to Photon first");
        return;
      }
      if (!state.reviewed) {
        showToast("Mark the AI output reviewed first");
        return;
      }
      if (!derived.allChecked) {
        showToast("Complete the safety review first");
        return;
      }
      setState((current) => ({
        ...current,
        phase: "final",
        finalized: true,
        logEntries: [
          ...current.logEntries,
          { t: new Date().toTimeString().slice(0, 8), code: "200", msg: "handoff prepared · no Rx written" },
        ],
      }));
      showToast("Handoff prepared — continue in Photon");
    },
    reset: () => {
      clearToastTimer();
      setState(INITIAL_STATE);
    },
    setNote: (value) => setState((current) => ({ ...current, note: value })),
    setTreatmentQuery: (value) => setState((current) => ({ ...current, treatmentQuery: value })),
    searchTreatments: () => void runTreatmentSearch(state.treatmentQuery),
    searchTreatmentTerm: (term) => void runTreatmentSearch(term),
    selectTreatment: (id) => {
      const treatment = state.treatmentResults.find((result) => result.id === id);
      if (!treatment) return;

      setState((current) => ({
        ...current,
        selectedTreatment: treatment,
        finalized: false,
        logEntries: [
          ...current.logEntries,
          {
            t: new Date().toTimeString().slice(0, 8),
            code: "200",
            msg: `Selected treatment → ${treatment.id}`,
          },
        ],
      }));

      if (derived.hasInstructions && treatment.id !== state.treatmentId) {
        showToast("Treatment changed · regenerate instructions before handoff");
      }
    },
    togglePatientEdit: () => {
      setState((current) => ({
        ...current,
        draftPatient: current.patientEditing ? current.draftPatient : { ...current.patient },
        patientEditing: !current.patientEditing,
      }));
    },
    syncPatient: () => void syncPatient(),
    setDraftPatientField: (field, value) => {
      setState((current) => ({
        ...current,
        draftPatient: { ...current.draftPatient, [field]: value },
      }));
    },
    savePatient: () => {
      setState((current) => ({
        ...current,
        patient: { ...current.draftPatient },
        patientEditing: false,
        patientDirty: true,
        finalized: false,
        logEntries: [
          ...current.logEntries,
          { t: new Date().toTimeString().slice(0, 8), code: "200", msg: "Patient saved locally" },
        ],
      }));
      showToast("Patient saved · use Sync patient to write it to Photon");
    },
    cancelPatientEdit: () => {
      setState((current) => ({
        ...current,
        draftPatient: { ...current.patient },
        patientEditing: false,
      }));
    },
    setPatientDraft: (value) => setState((current) => ({ ...current, patientDraft: value })),
    setClinicianReply: (value) => setState((current) => ({ ...current, clinicianReply: value })),
    copySpanishInstructions: () => {
      try {
        void navigator.clipboard.writeText(state.instructionsPlainText);
      } catch {}
      showToast("Spanish instructions copied to clipboard");
    },
    sendPatientMessage: async () => {
      const text = state.patientDraft.trim();
      if (!text) {
        showToast("Escriba una pregunta primero");
        return;
      }
      let translated = esToEn(text);
      let flagged = isClinical(text);
      try {
        const result = await requestTranslation(text, "es→en");
        translated = result.translated;
        flagged = result.isClinicalQuestion;
      } catch {}
      setState((current) => ({
        ...current,
        patientDraft: "",
        thread: [
          ...current.thread,
          {
            id: `msg_${current.thread.length + 1}`,
            from: "patient",
            es: text,
            en: translated,
            time: stamp(current.thread.length),
            flagged,
          },
        ],
      }));
      if (flagged) showToast("Clinical question flagged for clinician");
    },
    sendClinicianReply: async () => {
      const text = state.clinicianReply.trim();
      if (!text) {
        showToast("Type a reply first");
        return;
      }
      let translated = enToEs(text);
      try {
        translated = (await requestTranslation(text, "en→es")).translated;
      } catch {}
      setState((current) => ({
        ...current,
        clinicianReply: "",
        thread: [
          ...current.thread,
          {
            id: `msg_${current.thread.length + 1}`,
            from: "clinician",
            es: translated,
            en: text,
            time: stamp(current.thread.length),
          },
        ],
      }));
    },
    fillPatientExample: () => setState((current) => ({ ...current, patientDraft: PATIENT_FOLLOWUP_EXAMPLE })),
    toggleCheck: (key) => {
      setState((current) => ({
        ...current,
        checks: { ...current.checks, [key]: !current.checks[key] },
      }));
    },
    showToast,
  };

  return { state, derived, actions };
}
