import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => {
  vi.restoreAllMocks();
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

  it("returns live Photon sync success when existing clinical history records are already attached", async () => {
    process.env.PHOTON_CLIENT_ID = "client-id";
    process.env.PHOTON_CLIENT_SECRET = "client-secret";
    process.env.PHOTON_TOKEN_URL = "https://auth.example.test/oauth/token";
    process.env.PHOTON_API_URL = "https://api.example.test/graphql";
    process.env.PHOTON_CATALOG_API_URL = "https://catalog.example.test/graphql";
    process.env.PHOTON_AUTH_TOKEN = "catalog-token";

    const responses = [
      { access_token: "live-token", expires_in: 86400 },
      { data: { treatments: [{ id: "med_hydrocortisone", name: "Hydrocortisone" }] } },
      { data: { allergens: [{ id: "alg_sulfa", name: "Sulfa" }] } },
      { data: { treatments: [{ id: "med_prenatal", name: "Prenatal vitamin" }] } },
      { data: { patients: [{ id: "pat_existing", externalId: "phoclinic2-maria-gonzalez" }] } },
      { errors: [{ message: "Allergen alg_sulfa already exists on patient pat_existing" }] },
      { data: { updatePatient: { id: "pat_existing" } } },
    ];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const body = responses.shift();

      return Response.json(body);
    });

    const response = await postPhotonSync();
    const json = (await response.json()) as { mode: string; ok: boolean; patientId: string };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ mode: "live", ok: true, patientId: "pat_existing" });
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });
});
