import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "success" | "successGhost" | "danger" | "dangerGhost";
type ButtonSize = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  dimmed?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white border-transparent",
  ghost: "bg-surface text-ink-4 border-line-strong",
  success: "bg-ok text-white border-transparent",
  successGhost: "bg-ok-bg text-ok-ink border-ok-line",
  danger: "bg-err text-white border-transparent",
  dangerGhost: "bg-surface text-err-ink-2 border-err-line-3",
};

const defaultSizeClasses: Record<ButtonSize, string> = {
  md: "px-4 py-[9px] text-[12.5px]",
  sm: "px-[13px] py-[7px] text-[12px]",
};

const ghostSizeClasses: Record<ButtonSize, string> = {
  md: "px-[14px] py-[9px] text-[12.5px]",
  sm: "px-3 py-[6px] text-[12px]",
};

export function Button({
  variant = "primary",
  size = "md",
  dimmed = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClasses = variant === "ghost" ? ghostSizeClasses[size] : defaultSizeClasses[size];

  return (
    <button
      className={[
        "inline-flex items-center gap-2 rounded-[7px] border font-semibold",
        variantClasses[variant],
        sizeClasses,
        dimmed ? "opacity-45" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      type={type}
      {...props}
    />
  );
}
