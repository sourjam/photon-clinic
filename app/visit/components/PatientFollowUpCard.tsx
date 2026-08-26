"use client";

import type { ThreadMessage } from "../types";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";

type PatientFollowUpCardProps = {
  thread: ThreadMessage[];
  patientDraft: string;
  clinicianReply: string;
  onPatientDraftChange: (value: string) => void;
  onClinicianReplyChange: (value: string) => void;
  onSendPatient: () => void;
  onSendClinician: () => void;
  onFillExample: () => void;
};

const textareaClasses = [
  "w-full",
  "rounded-[7px]",
  "bg-surface",
  "px-[11px]",
  "py-[10px]",
  "min-h-[52px]",
  "text-[12.5px]",
  "leading-[1.5]",
  "text-ink-2",
  "resize-y",
  "outline-none",
  "focus:border-brand",
  "focus:ring-2",
  "focus:ring-brand/15",
].join(" ");

function FlagPill() {
  return (
    <div className="mt-[7px] flex items-center gap-[6px] rounded-[5px] border border-warn-line bg-warn-bg px-2 py-1">
      <span aria-hidden="true" className="h-[5px] w-[5px] shrink-0 rounded-full bg-warn" />
      <span className="text-[10.5px] font-semibold text-warn-ink">
        Clinical question — flagged for clinician, not answered by AI
      </span>
    </div>
  );
}

function ThreadBubble({ message }: { message: ThreadMessage }) {
  const isPatient = message.from === "patient";

  return (
    <div className={["flex", isPatient ? "justify-start" : "justify-end"].join(" ")}>
      <div
        className={[
          "max-w-[86%] border px-[11px] py-[9px]",
          isPatient
            ? "rounded-[9px_9px_9px_2px] border-brand-line-2 bg-brand-bg-2"
            : "rounded-[9px_9px_2px_9px] border-line-2 bg-surface-alt",
        ].join(" ")}
      >
        <div className="mb-1 flex items-baseline justify-between gap-[9px]">
          <span
            className={[
              "text-[10px] font-bold uppercase tracking-[.05em]",
              isPatient ? "text-brand-ink-3" : "text-ink-5",
            ].join(" ")}
          >
            {isPatient ? "Paciente" : "Clínico"}
          </span>
          <span className="font-mono text-[9.5px] text-muted-4">{message.time}</span>
        </div>
        <div className="text-[12.5px] leading-[1.55] text-ink" lang="es">
          {message.es}
        </div>
        <div
          className={["mt-1 text-[11.5px] leading-[1.45] italic", isPatient ? "text-brand-ink-3" : "text-muted"].join(
            " ",
          )}
          lang="en"
        >
          EN · {message.en}
        </div>
        {isPatient && message.flagged ? <FlagPill /> : null}
      </div>
    </div>
  );
}

export function PatientFollowUpCard({
  thread,
  patientDraft,
  clinicianReply,
  onPatientDraftChange,
  onClinicianReplyChange,
  onSendPatient,
  onSendClinician,
  onFillExample,
}: PatientFollowUpCardProps) {
  return (
    <Card>
      <CardHeader title="Patient follow-up" />
      {thread.length === 0 ? (
        <div className="px-4 py-5 text-center text-[12.5px] text-muted-3">
          No follow-up questions yet. Either side can start the thread below.
        </div>
      ) : (
        <div className="flex flex-col gap-[9px] px-[14px] py-3">
          {thread.map((message) => (
            <ThreadBubble key={message.id} message={message} />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-[11px] border-t border-line-soft bg-surface-sunken px-[14px] py-3">
        <div>
          <label
            className="mb-[3px] block text-[10px] font-semibold uppercase tracking-[.06em] text-brand-ink-4"
            htmlFor="patient-followup-draft"
          >
            Paciente · escriba en español
          </label>
          <textarea
            className={[textareaClasses, "border border-brand-line-3"].join(" ")}
            id="patient-followup-draft"
            lang="es"
            onChange={(event) => onPatientDraftChange(event.currentTarget.value)}
            placeholder="¿Puedo usar la crema si me duele la piel?"
            value={patientDraft}
          />
          <div className="mt-2 flex flex-wrap items-center gap-[7px]">
            <button
              className="rounded-[13px] border border-brand-line-3 bg-surface px-[10px] py-[5px] text-[11px] font-medium text-brand-ink-3"
              onClick={onFillExample}
              type="button"
            >
              Ejemplo: lactancia
            </button>
            <div className="flex-1" />
            <Button onClick={onSendPatient} size="sm" variant="primary">
              Translate to English →
            </Button>
          </div>
        </div>
        <div className="border-t border-dashed border-line-2 pt-[11px]">
          <label
            className="mb-[3px] block text-[10px] font-semibold uppercase tracking-[.06em] text-muted-3"
            htmlFor="clinician-followup-reply"
          >
            Clinician reply · English
          </label>
          <textarea
            className={[textareaClasses, "border border-line-input"].join(" ")}
            id="clinician-followup-reply"
            onChange={(event) => onClinicianReplyChange(event.currentTarget.value)}
            placeholder="Yes — it is safe to keep using it while breastfeeding…"
            value={clinicianReply}
          />
          <div className="mt-2 flex justify-end">
            <Button onClick={onSendClinician} size="sm" variant="primary">
              Translate to Spanish →
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
