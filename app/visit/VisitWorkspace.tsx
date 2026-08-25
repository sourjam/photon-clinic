"use client";

import { AppHeader, type OverallStatus } from "./components/AppHeader";
import { ClinicianNoteCard } from "./components/ClinicianNoteCard";
import { ClinicianReviewCard } from "./components/ClinicianReviewCard";
import { MedicationPrepCard, type TreatmentIdState } from "./components/MedicationPrepCard";
import { PatientContextCard } from "./components/PatientContextCard";
import { PatientFollowUpCard } from "./components/PatientFollowUpCard";
import { SafetyReviewCard } from "./components/SafetyReviewCard";
import { SpanishInstructionsCard } from "./components/SpanishInstructionsCard";
import { MEDICATION, PATIENT, PHOTON, REVIEWER } from "./demoData";
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

  return (
    <div className="flex h-screen flex-col bg-page">
      <div data-region="prototype-chrome" />
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
          <aside className={columnClasses} data-region="right" />
        </div>
        <div data-region="action-bar" />
      </div>
    </div>
  );
}
