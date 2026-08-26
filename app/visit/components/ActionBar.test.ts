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
        onGenerate: vi.fn(),
        onNewVisit: vi.fn(),
        onReset: vi.fn(),
        onSyncPhoton: vi.fn(),
        onTranslate: vi.fn(),
      }),
    );

    expect(markup).toContain("New visit");
    expect(markup.indexOf("New visit")).toBeLessThan(markup.indexOf("Reset demo"));
  });

  it("exposes the primary non-linear demo actions", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canCopy: false,
        canFinalize: false,
        finalized: false,
        hint: "",
        onCopy: vi.fn(),
        onFinalize: vi.fn(),
        onGenerate: vi.fn(),
        onNewVisit: vi.fn(),
        onReset: vi.fn(),
        onSyncPhoton: vi.fn(),
        onTranslate: vi.fn(),
      }),
    );

    expect(markup).toContain("Generate instructions");
    expect(markup).toContain("Sync Photon");
    expect(markup).toContain("Translate");
    expect(markup).toContain("Finalize handoff");
  });
});
