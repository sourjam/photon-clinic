import type { LogEntry } from "../types";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";

type EvidenceLogCardProps = {
  entries: LogEntry[];
};

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex items-baseline gap-[9px] font-mono text-[10.5px] leading-[1.5]">
      <span className="shrink-0 text-muted-4">{entry.t}</span>
      <span className={["shrink-0 font-semibold", entry.isError ? "text-err" : "text-ok-ink"].join(" ")}>
        {entry.code}
      </span>
      <span className="flex-1 text-ink-5">{entry.msg}</span>
    </div>
  );
}

export function EvidenceLogCard({ entries }: EvidenceLogCardProps) {
  const countLabel = entries.length > 0 ? `${entries.length} calls` : "";

  return (
    <Card>
      <CardHeader title="API log">
        {countLabel ? <span className="text-[11px] text-muted-2">{countLabel}</span> : null}
      </CardHeader>
      <div className="flex max-h-[200px] flex-col gap-[6px] overflow-auto px-3 py-[9px]" role="log">
        {entries.length === 0 ? (
          <div className="px-[2px] py-[14px] text-center text-[11.5px] text-muted-3">No calls yet.</div>
        ) : (
          entries.map((entry) => <LogRow entry={entry} key={`${entry.t}-${entry.code}-${entry.msg}`} />)
        )}
      </div>
    </Card>
  );
}
