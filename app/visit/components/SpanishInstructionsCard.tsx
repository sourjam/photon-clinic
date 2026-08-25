"use client";

import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import type { InstructionBlock } from "../types";

type SpanishInstructionsCardProps = {
  isIdle: boolean;
  isLoading: boolean;
  isAiError: boolean;
  hasInstructions: boolean;
  headingEs: string;
  blocks: InstructionBlock[];
  reviewed: boolean;
  onRegenerate: () => void;
  onCopy: () => void;
};

type BadgeTone = "neutral" | "info" | "success" | "warn" | "error";
type BadgeConfig = { label: string; tone: BadgeTone };

function getBadge(isLoading: boolean, isAiError: boolean, hasInstructions: boolean, reviewed: boolean): BadgeConfig {
  if (isLoading) return { label: "Generating…", tone: "info" };
  if (isAiError) return { label: "Failed", tone: "error" };
  if (hasInstructions && reviewed) return { label: "AI generated · reviewed", tone: "success" };
  if (hasInstructions) return { label: "AI generated · needs review", tone: "warn" };
  return { label: "Not generated", tone: "neutral" };
}

function EmptyState() {
  return (
    <div className="px-4 py-[26px] text-center text-[12.5px] text-muted-3">
      Instructions appear here once generated from the clinician note.
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-[14px] py-4">
      <div aria-hidden="true" className="flex flex-col gap-[9px]">
        <div className="h-[11px] w-[82%] rounded-[4px] bg-surface-skeleton animate-pulse-soft" />
        <div className="h-[11px] w-[94%] rounded-[4px] bg-surface-skeleton animate-pulse-soft [animation-delay:.15s]" />
        <div className="h-[11px] w-[71%] rounded-[4px] bg-surface-skeleton animate-pulse-soft [animation-delay:.3s]" />
      </div>
      <div className="mt-3 text-[11.5px] text-muted-2" role="status">
        Generating patient-friendly Spanish from the clinician note…
      </div>
    </div>
  );
}

function Content({
  headingEs,
  blocks,
  onCopy,
  onRegenerate,
}: Pick<SpanishInstructionsCardProps, "headingEs" | "blocks" | "onCopy" | "onRegenerate">) {
  return (
    <div className="flex flex-col gap-[11px] p-[14px]">
      <div className="rounded-[8px] border border-brand-line-2 bg-brand-bg-2 px-[15px] py-[14px]" lang="es">
        <h2 className="mb-2 text-[13px] font-bold text-brand-ink">{headingEs}</h2>
        <div className="flex flex-col gap-2 text-[13px] leading-[1.65] text-ink-2">
          {blocks.map((block, index) =>
            block.kind === "callout" ? (
              <p
                className="rounded-[0_6px_6px_0] border-l-[3px] border-warn bg-warn-bg px-[11px] py-[9px] text-warn-ink-4"
                key={`${block.kind}-${index}`}
              >
                {block.es}
              </p>
            ) : (
              <p key={`${block.kind}-${index}`}>{block.es}</p>
            ),
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-[9px]">
        <span className="text-[11px] text-muted-2">Reading level: plain Spanish · tone: respectful</span>
        <div className="flex-1" />
        <Button onClick={onRegenerate} size="sm" variant="ghost">
          Regenerate
        </Button>
        <Button onClick={onCopy} size="sm" variant="ghost">
          Copy
        </Button>
      </div>
    </div>
  );
}

export function SpanishInstructionsCard({
  isIdle,
  isLoading,
  isAiError,
  hasInstructions,
  headingEs,
  blocks,
  reviewed,
  onRegenerate,
  onCopy,
}: SpanishInstructionsCardProps) {
  const badge = getBadge(isLoading, isAiError, hasInstructions, reviewed);

  return (
    <Card>
      <CardHeader title="Spanish patient instructions">
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </CardHeader>

      {isIdle ? <EmptyState /> : null}
      {isLoading ? <Skeleton /> : null}
      {hasInstructions ? (
        <Content blocks={blocks} headingEs={headingEs} onCopy={onCopy} onRegenerate={onRegenerate} />
      ) : null}
    </Card>
  );
}
