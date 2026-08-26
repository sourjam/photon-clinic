import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SafetyReviewCard } from "./SafetyReviewCard";
import type { SafetyChecks } from "../types";

const checks: SafetyChecks = {
  allergy: false,
  interaction: false,
  dose: false,
  lactation: false,
};

describe("SafetyReviewCard", () => {
  it("uses visible checkbox controls so toggling does not focus an off-screen input", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SafetyReviewCard, {
        allChecked: false,
        checks,
        onToggle: vi.fn(),
        syncedCount: 0,
      }),
    );

    expect(markup).toContain('type="checkbox"');
    expect(markup).not.toContain("sr-only");
    expect(markup).toContain("appearance-none");
  });
});
