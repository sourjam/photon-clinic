import type { HandoffRow } from "../types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

export type HandoffStatus = "waiting" | "notFinalized" | "blocked" | "ready";

type HandoffCardProps = {
  status: HandoffStatus;
  rows: HandoffRow[];
};

type HandoffState = {
  badgeLabel: string;
  badgeTone: "neutral" | "success" | "warn" | "error";
  body: string;
  cardTone: "plain" | "ok" | "warn" | "err";
  titleColor: string;
};

const stateByStatus: Record<HandoffStatus, HandoffState> = {
  waiting: {
    badgeLabel: "Waiting",
    badgeTone: "neutral",
    body: "Generate Spanish instructions and sync the patient before finalizing.",
    cardTone: "plain",
    titleColor: "text-ink-6",
  },
  notFinalized: {
    badgeLabel: "Not finalized",
    badgeTone: "warn",
    body: "Clinician review and safety sign-off are required before finalizing.",
    cardTone: "warn",
    titleColor: "text-warn-ink",
  },
  blocked: {
    badgeLabel: "Blocked",
    badgeTone: "error",
    body: "Treatment lookup must succeed before the handoff can be finalized.",
    cardTone: "err",
    titleColor: "text-err-ink",
  },
  ready: {
    badgeLabel: "Ready",
    badgeTone: "success",
    body: "All context is synced and clinician-reviewed. Continue prescribing in Photon.",
    cardTone: "ok",
    titleColor: "text-ok-ink",
  },
};

function HandoffManifest({ rows }: { rows: HandoffRow[] }) {
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-ok-line-2 pt-3">
      {rows.map((row) => (
        <div className="flex items-baseline justify-between gap-[10px]" key={row.k}>
          <span className="text-[11.5px] text-ink-6">{row.k}</span>
          <span
            className={
              row.mono
                ? "text-right font-mono text-[11.5px] font-medium text-ink"
                : "text-right text-[11.5px] font-semibold text-ok-ink"
            }
          >
            {row.v}
          </span>
        </div>
      ))}
      <div className="mt-1 border-t border-dashed border-ok-line-2 pt-[9px] text-[11px] leading-[1.5] text-ok-ink-2">
        Prescribing happens in Photon, outside this MVP. Nothing here has been sent to a pharmacy.
      </div>
    </div>
  );
}

export function HandoffCard({ status, rows }: HandoffCardProps) {
  const handoffState = stateByStatus[status];

  return (
    <Card className="px-[14px] py-[13px]" tone={handoffState.cardTone}>
      <div className="flex items-center justify-between gap-[10px]">
        <div className={["text-[12.5px] font-bold", handoffState.titleColor].join(" ")}>Prepared for Photon</div>
        <Badge tone={handoffState.badgeTone}>{handoffState.badgeLabel}</Badge>
      </div>
      <div className="mt-[5px] text-[11.5px] leading-[1.5] text-ink-6">{handoffState.body}</div>
      {status === "ready" ? <HandoffManifest rows={rows} /> : null}
    </Card>
  );
}
