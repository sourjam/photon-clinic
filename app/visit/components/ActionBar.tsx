"use client";

import { Button } from "./ui/Button";

type ActionBarProps = {
  hint: string;
  onNewVisit: () => void;
  onReset: () => void;
};

export function ActionBar({
  hint,
  onNewVisit,
  onReset,
}: ActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-[11px] shadow-[0_-8px_24px_-18px_rgba(26,29,36,.45)]">
      {hint ? <div className="text-[11.5px] text-muted">{hint}</div> : <div className="min-w-0 flex-1" />}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onNewVisit} size="md" variant="ghost">
          New visit
        </Button>
        <Button onClick={onReset} size="md" variant="ghost">
          Reset demo
        </Button>
      </div>
    </div>
  );
}
