import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VisitWorkspace } from "./VisitWorkspace";

describe("VisitWorkspace", () => {
  it("labels the Photon section as Clinical API without Elements caveat copy", () => {
    const markup = renderToStaticMarkup(React.createElement(VisitWorkspace));

    expect(markup).toContain("Clinical API");
    expect(markup).not.toContain("no Elements");
  });

  it("keeps the Photon column focused on the API log", () => {
    const markup = renderToStaticMarkup(React.createElement(VisitWorkspace));

    expect(markup).toContain("API log");
    expect(markup).not.toContain("API evidence log");
    expect(markup).not.toContain("Connection");
    expect(markup).not.toContain("api.neutron.health");
    expect(markup).not.toContain("Prescribe scope");
    expect(markup).not.toContain("Sync milestones");
    expect(markup).not.toContain("Prepared for Photon");
  });

  it("omits internal implementation notes from card and section headers", () => {
    const markup = renderToStaticMarkup(React.createElement(VisitWorkspace));

    expect(markup).not.toContain("OpenAI translation");
    expect(markup).not.toContain("questions routed to clinician");
    expect(markup).not.toContain("Photon catalog lookup");
    expect(markup).not.toContain("no prescribing");
    expect(markup).not.toContain("English · source of truth");
    expect(markup).not.toContain("OpenAI · clinician-reviewed");
  });
});
