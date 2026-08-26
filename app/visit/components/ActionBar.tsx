"use client";

import { Button } from "./ui/Button";

type ActionBarProps = {
  hint: string;
  onNewVisit: () => void;
  onReset: () => void;
  onCopy: () => void;
  onFinalize: () => void;
  canCopy: boolean;
  canFinalize: boolean;
  finalized: boolean;
};

function FinalizeButton({
  canFinalize,
  finalized,
  onFinalize,
}: Pick<ActionBarProps, "canFinalize" | "finalized" | "onFinalize">) {
  if (finalized) {
    return (
      <Button onClick={onFinalize} size="md" variant="success">
        Handoff prepared ✓
      </Button>
    );
  }

  return (
    <Button dimmed={!canFinalize} onClick={onFinalize} size="md" variant="primary">
      Finalize handoff
    </Button>
  );
}

export function ActionBar({
  hint,
  onNewVisit,
  onReset,
  onCopy,
  onFinalize,
  canCopy,
  canFinalize,
  finalized,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-[11px]">
      {hint ? <div className="text-[11.5px] text-muted">{hint}</div> : <div className="min-w-0 flex-1" />}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onNewVisit} size="md" variant="ghost">
          New visit
        </Button>
        <Button onClick={onReset} size="md" variant="ghost">
          Reset demo
        </Button>
        <Button dimmed={!canCopy} onClick={onCopy} size="md" variant="ghost">
          Copy Spanish instructions
        </Button>
        <FinalizeButton canFinalize={canFinalize} finalized={finalized} onFinalize={onFinalize} />
      </div>
    </div>
  );
}
