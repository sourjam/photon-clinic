"use client";

import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

type AiErrorCardProps = {
  onRetry: () => void;
  onWriteManually: () => void;
};

export function AiErrorCard({ onRetry, onWriteManually }: AiErrorCardProps) {
  return (
    <Card className="px-[14px] py-[13px]" role="alert" tone="err">
      <div className="flex items-start gap-[11px]">
        <div
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-err text-[12px] font-bold text-white"
        >
          !
        </div>
        <div className="flex-1">
          <div className="text-[12.5px] font-bold text-err-ink">Instruction generation failed</div>
          <div className="mt-[3px] text-[12px] leading-[1.5] text-err-ink-2">
            OpenAI request timed out. The note was not sent to Photon. Retry, or write the Spanish instructions manually.
          </div>
          <div className="mt-[10px] flex gap-2">
            <Button onClick={onRetry} size="sm" variant="danger">
              Retry generation
            </Button>
            <Button onClick={onWriteManually} size="sm" variant="dangerGhost">
              Write manually
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
