export type OverallStatus = "preparing" | "prepared" | "actionNeeded";

type AppHeaderProps = {
  patientName: string;
  patientMeta: string;
  visitSummary: string;
  environment: string;
  status: OverallStatus;
};

const statusClasses: Record<OverallStatus, { label: string; pill: string; dot: string }> = {
  preparing: {
    label: "Preparing for Photon",
    pill: "bg-warn-bg border-warn-line text-warn-ink",
    dot: "bg-warn",
  },
  prepared: {
    label: "Prepared for Photon",
    pill: "bg-ok-bg border-ok-line text-ok-ink",
    dot: "bg-ok",
  },
  actionNeeded: {
    label: "Action needed",
    pill: "bg-err-bg border-err-line text-err-ink",
    dot: "bg-err",
  },
};

export function AppHeader({ patientName, patientMeta, visitSummary, environment, status }: AppHeaderProps) {
  const statusConfig = statusClasses[status];

  return (
    <header
      className="flex flex-wrap items-center gap-[14px] border-b border-line bg-surface px-4 py-3 wide:px-5 wide:py-[11px]"
      data-region="header"
    >
      <div className="flex items-center gap-[11px]">
        <div className="h-[17px] w-[17px] rotate-45 rounded-[5px] bg-brand" aria-hidden="true" />
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">Photon Clinic</span>
          <span className="text-[11.5px] font-medium text-muted-2">Clinician workspace</span>
        </div>
      </div>

      <div className="h-[26px] w-px bg-line-2" aria-hidden="true" />

      <div className="flex items-baseline gap-[7px]">
        <span className="text-[13.5px] font-semibold text-ink">{patientName}</span>
        <span className="text-[11.5px] text-muted">{patientMeta}</span>
      </div>

      <div className="text-[11.5px] text-muted">{visitSummary}</div>

      <div className="min-w-[8px] flex-1" />

      <div className="flex items-center gap-[6px] rounded-[6px] border border-brand-line bg-brand-bg px-[9px] py-1">
        <span className="h-[6px] w-[6px] rounded-full bg-brand-dot" aria-hidden="true" />
        <span className="font-mono text-[11px] font-medium text-brand-ink-2">{environment}</span>
      </div>

      <div
        className={["flex items-center gap-[7px] rounded-[6px] border px-[10px] py-1", statusConfig.pill].join(" ")}
      >
        <span className={["h-[6px] w-[6px] rounded-full", statusConfig.dot].join(" ")} aria-hidden="true" />
        <span className="text-[11.5px] font-semibold">{statusConfig.label}</span>
      </div>
    </header>
  );
}
