import type { ReactNode } from "react";

type BadgeTone = "neutral" | "info" | "success" | "warn" | "error";

type BadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted border-line text-muted-2",
  info: "bg-brand-bg border-brand-line text-brand-ink-2",
  success: "bg-ok-bg border-ok-line text-ok-ink",
  warn: "bg-warn-bg border-warn-line text-warn-ink",
  error: "bg-err-bg border-err-line text-err-ink",
};

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={[
        "inline-block whitespace-nowrap rounded-[12px] border px-[9px] py-[3px]",
        "text-[10.5px] font-bold tracking-[.02em]",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
