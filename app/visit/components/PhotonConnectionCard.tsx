import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { FieldLabel } from "./ui/FieldLabel";

type PhotonConnectionCardProps = {
  host: string;
  scope: string;
  prescribeScope: string;
  connected: boolean;
};

export function PhotonConnectionCard({ host, scope, prescribeScope, connected }: PhotonConnectionCardProps) {
  return (
    <Card className="px-[14px] py-3">
      <div className="flex items-center justify-between gap-[10px]">
        <div>
          <div className="text-[12.5px] font-bold text-ink">Connection</div>
          <div className="mt-[3px] font-mono text-[11px] text-muted">{host}</div>
        </div>
        <Badge tone={connected ? "success" : "neutral"}>{connected ? "Authenticated" : "Not connected"}</Badge>
      </div>
      <div className="mt-[11px] flex gap-[14px] border-t border-line-softer pt-[11px]">
        <div>
          <FieldLabel>Scope</FieldLabel>
          <div className="text-[11.5px] font-semibold text-ink">{scope}</div>
        </div>
        <div>
          <FieldLabel>Prescribe scope</FieldLabel>
          <div className="text-[11.5px] font-semibold text-muted-2">{prescribeScope}</div>
        </div>
      </div>
    </Card>
  );
}
