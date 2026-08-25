"use client";

import { useEffect, useRef, useState } from "react";
import { INITIAL_STATE, PATIENT_FOLLOWUP_EXAMPLE, PHOTON, SPANISH_INSTRUCTIONS_PLAIN } from "./demoData";
import type { Phase, SafetyCheckKey, VisitState } from "./types";

const GENERATE_DELAY_MS = 1400;
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

function getPhasePreset(phase: Phase): Pick<VisitState, "phase" | "reviewed" | "finalized"> {
  return {
    phase,
    reviewed: phase === "final",
    finalized: phase === "final",
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
  const canFinalize = hasInstructions && reviewed && allChecked && !isApiError;
  const connOk = !isIdle;

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

export function useVisitWorkflow(): VisitWorkflow {
  const [state, setState] = useState<VisitState>(INITIAL_STATE);
  const generateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGenerateTimer = () => {
    if (generateTimerRef.current) {
      clearTimeout(generateTimerRef.current);
      generateTimerRef.current = null;
    }
  };

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

  const beginGenerate = () => {
    clearGenerateTimer();
    setState((current) => ({ ...current, phase: "loading", reviewed: false, finalized: false }));
    generateTimerRef.current = setTimeout(() => {
      setState((current) => ({ ...current, phase: "review", reviewed: false, finalized: false }));
      generateTimerRef.current = null;
    }, GENERATE_DELAY_MS);
  };

  useEffect(() => {
    return () => {
      clearGenerateTimer();
      clearToastTimer();
    };
  }, []);

  const derived = getDerived(state);

  const actions: VisitActions = {
    setPhase: (phase) => {
      clearGenerateTimer();
      setState((current) => ({ ...current, ...getPhasePreset(phase) }));
    },
    generate: beginGenerate,
    regenerate: beginGenerate,
    manualEntry: () => {
      clearGenerateTimer();
      setState((current) => ({ ...current, phase: "review", reviewed: false, finalized: false }));
      showToast("Switched to manual entry");
    },
    retryApi: () => {
      setState((current) => ({ ...current, phase: "review", reviewed: false, finalized: false }));
      showToast(`Treatment lookup succeeded · ${PHOTON.treatmentId}`);
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
      if (!derived.hasInstructions) {
        showToast("Generate the Spanish instructions first");
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
      setState((current) => ({ ...current, phase: "final", finalized: true }));
      showToast("Handoff prepared — continue in Photon");
    },
    reset: () => {
      clearGenerateTimer();
      clearToastTimer();
      setState(INITIAL_STATE);
    },
    setNote: (value) => setState((current) => ({ ...current, note: value })),
    setPatientDraft: (value) => setState((current) => ({ ...current, patientDraft: value })),
    setClinicianReply: (value) => setState((current) => ({ ...current, clinicianReply: value })),
    copySpanishInstructions: () => {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard
          .writeText(SPANISH_INSTRUCTIONS_PLAIN)
          .then(() => {
            showToast("Spanish instructions copied to clipboard");
          })
          .catch(() => {
            showToast("Clipboard unavailable");
          });
        return;
      }

      showToast("Clipboard unavailable");
    },
    sendPatientMessage: () => {
      const text = state.patientDraft.trim();
      if (!text) {
        showToast("Escriba una pregunta primero");
        return;
      }
      const flagged = isClinical(text);
      setState((current) => ({
        ...current,
        patientDraft: "",
        thread: [
          ...current.thread,
          {
            id: `msg_${current.thread.length + 1}`,
            from: "patient",
            es: text,
            en: esToEn(text),
            time: stamp(current.thread.length),
            flagged,
          },
        ],
      }));
      if (flagged) showToast("Clinical question flagged for clinician");
    },
    sendClinicianReply: () => {
      const text = state.clinicianReply.trim();
      if (!text) {
        showToast("Type a reply first");
        return;
      }
      setState((current) => ({
        ...current,
        clinicianReply: "",
        thread: [
          ...current.thread,
          {
            id: `msg_${current.thread.length + 1}`,
            from: "clinician",
            es: enToEs(text),
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
