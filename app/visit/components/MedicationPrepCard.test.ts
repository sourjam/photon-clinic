import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MEDICATION } from "../demoData";
import { MedicationPrepCard } from "./MedicationPrepCard";

describe("MedicationPrepCard", () => {
  it("renders a neutral empty state when no treatment is selected", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MedicationPrepCard, {
        medication: MEDICATION,
        onQuickTerm: vi.fn(),
        onSearch: vi.fn(),
        onSearchQueryChange: vi.fn(),
        onSelectTreatment: vi.fn(),
        searchQuery: "",
        searchResults: [],
        searchStatus: "idle",
        selectedTreatment: { id: "", name: "" },
        treatmentId: "",
        treatmentIdState: "awaiting",
        treatmentStale: false,
      }),
    );

    expect(markup).toContain("No treatment selected");
    expect(markup).toContain("Search catalog");
    expect(markup).not.toContain("Treatment selected");
  });
});
