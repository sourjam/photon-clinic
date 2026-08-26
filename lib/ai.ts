import { z } from "zod";
import { fixtureInstructionsResponse, fixtureTranslateResponse } from "./fixtures";
import type {
  InstructionsResponse,
  PhotonPatientInput,
  SelectedTreatmentInput,
  TranslateDirection,
  TranslateResponse,
} from "./types";
import type { VisitContext } from "../app/visit/types";

const instructionResponseSchema = z.object({
  headingEs: z.string().min(1),
  blocks: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("text"), es: z.string().min(1) }),
        z.object({ kind: z.literal("callout"), es: z.string().min(1) }),
      ]),
    )
    .min(1),
  plainText: z.string().min(1),
});

const translateResponseSchema = z.object({
  translated: z.string().min(1),
  isClinicalQuestion: z.boolean(),
});

function hasOpenAiCredentials(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function extractOutputText(response: unknown): string {
  const parsed = z.object({ output_text: z.string().optional() }).passthrough().safeParse(response);
  if (parsed.success && parsed.data.output_text) return parsed.data.output_text;

  const output = z
    .object({
      output: z.array(
        z.object({
          content: z.array(
            z.object({
              text: z.string().optional(),
            }).passthrough(),
          ),
        }).passthrough(),
      ),
    })
    .passthrough()
    .safeParse(response);

  return output.success ? (output.data.output[0]?.content[0]?.text ?? "") : "";
}

async function callOpenAiJson(input: string, schemaName: string, schema: Record<string, unknown>): Promise<unknown> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = z
      .object({ error: z.object({ message: z.string() }).passthrough().optional() })
      .passthrough()
      .safeParse(data);
    throw new Error(`OpenAI request failed: ${response.status} ${message.success ? (message.data.error?.message ?? "") : ""}`);
  }

  const outputText = extractOutputText(data);
  if (!outputText) throw new Error("OpenAI response had no output text");
  return JSON.parse(outputText);
}

export async function generatePatientInstructions(
  note: string,
  treatment?: SelectedTreatmentInput,
  patient?: PhotonPatientInput,
  visitContext?: VisitContext,
): Promise<InstructionsResponse> {
  if (!hasOpenAiCredentials()) return fixtureInstructionsResponse(treatment);

  const raw = await callOpenAiJson(
    [
      "Generate patient-friendly Spanish dermatology instructions from this clinician note.",
      "Use respectful plain Spanish. Preserve medication names, dose numbers, frequencies, and durations exactly.",
      patient ? `Patient: ${patient.firstName} ${patient.lastName}, DOB ${patient.dateOfBirth}, sex ${patient.sex}.` : "",
      visitContext
        ? [
            `Visit context: ${visitContext.specialty || "unspecified specialty"} · ${visitContext.visitReason || "unspecified reason"}.`,
            `Known allergies: ${visitContext.allergies || "none documented"}.`,
            `Current medications: ${visitContext.currentMeds || "none documented"}.`,
            visitContext.raisedInVisit ? `Raised in visit: ${visitContext.raisedInVisit}.` : "",
          ].join("\n")
        : "",
      treatment ? `Selected Photon treatment: ${treatment.name} (${treatment.id}).` : "",
      "Do not answer the breastfeeding question as medical advice; put that uncertainty in a callout that requires clinician confirmation.",
      "Return only the requested JSON shape.",
      `Clinician note: ${note}`,
    ].join("\n\n"),
    "patient_instructions",
    {
      type: "object",
      additionalProperties: false,
      required: ["headingEs", "blocks", "plainText"],
      properties: {
        headingEs: { type: "string" },
        blocks: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "es"],
            properties: {
              kind: { type: "string", enum: ["text", "callout"] },
              es: { type: "string" },
            },
          },
        },
        plainText: { type: "string" },
      },
    },
  );

  const parsed = instructionResponseSchema.parse(raw);
  return {
    mode: "live",
    ...parsed,
    logEntry: { t: new Date().toTimeString().slice(0, 8), code: "200", msg: "openai · instructions.generate" },
  };
}

export async function translateText(text: string, direction: TranslateDirection): Promise<TranslateResponse> {
  if (!hasOpenAiCredentials()) return fixtureTranslateResponse(text, direction);

  try {
    const raw = await callOpenAiJson(
      [
        `Translate this ${direction === "es→en" ? "Spanish patient message to English" : "English clinician reply to Spanish"}.`,
        "Also classify whether the original message is a clinical/medical question that should be flagged for clinician review.",
        "Return only the requested JSON shape.",
        `Text: ${text}`,
      ].join("\n\n"),
      "message_translation",
      {
        type: "object",
        additionalProperties: false,
        required: ["translated", "isClinicalQuestion"],
        properties: {
          translated: { type: "string" },
          isClinicalQuestion: { type: "boolean" },
        },
      },
    );
    const parsed = translateResponseSchema.parse(raw);
    return {
      mode: "live",
      ...parsed,
      isClinicalQuestion: direction === "es→en" ? parsed.isClinicalQuestion : false,
      logEntry: { t: new Date().toTimeString().slice(0, 8), code: "200", msg: `openai · message.translate (${direction})` },
    };
  } catch {
    return fixtureTranslateResponse(text, direction);
  }
}
