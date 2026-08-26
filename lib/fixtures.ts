import type { InstructionBlock } from "../app/visit/types";
import type {
  SelectedTreatmentInput,
  PhotonPatientInput,
  InstructionsResponse,
  PhotonSyncResponse,
  PhotonTreatmentSearchResponse,
  TranslateDirection,
  TranslateResponse,
} from "./types";
import { normalizePhotonPatientInput } from "./patient";

export const fixtureTreatmentCatalog: PhotonTreatmentSearchResponse["results"] = [
  { id: "med_8f21c94a", name: "Hydrocortisone cream 2.5%", form: "Topical cream · 30 g" },
  { id: "med_3b77e210", name: "Hydrocortisone cream 1%", form: "Topical cream · 28 g" },
  { id: "med_9c14aa08", name: "Hydrocortisone ointment 2.5%", form: "Topical ointment · 30 g" },
  { id: "med_5d20f7b3", name: "Triamcinolone acetonide cream 0.1%", form: "Topical cream · 15 g" },
  { id: "med_7e91c422", name: "Triamcinolone acetonide cream 0.025%", form: "Topical cream · 15 g" },
  { id: "med_2a58d901", name: "Mupirocin ointment 2%", form: "Topical ointment · 22 g" },
  { id: "med_6f33b7c5", name: "Lisinopril tablet 10 mg", form: "Oral tablet · 30 ct" },
  { id: "med_1e84f339", name: "Lisinopril tablet 20 mg", form: "Oral tablet · 30 ct" },
  { id: "med_8b02e514", name: "Ondansetron ODT 4 mg", form: "Oral disintegrating · 20 ct" },
];

export function fixtureTreatmentSearchResponse(term: string): PhotonTreatmentSearchResponse {
  const normalized = term.trim().toLowerCase();
  return {
    mode: "fixture",
    results: fixtureTreatmentCatalog
      .filter((treatment) => treatment.name.toLowerCase().includes(normalized))
      .slice(0, 8),
  };
}

export const fixtureInstructions: {
  headingEs: string;
  blocks: InstructionBlock[];
  plainText: string;
} = {
  headingEs: "Crema de hidrocortisona 2.5% — cómo usarla",
  blocks: [
    {
      kind: "text",
      es: "Lo que vemos parece un brote de eczema en los antebrazos. La piel está irritada, pero se controla bien con cuidado diario.",
    },
    {
      kind: "text",
      es: "Aplique una capa fina de la crema en las zonas afectadas dos veces al día, por 7 días. Luego deténgase. No la use en la cara ni cerca de los ojos.",
    },
    {
      kind: "text",
      es: "Use jabón y crema humectante sin fragancia todos los días, incluso cuando la piel esté mejor.",
    },
    {
      kind: "callout",
      es: "Sobre la lactancia: este tipo de crema se usa habitualmente durante la lactancia, pero su médico debe confirmarlo con usted antes de empezar. No la aplique en el pecho.",
    },
    {
      kind: "text",
      es: "Llame a la clínica si la piel empeora, aparece pus o fiebre, o si no mejora en 2 semanas.",
    },
  ],
  plainText: `Crema de hidrocortisona 2.5%

Lo que vemos parece un brote de eczema en los antebrazos. La piel está irritada, pero se controla bien con cuidado diario.

Aplique una capa fina de la crema en las zonas afectadas dos veces al día, por 7 días. Luego deténgase. No la use en la cara ni cerca de los ojos.

Use jabón y crema humectante sin fragancia todos los días, incluso cuando la piel esté mejor.

Sobre la lactancia: este tipo de crema se usa habitualmente durante la lactancia, pero su médico debe confirmarlo con usted antes de empezar. No la aplique en el pecho.

Llame a la clínica si la piel empeora, aparece pus o fiebre, o si no mejora en 2 semanas.`,
};

function composePlainText(heading: string, blocks: InstructionBlock[]): string {
  return [heading, ...blocks.map((block) => block.es)].join("\n\n");
}

