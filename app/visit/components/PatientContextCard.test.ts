import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PatientContextCard } from "./PatientContextCard";
import type { VisitPatient } from "../types";

const patient: VisitPatient = {
  firstName: "Maria",
  lastName: "Gonzalez",
  dateOfBirth: "1988-04-12",
  sex: "Female",
  phone: "(718) 555-0142",
  externalId: "",
};

function renderPatientCard() {
  return renderToStaticMarkup(
    React.createElement(PatientContextCard, {
      allergies: "Sulfa",
      currentMeds: "Prenatal vitamin",
      dirty: false,
      draftPatient: patient,
      editing: false,
      onCancel: vi.fn(),
      onDraftChange: vi.fn(),
      onSave: vi.fn(),
      onSync: vi.fn(),
      onToggleEdit: vi.fn(),
      patient,
      photonPatientId: "",
      raisedInVisit: "Breastfeeding question",
      syncStatus: "none",
      visitReason: "Suspected eczema flare",
    }),
  );
}

describe("PatientContextCard", () => {
  it("renders Photon patient sync as its own action separate from instruction generation", () => {
    const markup = renderPatientCard();

    expect(markup).toContain("Sync patient");
    expect(markup).toContain("Sync this patient to Photon");
    expect(markup).not.toContain("Generate Spanish instructions to sync");
  });
});
