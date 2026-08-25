"use client";

import { SAFETY_CHECKS } from "../demoData";
import type { SafetyCheckKey, SafetyChecks } from "../types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";

type SafetyReviewCardProps = {
  checks: SafetyChecks;
  onToggle: (key: SafetyCheckKey) => void;
  allChecked: boolean;
  syncedCount: number;
};

function getBoxClasses(key: SafetyCheckKey, checked: boolean) {
  if (!checked) return "border-line-strongest bg-surface";
  if (key === "lactation") return "border-warn bg-warn";
  return "border-ok bg-ok";
}

export function SafetyReviewCard({ checks, onToggle, allChecked, syncedCount }: SafetyReviewCardProps) {
  const badgeLabel = allChecked
    ? "3 synced · 1 clinician-reviewed"
    : `${syncedCount} synced · ${checks.lactation ? 1 : 0} clinician-reviewed`;
  const badgeTone = allChecked ? "success" : "warn";

  return (
    <Card>
      <CardHeader title="Safety review">
        <Badge tone={badgeTone}>{badgeLabel}</Badge>
      </CardHeader>
      <div className="px-[14px] pb-3 pt-[6px]">
        {SAFETY_CHECKS.map((check) => {
          const checked = checks[check.key];

          return (
            <label
              className="flex cursor-pointer items-start gap-[10px] border-b border-line-row py-[9px]"
              key={check.key}
            >
              <input
                checked={checked}
                className="peer sr-only"
                onChange={() => onToggle(check.key)}
                type="checkbox"
              />
              <span
                aria-hidden="true"
                className={[
                  "mt-px flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] text-[11px] font-bold text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30",
                  getBoxClasses(check.key, checked),
                ].join(" ")}
              >
                {checked ? "✓" : ""}
              </span>
              <span className="flex-1">
                <span
                  className={[
                    "block text-[12.5px] leading-[1.4]",
                    checked ? "font-medium text-ink-3" : "font-semibold text-ink",
                  ].join(" ")}
                >
                  {check.text}
                </span>
                <span className="mt-px block text-[11px] text-muted-2">{check.meta}</span>
              </span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
