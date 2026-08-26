import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SyncMilestonesCard } from "./SyncMilestonesCard";
import type { Milestone } from "../types";

const milestones: Milestone[] = [
  { label: "Auth check", status: "ok", id: "auth_1" },
  { label: "Patient sync", status: "ok", id: "pat_1" },
  { label: "Treatment lookup", status: "ok", id: "med_1" },
  { label: "Allergy history", status: "pending", id: "" },
  { label: "Medication history", status: "pending", id: "" },
  { label: "Coverage check", status: "pending", id: "" },
];

describe("SyncMilestonesCard", () => {
  it("keeps milestone rows in a bounded scroll area", () => {
    const markup = renderToStaticMarkup(React.createElement(SyncMilestonesCard, { milestones }));

    expect(markup).toContain("max-h-[");
    expect(markup).toContain("overflow-y-auto");
    expect(markup).toContain("overscroll-contain");
    expect(markup).toContain("Coverage check");
  });
});
