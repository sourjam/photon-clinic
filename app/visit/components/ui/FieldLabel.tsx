import type { ReactNode } from "react";

type FieldLabelTone = "default" | "warn";

type FieldLabelProps = {
  children: ReactNode;
  tone?: FieldLabelTone;
};

const toneClasses: Record<FieldLabelTone, string> = {
  default: "text-muted-3",
  warn: "text-warn-ink-2",
};

export function FieldLabel({ children, tone = "default" }: FieldLabelProps) {
  return (
    <div className={["mb-[3px] text-[10px] font-semibold uppercase tracking-[.06em]", toneClasses[tone]].join(" ")}>
      {children}
    </div>
  );
}
