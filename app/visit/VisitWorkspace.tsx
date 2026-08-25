"use client";

import { AppHeader, type OverallStatus } from "./components/AppHeader";
import { ActionBar } from "./components/ActionBar";
import { AiErrorCard } from "./components/AiErrorCard";
import { ClinicianNoteCard } from "./components/ClinicianNoteCard";
import { ClinicianReviewCard } from "./components/ClinicianReviewCard";
import { EvidenceLogCard } from "./components/EvidenceLogCard";
import { HandoffCard, type HandoffStatus } from "./components/HandoffCard";
import { MedicationPrepCard, type TreatmentIdState } from "./components/MedicationPrepCard";
import { PatientContextCard } from "./components/PatientContextCard";
import { PatientFollowUpCard } from "./components/PatientFollowUpCard";
import { PhotonConnectionCard } from "./components/PhotonConnectionCard";
import { PhotonErrorCard } from "./components/PhotonErrorCard";
import { PrototypeSwitcher } from "./components/PrototypeSwitcher";
import { SafetyReviewCard } from "./components/SafetyReviewCard";
import { SpanishInstructionsCard } from "./components/SpanishInstructionsCard";
import { SyncMilestonesCard } from "./components/SyncMilestonesCard";
import { Toast } from "./components/Toast";
import { buildLog, buildMilestones, HANDOFF_ROWS, MEDICATION, PATIENT, PHOTON, REVIEWER } from "./demoData";
import type { Phase } from "./types";
import { useVisitWorkflow } from "./useVisitWorkflow";

const bodyClasses = [
  "flex",
  "flex-col",
  "gap-4",
  "p-[14px_14px_18px]",
  "flex-1",
  "min-h-0",
  "items-stretch",
  "overflow-visible",
  "wide:grid",
  "wide:grid-cols-[minmax(0,62fr)_minmax(330px,38fr)]",
  "wide:p-[16px_20px_20px]",
  "wide:overflow-hidden",
].join(" ");

const columnClasses = [
  "flex",
  "flex-col",
  "gap-3",
  "min-w-0",
  "wide:min-h-0",
  "wide:overflow-y-auto",
  "wide:overflow-x-hidden",
  "wide:pr-1",
].join(" ");

function getActionHint(phase: Phase, reviewed: boolean): string {
  if (phase === "idle") return "";
  if (phase === "loading") return "Generating Spanish instructions…";
  if (phase === "final") return "Handoff prepared · no prescription was created by this app";
  if (phase === "aiError") return "Generation failed · nothing sent to Photon";
  if (phase === "apiError") return "Treatment lookup failed · handoff blocked";
  if (reviewed) return "Reviewed · ready to finalize the handoff";
  return "Mark the AI output reviewed to enable the handoff";
}

const showPrototypeSwitcher = import.meta.env.DEV || import.meta.env.VITE_SHOW_PROTOTYPE_CONTROLS === "true";

export function VisitWorkspace() {
  const workflow = useVisitWorkflow();
  const { derived } = workflow;
  const status: OverallStatus = derived.finalized
    ? "prepared"
    : derived.isAiError || derived.isApiError
      ? "actionNeeded"
      : "preparing";
  const treatmentIdState: TreatmentIdState =
    derived.isIdle || derived.isAiError || derived.isLoading
      ? "awaiting"
      : derived.isApiError
        ? "failed"
        : "resolved";
  const handoffStatus: HandoffStatus = derived.finalized
    ? "ready"
    : derived.isApiError
      ? "blocked"
      : derived.hasInstructions
        ? "notFinalized"
        : "waiting";
  const evidenceEntries = [
    ...buildLog(workflow.state.phase, derived.finalized),
    ...workflow.state.thread.map((message) => ({
      t: message.time,
      code: "200",
      msg: `openai · message.translate (${message.from === "patient" ? "es→en" : "en→es"})`,
      isError: false,
    })),
  ];

  return (
    <div className="flex h-screen flex-col bg-page">
      {showPrototypeSwitcher ? (
        <PrototypeSwitcher onPick={workflow.actions.setPhase} phase={workflow.state.phase} />
      ) : null}
      <Toast message={workflow.state.toast} />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-page wide:overflow-hidden">
        <AppHeader
          environment={PHOTON.env}
          patientMeta={PATIENT.meta}
          patientName={PATIENT.name}
          status={status}
          visitSummary={PATIENT.visit}
        />
        <div className={bodyClasses}>
          <section className={columnClasses} data-region="left">
            <PatientContextCard
              allergies={PATIENT.allergies}
              currentMeds={PATIENT.currentMeds}
              raisedInVisit={PATIENT.raisedInVisit}
              visitReason={PATIENT.visitReason}
            />
            <ClinicianNoteCard
              hasInstructions={derived.hasInstructions}
              isLoading={derived.isLoading}
              note={workflow.state.note}
              onGenerate={workflow.actions.generate}
              onNoteChange={workflow.actions.setNote}
            />
            {derived.isAiError ? (
              <AiErrorCard onRetry={workflow.actions.generate} onWriteManually={workflow.actions.manualEntry} />
            ) : null}
            <SpanishInstructionsCard
              hasInstructions={derived.hasInstructions}
              isAiError={derived.isAiError}
              isIdle={derived.isIdle}
              isLoading={derived.isLoading}
              onCopy={workflow.actions.copySpanishInstructions}
              onRegenerate={workflow.actions.regenerate}
              reviewed={workflow.state.reviewed}
            />
            <MedicationPrepCard
              medication={MEDICATION}
              treatmentId={PHOTON.treatmentId}
              treatmentIdState={treatmentIdState}
            />
            <SafetyReviewCard
              allChecked={derived.allChecked}
              checks={workflow.state.checks}
              onToggle={workflow.actions.toggleCheck}
              syncedCount={derived.syncedCount}
            />
            <ClinicianReviewCard
              canReview={derived.canReview}
              onToggleReviewed={workflow.actions.toggleReviewed}
              reviewed={workflow.state.reviewed}
              reviewerName={REVIEWER.name}
              reviewerTime={REVIEWER.time}
            />
            <PatientFollowUpCard
              clinicianReply={workflow.state.clinicianReply}
              onClinicianReplyChange={workflow.actions.setClinicianReply}
              onFillExample={workflow.actions.fillPatientExample}
              onPatientDraftChange={workflow.actions.setPatientDraft}
              onSendClinician={workflow.actions.sendClinicianReply}
              onSendPatient={workflow.actions.sendPatientMessage}
              patientDraft={workflow.state.patientDraft}
              thread={workflow.state.thread}
            />
          </section>
          <aside className={columnClasses} data-region="right">
            <PhotonConnectionCard
              connected={derived.connOk}
              host={PHOTON.host}
              prescribeScope={PHOTON.prescribeScope}
              scope={PHOTON.scope}
            />
            <SyncMilestonesCard milestones={buildMilestones(workflow.state.phase)} />
            {derived.isApiError ? <PhotonErrorCard onRetry={workflow.actions.retryApi} /> : null}
            <HandoffCard rows={HANDOFF_ROWS} status={handoffStatus} />
            <EvidenceLogCard entries={evidenceEntries} />
          </aside>
        </div>
        <ActionBar
          canCopy={derived.hasInstructions}
          canFinalize={derived.canFinalize}
          finalized={derived.finalized}
          hint={getActionHint(workflow.state.phase, workflow.state.reviewed)}
          onCopy={workflow.actions.copySpanishInstructions}
          onFinalize={workflow.actions.finalize}
          onReset={workflow.actions.reset}
        />
      </div>
    </div>
  );
}
