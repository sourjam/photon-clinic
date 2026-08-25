import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { FieldLabel } from "./ui/FieldLabel";

type PatientContextCardProps = {
  visitReason: string;
  allergies: string;
  currentMeds: string;
  raisedInVisit: string;
};

const cells = [
  {
    key: "visitReason",
    label: "Visit reason",
    basis: "flex-[1_1_150px]",
    labelTone: "default",
    valueClassName: "text-ink",
    cellClassName: "border-r border-line-softer",
  },
  {
    key: "allergies",
    label: "Allergies",
    basis: "flex-[1_1_130px]",
    labelTone: "warn",
    valueClassName: "text-warn-ink-3",
    cellClassName: "border-r border-line-softer bg-warn-bg",
  },
  {
    key: "currentMeds",
    label: "Current meds",
    basis: "flex-[1_1_140px]",
    labelTone: "default",
    valueClassName: "text-ink",
    cellClassName: "border-r border-line-softer",
  },
  {
    key: "raisedInVisit",
    label: "Raised in visit",
    basis: "flex-[1_1_160px]",
    labelTone: "warn",
    valueClassName: "text-warn-ink-3",
    cellClassName: "bg-warn-bg",
  },
] as const;

export function PatientContextCard(props: PatientContextCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Patient context" />
      <dl className="flex flex-wrap">
        {cells.map((cell) => (
          <div
            className={["px-[14px] py-[10px]", cell.basis, cell.cellClassName].join(" ")}
            key={cell.key}
          >
            <dt>
              <FieldLabel tone={cell.labelTone}>{cell.label}</FieldLabel>
            </dt>
            <dd className={["text-[12.5px] font-semibold", cell.valueClassName].join(" ")}>
              {props[cell.key]}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
