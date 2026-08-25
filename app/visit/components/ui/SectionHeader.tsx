type SectionHeaderProps = {
  title: string;
  meta: string;
};

export function SectionHeader({ title, meta }: SectionHeaderProps) {
  return (
    <div className="mb-1 flex items-center gap-[9px]">
      <h2 className="m-0 text-[12px] font-bold uppercase tracking-[.08em] text-ink-5">{title}</h2>
      <div className="h-px flex-1 bg-line" />
      <span className="text-[11px] text-muted-2">{meta}</span>
    </div>
  );
}
