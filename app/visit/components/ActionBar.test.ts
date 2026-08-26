import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBar } from "./ActionBar";

describe("ActionBar", () => {
  it("renders New visit next to Reset demo", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canCopy: false,
        canFinalize: false,
        finalized: false,
        hint: "",
        onCopy: vi.fn(),
        onFinalize: vi.fn(),
        onNewVisit: vi.fn(),
        onReset: vi.fn(),
      }),
    );

    expect(markup).toContain("New visit");
    expect(markup.indexOf("New visit")).toBeLessThan(markup.indexOf("Reset demo"));
  });
});
