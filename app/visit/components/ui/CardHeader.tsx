import type { ReactNode } from "react";

type CardHeaderProps = {
  title: string;
  meta?: string;
  children?: ReactNode;
};

export function CardHeader({ title, meta, children }: CardHeaderProps) {
  const rightSlot = meta ? <span className="text-[11px] text-muted-2">{meta}</span> : children;

  if (!rightSlot) {
    return <div className="border-b border-line-soft px-[14px] py-[10px] text-[12.5px] font-bold text-ink">{title}</div>;
  }

  return (
    <div className="flex items-center justify-between gap-[10px] border-b border-line-soft px-[14px] py-[10px]">
      <div className="text-[12.5px] font-bold text-ink">{title}</div>
      {rightSlot}
    </div>
  );
}
