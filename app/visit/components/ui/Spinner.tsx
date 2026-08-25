type SpinnerVariant = "onBrand" | "milestone";

type SpinnerProps = {
  variant: SpinnerVariant;
};

const variantClasses: Record<SpinnerVariant, string> = {
  onBrand: "inline-block h-3 w-3 rounded-full border-2 border-white/35 border-t-white animate-spin-fast",
  milestone:
    "mt-px h-[18px] w-[18px] shrink-0 rounded-full border-2 border-brand-line border-t-brand bg-surface animate-spin-fast",
};

export function Spinner({ variant }: SpinnerProps) {
  return <span aria-hidden="true" className={variantClasses[variant]} />;
}
