import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBar } from "./ActionBar";

describe("ActionBar", () => {
  function renderActionBar() {
    return renderToStaticMarkup(
      React.createElement(ActionBar, {
        hint: "",
        onNewVisit: vi.fn(),
        onReset: vi.fn(),
      }),
    );
  }

  it("renders New visit next to Reset demo", () => {
    const markup = renderActionBar();

    expect(markup).toContain("New visit");
    expect(markup.indexOf("New visit")).toBeLessThan(markup.indexOf("Reset demo"));
  });

  it("keeps only global visit reset actions in the bottom bar", () => {
    const markup = renderActionBar();

    expect(markup).toContain("New visit");
    expect(markup).toContain("Reset demo");
    expect(markup).not.toContain("Generate instructions");
    expect(markup).not.toContain("Sync Photon");
    expect(markup).not.toContain("Translate");
    expect(markup).not.toContain("Finalize handoff");
    expect(markup).not.toContain("Copy Spanish instructions");
  });

  it("stays fixed as a bottom action bar while content scrolls", () => {
    const markup = renderActionBar();

    expect(markup).toContain("fixed");
    expect(markup).toContain("inset-x-0");
    expect(markup).toContain("bottom-0");
  });
});
