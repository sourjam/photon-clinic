"use client";

import type { Phase } from "../types";

type PrototypeSwitcherProps = {
  phase: Phase;
  onPick: (phase: Phase) => void;
};

const phaseOptions = [
  { phase: "idle", label: "Initial", hint: "Nothing generated or synced yet." },
  { phase: "loading", label: "AI loading", hint: "OpenAI request in flight." },
  { phase: "review", label: "Review needed", hint: "AI output awaiting clinician sign-off." },
  { phase: "final", label: "Prepared", hint: "Happy path — reviewed and handed off." },
  { phase: "aiError", label: "AI error", hint: "Generation failed; Photon untouched." },
  { phase: "apiError", label: "API error", hint: "Treatment lookup failed; handoff blocked." },
] as const satisfies readonly { phase: Phase; label: string; hint: string }[];

export function PrototypeSwitcher({ phase, onPick }: PrototypeSwitcherProps) {
  const activeHint = phaseOptions.find((option) => option.phase === phase)?.hint ?? "";

  return (
    <div className="flex flex-wrap items-center gap-3 bg-chrome-bg px-4 py-[7px] text-white">
      <span className="rounded-[4px] border border-chrome-line px-[7px] py-[2px] font-mono text-[10px] font-medium uppercase tracking-[.1em] text-chrome-text">
        Prototype control · not product UI
      </span>
      <div
        aria-label="Prototype state controls"
        className="flex gap-[2px] rounded-[6px] bg-chrome-inset p-[2px]"
        role="group"
      >
        {phaseOptions.map((option) => {
          const active = option.phase === phase;

          return (
            <button
              aria-pressed={active}
              className={[
                "rounded-[5px] border-none px-[10px] py-[5px] text-[11.5px] font-semibold",
                active ? "bg-brand text-white" : "bg-transparent text-chrome-text-2",
              ].join(" ")}
              key={option.phase}
              onClick={() => onPick(option.phase)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span className="text-[11px] text-chrome-text">{activeHint}</span>
    </div>
  );
}
