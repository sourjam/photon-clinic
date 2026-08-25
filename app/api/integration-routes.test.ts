import { beforeEach, describe, expect, it } from "vitest";
import { POST as postInstructions } from "./instructions/route";
import { POST as postPhotonSync } from "./photon/sync/route";
import { POST as postTranslate } from "./translate/route";

const secretKeys = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "PHOTON_CLIENT_ID",
  "PHOTON_CLIENT_SECRET",
  "PHOTON_TOKEN_URL",
  "PHOTON_AUDIENCE",
  "PHOTON_API_URL",
  "PHOTON_CATALOG_API_URL",
  "PHOTON_AUTH_TOKEN",
] as const;

function jsonRequest(path: string, body: Record<string, unknown>) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  for (const key of secretKeys) {
    delete process.env[key];
  }
});

describe("integration route seams", () => {
  it("returns fixture instructions when OpenAI credentials are not configured", async () => {
    const response = await postInstructions(jsonRequest("/api/instructions", { note: "eczema follow-up" }));
    const json = (await response.json()) as { mode: string; headingEs: string; blocks: unknown[] };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      mode: "fixture",
      headingEs: "Crema de hidrocortisona 2.5% — cómo usarla",
    });
    expect(json.blocks).toHaveLength(5);
  });

  it("rejects invalid instruction requests at the route boundary", async () => {
    const response = await postInstructions(jsonRequest("/api/instructions", { note: "" }));
    const json = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid instruction request" });
  });

  it("returns fixture translation and clinical classification without OpenAI credentials", async () => {
    const response = await postTranslate(
      jsonRequest("/api/translate", {
        text: "¿Es seguro usar esta crema mientras estoy amamantando?",
        direction: "es→en",
      }),
    );
    const json = (await response.json()) as { mode: string; isClinicalQuestion: boolean; translated: string };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      mode: "fixture",
      isClinicalQuestion: true,
      translated: "Is it safe to use this cream while I'm breastfeeding?",
    });
  });

  it("rejects invalid translation directions at the route boundary", async () => {
    const response = await postTranslate(jsonRequest("/api/translate", { text: "hola", direction: "fr→en" }));
    const json = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid translation request" });
  });

  it("returns fixture Photon sync data when Photon credentials are not configured", async () => {
    const response = await postPhotonSync();
    const json = (await response.json()) as {
      mode: string;
      ok: boolean;
      patientId: string;
      treatmentId: string;
      milestones: unknown[];
    };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      mode: "fixture",
      ok: true,
      patientId: "pat_01HQ7K4M2Z",
      treatmentId: "med_8f21c94a",
    });
    expect(json.milestones).toHaveLength(5);
  });
});
