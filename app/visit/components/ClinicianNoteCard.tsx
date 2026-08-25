"use client";

import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { CardHeader } from "./ui/CardHeader";
import { Spinner } from "./ui/Spinner";

type ClinicianNoteCardProps = {
  note: string;
  onNoteChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasInstructions: boolean;
};

export function ClinicianNoteCard({
  note,
  onNoteChange,
  onGenerate,
  isLoading,
  hasInstructions,
}: ClinicianNoteCardProps) {
  const buttonLabel = isLoading
    ? "Generating…"
    : hasInstructions
      ? "Regenerate Spanish instructions"
      : "Generate Spanish instructions";
  const hint = isLoading
    ? "OpenAI · gpt-4o-mini"
    : "Output is drafted by AI and must be clinician-reviewed";

  return (
    <Card>
      <CardHeader title="Clinician note" meta="English · source of truth" />
      <div className="px-[14px] py-3">
        <label className="sr-only" htmlFor="clinician-note">
          Clinician note, English
        </label>
        <textarea
          className="min-h-[82px] w-full resize-y rounded-[7px] border border-line-input bg-surface-sunken px-3 py-[11px] text-[13px] leading-[1.55] text-ink-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          id="clinician-note"
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Enter visit notes in English…"
          value={note}
        />
        <div className="mt-[10px] flex flex-wrap items-center gap-[10px]">
          <Button
            className={isLoading ? "opacity-80" : ""}
            onClick={onGenerate}
            size="md"
            variant="primary"
          >
            {isLoading ? <Spinner variant="onBrand" /> : null}
            {buttonLabel}
          </Button>
          <span className="text-[11.5px] text-muted-2">{hint}</span>
        </div>
      </div>
    </Card>
  );
}
