import { describe, expect, it } from "vitest";
import { createBlankVisitState } from "./useVisitWorkflow";
import { INITIAL_STATE } from "./demoData";

describe("createBlankVisitState", () => {
  it("clears patient, treatment, note, instructions, review, handoff, and thread state", () => {
    const state = createBlankVisitState(INITIAL_STATE);

    expect(state.patient).toEqual({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      sex: "",
      phone: "",
      externalId: "",
    });
    expect(state.draftPatient).toEqual(state.patient);
    expect(state.patientId).toBe("");
    expect(state.patientSyncStatus).toBe("none");
    expect(state.patientDirty).toBe(false);
    expect(state.patientEditing).toBe(true);
    expect(state.selectedTreatment).toEqual({ id: "", name: "" });
    expect(state.treatmentId).toBe("");
    expect(state.treatmentQuery).toBe("");
    expect(state.treatmentResults).toEqual([]);
    expect(state.visitContext).toEqual({
      language: "Spanish",
      specialty: "",
      visitReason: "",
      allergies: "",
      currentMeds: "",
      raisedInVisit: "",
    });
    expect(state.note).toBe("");
    expect(state.instructions).toEqual([]);
    expect(state.instructionsPlainText).toBe("");
    expect(state.reviewed).toBe(false);
    expect(state.finalized).toBe(false);
    expect(state.checks).toEqual({ allergy: false, interaction: false, dose: false, lactation: false });
    expect(state.thread).toEqual([]);
    expect(state.logEntries.at(-1)?.msg).toBe("Blank visit started");
  });
});
