import type { VisitState } from "./types";

export const CLINICIAN_NOTE =
  "Suspected eczema flare on forearms. Discussed moisturizing, avoiding fragrance, and short course topical steroid. Patient asks if treatment is safe while breastfeeding.";

/** Plain-text version used by the clipboard action (T-16). Note it is NOT the same shape as
 * the rendered panel: the rendered version splits into styled blocks (T-07). */
export const SPANISH_INSTRUCTIONS_PLAIN = `Crema de hidrocortisona 2.5%

Lo que vemos parece un brote de eczema en los antebrazos. La piel está irritada, pero se controla bien con cuidado diario.

Aplique una capa fina de la crema en las zonas afectadas dos veces al día, por 7 días. Luego deténgase. No la use en la cara ni cerca de los ojos.

Use jabón y crema humectante sin fragancia todos los días, incluso cuando la piel esté mejor.

Sobre la lactancia: este tipo de crema se usa habitualmente durante la lactancia, pero su médico debe confirmarlo con usted antes de empezar. No la aplique en el pecho.

Llame a la clínica si la piel empeora, aparece pus o fiebre, o si no mejora en 2 semanas.`;

export const PATIENT = {
  name: "Maria Gonzalez",
  meta: "DOB 1988-04-12 · Spanish",
  visit: "Dermatology · suspected eczema flare",
  visitReason: "Suspected eczema flare",
  allergies: "Sulfa",
  currentMeds: "Prenatal vitamin",
  raisedInVisit: "Breastfeeding question",
} as const;

export const PHOTON = {
  env: "NEUTRON · sandbox",
  host: "api.neutron.health · oauth2",
  scope: "read · write:patient",
  prescribeScope: "not requested",
  patientId: "pat_01HQ7K4M2Z",
  treatmentId: "med_8f21c94a",
} as const;

export const MEDICATION = {
  name: "Hydrocortisone cream 2.5%",
  directions: "Apply thin layer to affected areas twice daily for 7 days",
  quantity: "30 g tube",
  refills: "0",
  pharmacistNotes: "Patient is breastfeeding; clinician reviewed counseling.",
  summary: "2.5% · 30 g · 7 days · 0 refills",
} as const;

export const REVIEWER = { name: "Dr. A. Okafor", time: "10:42" } as const;

export const AI_MODEL = "OpenAI · gpt-4o-mini";

export const PATIENT_FOLLOWUP_EXAMPLE = "¿Es seguro usar esta crema mientras estoy amamantando?";

export const INITIAL_STATE: VisitState = {
  phase: "idle",
  note: CLINICIAN_NOTE,
  reviewed: false,
  finalized: false,
  checks: { allergy: false, interaction: false, dose: false, lactation: false },
  thread: [],
  patientDraft: "",
  clinicianReply: "",
  toast: "",
};
