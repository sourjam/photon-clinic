import type { Milestone, MilestoneStatus } from "../types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { Spinner } from "./ui/Spinner";

type SyncMilestonesCardProps = {
  milestones: Milestone[];
};

type MilestonePresentation = {
  badgeTone: "neutral" | "info" | "success" | "error";
  badgeText: string;
  dot: "pending" | "loading" | "ok" | "error";
  idClassName: string;
  labelClassName: string;
};

const presentationByStatus: Record<MilestoneStatus, MilestonePresentation> = {
  ok: {
    badgeTone: "success",
    badgeText: "synced",
    dot: "ok",
    idClassName: "text-muted",
    labelClassName: "text-ink",
  },
  loading: {
    badgeTone: "info",
    badgeText: "syncing",
    dot: "loading",
    idClassName: "text-muted",
    labelClassName: "text-ink",
  },
  error: {
    badgeTone: "error",
    badgeText: "failed",
    dot: "error",
    idClassName: "text-err-ink",
    labelClassName: "text-ink",
  },
  pending: {
    badgeTone: "neutral",
    badgeText: "pending",
    dot: "pending",
    idClassName: "text-muted",
    labelClassName: "text-muted-2",
  },
};

function StatusDot({ status }: { status: MilestoneStatus }) {
  const presentation = presentationByStatus[status];
  const baseClasses = "mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold";

  if (presentation.dot === "loading") {
    return <Spinner variant="milestone" />;
  }

  if (presentation.dot === "ok") {
    return (
      <span aria-hidden="true" className={[baseClasses, "bg-ok text-white"].join(" ")}>
        ✓
      </span>
    );
  }

  if (presentation.dot === "error") {
    return (
      <span aria-hidden="true" className={[baseClasses, "bg-err text-white"].join(" ")}>
        !
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={[baseClasses, "border border-line-2 bg-surface-pending text-muted-5"].join(" ")}
    />
  );
}

export function SyncMilestonesCard({ milestones }: SyncMilestonesCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Sync milestones" />
      <div className="max-h-[252px] overflow-y-auto overscroll-contain py-1">
        {milestones.map((milestone) => {
          const presentation = presentationByStatus[milestone.status];

          return (
            <div className="flex gap-[10px] border-b border-line-row-2 px-[14px] py-[9px]" key={milestone.label}>
              <StatusDot status={milestone.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={["text-[12.5px] font-semibold", presentation.labelClassName].join(" ")}>
                    {milestone.label}
                  </span>
                  <Badge tone={presentation.badgeTone}>{presentation.badgeText}</Badge>
                </div>
                {milestone.id ? (
                  <div className={["mt-[2px] font-mono text-[10.5px]", presentation.idClassName].join(" ")}>
                    {milestone.id}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
