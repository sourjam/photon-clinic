import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PatientContextCard } from "./PatientContextCard";
import type { VisitContext, VisitPatient } from "../types";

const patient: VisitPatient = {
  firstName: "Maria",
  lastName: "Gonzalez",
  dateOfBirth: "1988-04-12",
  sex: "Female",
  phone: "(718) 555-0142",
  externalId: "",
};

const visitContext: VisitContext = {
  language: "Spanish",
  specialty: "Dermatology",
  visitReason: "Suspected eczema flare",
  allergies: "Sulfa",
  currentMeds: "Prenatal vitamin",
  raisedInVisit: "Breastfeeding question",
};

function renderPatientCard() {
  return renderToStaticMarkup(
    React.createElement(PatientContextCard, {
      dirty: false,
      draftPatient: patient,
      editing: false,
      onCancel: vi.fn(),
      onDraftChange: vi.fn(),
      onSave: vi.fn(),
      onSync: vi.fn(),
      onToggleEdit: vi.fn(),
      onVisitContextChange: vi.fn(),
      patient,
      photonPatientId: "",
      syncStatus: "none",
      visitContext,
    }),
  );
}

describe("PatientContextCard", () => {
  it("renders Photon patient sync as its own action separate from instruction generation", () => {
    const markup = renderPatientCard();

    expect(markup).toContain("Sync patient");
    expect(markup).not.toContain("Blank visit");
    expect(markup).toContain("Sync this patient to Photon");
    expect(markup).not.toContain("Generate Spanish instructions to sync");
  });

  it("renders editable visit context fields with the patient form", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PatientContextCard, {
        dirty: false,
        draftPatient: patient,
        editing: true,
        onCancel: vi.fn(),
        onDraftChange: vi.fn(),
        onSave: vi.fn(),
        onSync: vi.fn(),
        onToggleEdit: vi.fn(),
        onVisitContextChange: vi.fn(),
        patient,
        photonPatientId: "",
        syncStatus: "none",
        visitContext,
      }),
    );

    expect(markup).toContain('aria-label="Visit reason"');
    expect(markup).toContain('aria-label="Allergies"');
    expect(markup).toContain('aria-label="Current medications"');
    expect(markup).toContain('aria-label="Raised in visit"');
  });
});
