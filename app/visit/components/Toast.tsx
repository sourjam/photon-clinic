"use client";

type ToastProps = {
  message: string;
};

export function Toast({ message }: ToastProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={
        message
          ? "fixed bottom-[70px] left-1/2 z-50 -translate-x-1/2 rounded-[9px] bg-ink px-[17px] py-[9px] text-[12.5px] font-medium text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,.4)]"
          : "sr-only"
      }
      role="status"
    >
      {message}
    </div>
  );
}