export function fixtureInstructionsResponse(treatment?: SelectedTreatmentInput): InstructionsResponse {
  if (treatment && treatment.id !== "med_8f21c94a") {
    const headingEs = `${treatment.name} — instrucciones para la paciente`;
    const blocks: InstructionBlock[] = [
      {
        kind: "text",
        es: `Estas instrucciones son para ${treatment.name}. Revise la dosis, la frecuencia y la duración con su médico antes de empezar.`,
      },
      {
        kind: "text",
        es: "Use el medicamento solamente como fue indicado en la visita. No cambie la cantidad ni la frecuencia sin hablar con la clínica.",
      },
      {
        kind: "callout",
        es: "Si tiene preguntas sobre embarazo, lactancia, alergias o efectos secundarios, espere la confirmación del médico antes de usarlo.",
      },
      {
        kind: "text",
        es: "Llame a la clínica si los síntomas empeoran, si aparece una reacción alérgica, o si no mejora como se esperaba.",
      },
    ];

    return {
      mode: "fixture",
      headingEs,
      blocks,
      plainText: composePlainText(headingEs, blocks),
      logEntry: { t: "10:38:44", code: "200", msg: "openai · instructions.generate" },
    };
  }

  return {
    mode: "fixture",
    ...fixtureInstructions,
    logEntry: { t: "10:38:44", code: "200", msg: "openai · instructions.generate" },
  };
}

export function fixturePhotonSyncResponse(
  treatment?: SelectedTreatmentInput,
  patientInput?: PhotonPatientInput,
): PhotonSyncResponse {
  const treatmentId = treatment?.id ?? "med_8f21c94a";
  const patient = normalizePhotonPatientInput(patientInput);
  return {
    mode: "fixture",
    ok: true,
    patientId: "pat_01HQ7K4M2Z",
    treatmentId,
    patient,
    milestones: [
      { label: "Auth check", status: "ok", id: "token · 3600s" },
      { label: "Patient sync", status: "ok", id: "pat_01HQ7K4M2Z" },
      { label: "Treatment lookup", status: "ok", id: treatmentId },
      { label: "Allergy history", status: "ok", id: "1 record · sulfa" },
      { label: "Medication history", status: "ok", id: "1 record · prenatal vitamin" },
    ],
    logEntries: [
      { t: "10:38:02", code: "200", msg: "POST /auth/token" },
      { t: "10:39:03", code: "201", msg: "POST /patients → pat_01HQ7K4M2Z" },
      { t: "10:39:18", code: "200", msg: `GET /catalog/treatments → ${treatmentId}` },
      { t: "10:39:26", code: "200", msg: "GET /allergies → 1 record" },
      { t: "10:39:31", code: "200", msg: "GET /medication_history → 1 record" },
    ],
  };
}

function fixtureEsToEn(text: string): string {
  const l = text.toLowerCase();
  if (/amamant|lactan|pecho|seno/.test(l)) return "Is it safe to use this cream while I'm breastfeeding?";
  if (/duele|dolor|arde|quema/.test(l)) return "Can I use the cream if my skin hurts or stings?";
  if (/cuánto|cuanto|tiempo|días|dias/.test(l)) return "How long do I need to use the cream?";
  return `"${text}" — translated for clinician review.`;
}

function fixtureEnToEs(text: string): string {
  const l = text.toLowerCase();
  if (/safe|breastfeed/.test(l)) {
    return "Sí, puede seguir usando la crema mientras amamanta. No la aplique en el pecho y avíseme si algo cambia.";
  }
  if (/stop|days|week/.test(l)) return "Úsela durante 7 días y luego deténgase. Si no mejora, llame a la clínica.";
  return `«${text}» — traducción para la paciente.`;
}

export function isFixtureClinicalQuestion(text: string): boolean {
  return /amamant|lactan|pecho|seno|duele|dolor|arde|quema|embarazo|alergia|efecto|seguro|segura/i.test(text);
}

export function fixtureTranslateResponse(text: string, direction: TranslateDirection): TranslateResponse {
  return {
    mode: "fixture",
    translated: direction === "es→en" ? fixtureEsToEn(text) : fixtureEnToEs(text),
    isClinicalQuestion: direction === "es→en" ? isFixtureClinicalQuestion(text) : false,
    logEntry: {
      t: "10:44:00",
      code: "200",
      msg: `openai · message.translate (${direction})`,
    },
  };
}
