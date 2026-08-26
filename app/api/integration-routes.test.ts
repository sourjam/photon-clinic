import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postInstructions } from "./instructions/route";
import { POST as postPhotonSync } from "./photon/sync/route";
import { GET as getPhotonTreatments } from "./photon/treatments/route";
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

function getRequest(path: string) {
  return new Request(`http://localhost${path}`);
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

  it("uses selected treatment context for fixture Photon sync when provided", async () => {
    const response = await postPhotonSync(
      jsonRequest("/api/photon/sync", {
        treatment: { id: "med_6f33b7c5", name: "Lisinopril tablet 10 mg" },
      }),
    );
    const json = (await response.json()) as {
      mode: string;
      ok: boolean;
      treatmentId: string;
      milestones: Array<{ label: string; id: string }>;
    };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ mode: "fixture", ok: true, treatmentId: "med_6f33b7c5" });
    expect(json.milestones).toContainEqual(
      expect.objectContaining({ label: "Treatment lookup", id: "med_6f33b7c5" }),
    );
  });

  it("rejects invalid Photon patient sync input at the route boundary", async () => {
    const response = await postPhotonSync(
      jsonRequest("/api/photon/sync", {
        patient: {
          firstName: "",
          lastName: "Rivera",
          dateOfBirth: "not-a-date",
          sex: "FEMALE",
        },
      }),
    );
    const json = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid Photon sync request" });
  });

  it("returns normalized patient context for fixture Photon sync when provided", async () => {
    const response = await postPhotonSync(
      jsonRequest("/api/photon/sync", {
        patient: {
          firstName: "Ana",
          lastName: "Rivera",
          dateOfBirth: "1991-09-03",
          sex: "FEMALE",
          phone: "(718) 555-0199",
        },
      }),
    );
    const json = (await response.json()) as {
      mode: string;
      ok: boolean;
      patient?: { externalId: string; firstName: string; lastName: string; phone?: string };
    };

    expect(response.status).toBe(200);
    expect(json.mode).toBe("fixture");
    expect(json.ok).toBe(true);
    expect(json.patient).toMatchObject({
      externalId: "phoclinic2-demo-ana-rivera-1991-09-03",
      firstName: "Ana",
      lastName: "Rivera",
      phone: "+17185550199",
    });
  });

  it("uses dynamic patient input when creating a live Photon patient", async () => {
    process.env.PHOTON_CLIENT_ID = "client-id";
    process.env.PHOTON_CLIENT_SECRET = "client-secret";
    process.env.PHOTON_TOKEN_URL = "https://auth.example.test/oauth/token";
    process.env.PHOTON_API_URL = "https://api.example.test/graphql";
    process.env.PHOTON_CATALOG_API_URL = "https://catalog.example.test/graphql";
    process.env.PHOTON_AUTH_TOKEN = "catalog-token";

    const responses = [
      { access_token: "live-token", expires_in: 86400 },
      { data: { allergens: [{ id: "alg_sulfa", name: "Sulfa" }] } },
      { data: { treatments: [{ id: "med_prenatal", name: "Prenatal vitamin" }] } },
      { data: { patients: [] } },
      { data: { createPatient: { id: "pat_dynamic" } } },
    ];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json(responses.shift()));

    const response = await postPhotonSync(
      jsonRequest("/api/photon/sync", {
        patient: {
          firstName: "Ana",
          lastName: "Rivera",
          dateOfBirth: "1991-09-03",
          sex: "FEMALE",
          phone: "(718) 555-0199",
        },
        treatment: { id: "med_2a58d901", name: "Mupirocin ointment 2%" },
      }),
    );
    const json = (await response.json()) as { mode: string; ok: boolean; patientId: string };
    const createCall = fetchMock.mock.calls[4];
    const createBody = JSON.parse(String(createCall[1]?.body)) as { variables: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ mode: "live", ok: true, patientId: "pat_dynamic" });
    expect(createBody.variables).toMatchObject({
      externalId: "phoclinic2-demo-ana-rivera-1991-09-03",
      name: { first: "Ana", last: "Rivera" },
      dateOfBirth: "1991-09-03",
      sex: "FEMALE",
      phone: "+17185550199",
    });
  });

  it("rejects invalid Photon treatment searches at the route boundary", async () => {
    const response = await getPhotonTreatments(getRequest("/api/photon/treatments?term=h"));
    const json = (await response.json()) as unknown;

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid treatment search request" });
  });

  it("returns fixture Photon treatment search results when catalog credentials are not configured", async () => {
    const response = await getPhotonTreatments(getRequest("/api/photon/treatments?term=hydrocortisone"));
    const json = (await response.json()) as { mode: string; results: Array<{ id: string; name: string }> };

    expect(response.status).toBe(200);
    expect(json.mode).toBe("fixture");
    expect(json.results).toEqual([
      { id: "med_8f21c94a", name: "Hydrocortisone cream 2.5%", form: "Topical cream · 30 g" },
      { id: "med_3b77e210", name: "Hydrocortisone cream 1%", form: "Topical cream · 28 g" },
      { id: "med_9c14aa08", name: "Hydrocortisone ointment 2.5%", form: "Topical ointment · 30 g" },
    ]);
  });

  it("returns live Photon treatment search results from the clinical catalog", async () => {
    process.env.PHOTON_CATALOG_API_URL = "https://catalog.example.test/graphql";
    process.env.PHOTON_AUTH_TOKEN = "catalog-token";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        data: {
          treatments: [
            { id: "med_live_1", name: "Lisinopril tablet 10 mg" },
            { id: "med_live_2", name: "Lisinopril tablet 20 mg" },
          ],
        },
      }),
    );

    const response = await getPhotonTreatments(getRequest("/api/photon/treatments?term=lisinopril"));
    const json = (await response.json()) as { mode: string; results: Array<{ id: string; name: string }> };

    expect(response.status).toBe(200);
    expect(json).toEqual({
      mode: "live",
      results: [
        { id: "med_live_1", name: "Lisinopril tablet 10 mg" },
        { id: "med_live_2", name: "Lisinopril tablet 20 mg" },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://catalog.example.test/graphql",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-photon-auth-token": "catalog-token",
          "x-photon-auth-token-type": "auth0",
        }),
      }),
    );
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
