import type { MEDICATION } from "../demoData";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { FieldLabel } from "./ui/FieldLabel";

export type TreatmentIdState = "awaiting" | "failed" | "resolved";

type MedicationPrepCardProps = {
  medication: typeof MEDICATION;
  treatmentIdState: TreatmentIdState;
  treatmentId: string;
};

const treatmentIdChipClasses: Record<TreatmentIdState, string> = {
  awaiting: "bg-surface-muted text-muted-2",
  failed: "bg-err-bg text-err-ink",
  resolved: "bg-brand-bg-3 text-brand-ink",
};

const unresolvedTreatmentIdLabels: Record<Exclude<TreatmentIdState, "resolved">, string> = {
  awaiting: "awaiting lookup",
  failed: "lookup failed",
};

export function MedicationPrepCard({ medication, treatmentIdState, treatmentId }: MedicationPrepCardProps) {
  const chipLabel =
    treatmentIdState === "resolved" ? treatmentId : unresolvedTreatmentIdLabels[treatmentIdState];

  return (
    <Card>
      <CardHeader title="Medication prep" meta="Prepared for Photon · not prescribed here" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-[14px] py-[13px]">
        <div className="col-span-2">
          <FieldLabel>Medication</FieldLabel>
          <div className="flex flex-wrap items-center gap-[9px]">
            <span className="text-[13.5px] font-bold text-ink">{medication.name}</span>
            <span
              className={[
                "rounded-[5px] px-2 py-[3px] font-mono text-[10.5px]",
                treatmentIdChipClasses[treatmentIdState],
              ].join(" ")}
            >
              {chipLabel}
            </span>
          </div>
        </div>

        <div className="col-span-2">
          <FieldLabel>Directions</FieldLabel>
          <div className="text-[12.5px] font-medium leading-[1.5] text-ink">{medication.directions}</div>
        </div>

        <div>
          <FieldLabel>Quantity</FieldLabel>
          <div className="text-[12.5px] font-semibold text-ink">{medication.quantity}</div>
        </div>

        <div>
          <FieldLabel>Refills</FieldLabel>
          <div className="text-[12.5px] font-semibold text-ink">{medication.refills}</div>
        </div>

        <div className="col-span-2">
          <FieldLabel>Notes to pharmacist</FieldLabel>
          <div className="text-[12.5px] leading-[1.5] text-ink-3">{medication.pharmacistNotes}</div>
        </div>
      </div>
    </Card>
  );
}
