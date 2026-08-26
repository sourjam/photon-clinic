import type { PatientSex, PatientSyncStatus, VisitPatient } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { FieldLabel } from "./ui/FieldLabel";

type PatientContextCardProps = {
  patient: VisitPatient;
  draftPatient: VisitPatient;
  editing: boolean;
  dirty: boolean;
  syncStatus: PatientSyncStatus;
  photonPatientId: string;
  visitReason: string;
  allergies: string;
  currentMeds: string;
  raisedInVisit: string;
  onToggleEdit: () => void;
  onDraftChange: (field: keyof VisitPatient, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
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

const demographics = [
  ["Name", (patient: VisitPatient) => `${patient.firstName} ${patient.lastName}`.trim() || "—"],
  ["Date of birth", (patient: VisitPatient) => patient.dateOfBirth || "—"],
  ["Sex", (patient: VisitPatient) => patient.sex || "—"],
  ["Phone", (patient: VisitPatient) => patient.phone || "—"],
  ["External ID", (patient: VisitPatient) => patient.externalId || "none"],
] as const;

const sexOptions = ["Female", "Male", "Other"] as const satisfies readonly PatientSex[];

function getSyncBadge(syncStatus: PatientSyncStatus, dirty: boolean): { tone: "neutral" | "info" | "success" | "warn"; label: string } {
  if (syncStatus === "pending") return { tone: "info", label: "Syncing…" };
  if (dirty) return { tone: syncStatus === "none" ? "neutral" : "warn", label: "Local edits not yet synced" };
  if (syncStatus === "updated") return { tone: "success", label: "Updated in Photon" };
  if (syncStatus === "synced") return { tone: "success", label: "Synced to Photon" };
  return { tone: "neutral", label: "Not synced" };
}

export function PatientContextCard(props: PatientContextCardProps) {
  const syncBadge = getSyncBadge(props.syncStatus, props.dirty);

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Patient context">
        <div className="flex items-center gap-2">
          <Badge tone={syncBadge.tone}>{syncBadge.label}</Badge>
          <Button onClick={props.onToggleEdit} size="sm" variant="ghost">
            {props.editing ? "Close" : "Edit patient"}
          </Button>
        </div>
      </CardHeader>
      {props.editing ? (
        <div className="grid grid-cols-1 gap-3 border-b border-line-soft px-[14px] py-3 wide:grid-cols-3">
          <div>
            <FieldLabel>First name</FieldLabel>
            <input
              aria-label="First name"
              className="w-full rounded-[6px] border border-line-input bg-surface-sunken px-[9px] py-[7px] text-[12.5px] text-ink-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => props.onDraftChange("firstName", event.target.value)}
              value={props.draftPatient.firstName}
            />
          </div>
          <div>
            <FieldLabel>Last name</FieldLabel>
            <input
              aria-label="Last name"
              className="w-full rounded-[6px] border border-line-input bg-surface-sunken px-[9px] py-[7px] text-[12.5px] text-ink-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => props.onDraftChange("lastName", event.target.value)}
              value={props.draftPatient.lastName}
            />
          </div>
          <div>
            <FieldLabel>Date of birth</FieldLabel>
            <input
              aria-label="Date of birth"
              className="w-full rounded-[6px] border border-line-input bg-surface-sunken px-[9px] py-[7px] text-[12.5px] text-ink-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => props.onDraftChange("dateOfBirth", event.target.value)}
              placeholder="YYYY-MM-DD"
              value={props.draftPatient.dateOfBirth}
            />
          </div>
          <fieldset>
            <legend className="sr-only">Sex</legend>
            <FieldLabel>Sex</FieldLabel>
            <div className="flex gap-1">
              {sexOptions.map((sex) => {
                const selected = props.draftPatient.sex === sex;
                return (
                  <button
                    aria-pressed={selected}
                    className={[
                      "flex-1 rounded-[6px] border px-1 py-[7px] text-[11.5px] font-semibold",
                      selected
                        ? "border-brand bg-brand-bg-3 text-brand-ink"
                        : "border-line-input bg-surface-sunken text-ink-6",
                    ].join(" ")}
                    key={sex}
                    onClick={() => props.onDraftChange("sex", sex)}
                    type="button"
                  >
                    {sex}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <input
              aria-label="Phone"
              className="w-full rounded-[6px] border border-line-input bg-surface-sunken px-[9px] py-[7px] text-[12.5px] text-ink-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => props.onDraftChange("phone", event.target.value)}
              value={props.draftPatient.phone}
            />
          </div>
          <div>
            <FieldLabel>External ID</FieldLabel>
            <input
              aria-label="External ID"
              className="w-full rounded-[6px] border border-line-input bg-surface-sunken px-[9px] py-[7px] text-[12.5px] text-ink-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              onChange={(event) => props.onDraftChange("externalId", event.target.value)}
              placeholder="optional"
              value={props.draftPatient.externalId}
            />
          </div>
          <div className="flex flex-wrap items-center gap-[10px] wide:col-span-3">
            <Button onClick={props.onSave} size="sm">
              Save patient
            </Button>
            <Button onClick={props.onCancel} size="sm" variant="ghost">
              Cancel
            </Button>
            <span className="text-[11px] text-muted-2">Saving stages the change · Generate writes it to Photon</span>
          </div>
        </div>
      ) : (
        <dl className="flex flex-wrap border-b border-line-soft">
          {demographics.map(([label, getValue]) => {
            const value = getValue(props.patient);
            const fallback = value === "—" || value === "none";
            return (
              <div className="flex-[1_1_140px] border-r border-line-softer px-[14px] py-[10px] last:border-r-0" key={label}>
                <dt>
                  <FieldLabel>{label}</FieldLabel>
                </dt>
                <dd className={["text-[12.5px] font-semibold", fallback ? "text-muted-5" : "text-ink"].join(" ")}>
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      <div className="flex flex-wrap items-center gap-[9px] border-b border-line-soft bg-surface-sunken px-[14px] py-[9px]">
        <span
          className={[
            "rounded-[5px] px-2 py-[3px] font-mono text-[11px]",
            props.photonPatientId ? "bg-brand-bg-3 text-brand-ink" : "bg-surface-muted text-muted-2",
          ].join(" ")}
        >
          {props.photonPatientId || "no Photon ID yet"}
        </span>
        <span className="text-[11px] text-muted">
          {props.dirty
            ? "Local edits not yet synced"
            : props.syncStatus === "updated"
              ? "Existing Photon patient was updated"
              : props.syncStatus === "synced"
                ? "Patient record synced to Photon"
                : "Run Generate to sync this patient to Photon"}
        </span>
      </div>
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
