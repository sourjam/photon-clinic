import type { HTMLAttributes, ReactNode } from "react";

type CardTone = "plain" | "ok" | "warn" | "err";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: CardTone;
};

const toneClasses: Record<CardTone, string> = {
  plain: "bg-surface border-line",
  ok: "bg-ok-bg-2 border-ok-line",
  warn: "bg-warn-bg-2 border-warn-line",
  err: "bg-err-bg-2 border-err-line-2",
};

export function Card({ children, tone = "plain", className, ...props }: CardProps) {
  return (
    <div className={["border rounded-[9px]", toneClasses[tone], className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
