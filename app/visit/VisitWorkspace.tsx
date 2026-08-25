"use client";

import { useVisitWorkflow } from "./useVisitWorkflow";

const bodyClasses = [
  "flex",
  "flex-col",
  "gap-4",
  "p-[14px_14px_18px]",
  "flex-1",
  "min-h-0",
  "items-stretch",
  "overflow-visible",
  "wide:grid",
  "wide:grid-cols-[minmax(0,62fr)_minmax(330px,38fr)]",
  "wide:p-[16px_20px_20px]",
  "wide:overflow-hidden",
].join(" ");

const columnClasses = [
  "flex",
  "flex-col",
  "gap-3",
  "min-w-0",
  "wide:min-h-0",
  "wide:overflow-y-auto",
  "wide:overflow-x-hidden",
  "wide:pr-1",
].join(" ");

export function VisitWorkspace() {
  const workflow = useVisitWorkflow();
  void workflow;

  return (
    <div className="flex h-screen flex-col bg-page">
      <div data-region="prototype-chrome" />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-page wide:overflow-hidden">
        <header data-region="header" />
        <div className={bodyClasses}>
          <section className={columnClasses} data-region="left" />
          <aside className={columnClasses} data-region="right" />
        </div>
        <div data-region="action-bar" />
      </div>
    </div>
  );
}
