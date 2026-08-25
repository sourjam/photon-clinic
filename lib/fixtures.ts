import type { InstructionBlock } from "../app/visit/types";
import type { InstructionsResponse, PhotonSyncResponse, TranslateDirection, TranslateResponse } from "./types";

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

export function fixtureInstructionsResponse(): InstructionsResponse {
  return {
    mode: "fixture",
    ...fixtureInstructions,
    logEntry: { t: "10:38:44", code: "200", msg: "openai · instructions.generate" },
  };
}

export function fixturePhotonSyncResponse(): PhotonSyncResponse {
  return {
    mode: "fixture",
    ok: true,
    patientId: "pat_01HQ7K4M2Z",
    treatmentId: "med_8f21c94a",
    milestones: [
      { label: "Auth check", status: "ok", id: "token · 3600s" },
      { label: "Patient sync", status: "ok", id: "pat_01HQ7K4M2Z" },
      { label: "Treatment lookup", status: "ok", id: "med_8f21c94a" },
      { label: "Allergy history", status: "ok", id: "1 record · sulfa" },
      { label: "Medication history", status: "ok", id: "1 record · prenatal vitamin" },
    ],
    logEntries: [
      { t: "10:38:02", code: "200", msg: "POST /auth/token" },
      { t: "10:39:03", code: "201", msg: "POST /patients → pat_01HQ7K4M2Z" },
      { t: "10:39:18", code: "200", msg: "GET /catalog/treatments → med_8f21c94a" },
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
