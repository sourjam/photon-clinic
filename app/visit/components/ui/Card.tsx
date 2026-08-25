import type { ReactNode } from "react";

type CardTone = "plain" | "ok" | "warn" | "err";

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  className?: string;
};

const toneClasses: Record<CardTone, string> = {
  plain: "bg-surface border-line",
  ok: "bg-ok-bg-2 border-ok-line",
  warn: "bg-warn-bg-2 border-warn-line",
  err: "bg-err-bg-2 border-err-line-2",
};

export function Card({ children, tone = "plain", className }: CardProps) {
  return (
    <div className={["border rounded-[9px]", toneClasses[tone], className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
