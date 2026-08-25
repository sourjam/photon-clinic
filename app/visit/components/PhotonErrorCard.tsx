"use client";

import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type PhotonErrorCardProps = {
  onRetry: () => void;
};

export function PhotonErrorCard({ onRetry }: PhotonErrorCardProps) {
  return (
    <Card className="px-[14px] py-[13px]" role="alert" tone="err">
      <div className="flex items-start gap-[10px]">
        <div
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-err text-[12px] font-bold text-white"
        >
          !
        </div>
        <div className="flex-1">
          <div className="text-[12.5px] font-bold text-err-ink">Treatment lookup failed</div>
          <div className="mt-[3px] font-mono text-[11px] text-err-ink-2">503 · GET /catalog/treatments</div>
          <div className="mt-[5px] text-[12px] leading-[1.5] text-err-ink-2">
            Patient and safety sync succeeded. Handoff is blocked until the treatment resolves.
          </div>
          <Button className="mt-[10px]" onClick={onRetry} size="sm" variant="danger">
            Retry lookup
          </Button>
        </div>
      </div>
    </Card>
  );
}
