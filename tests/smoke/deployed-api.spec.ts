import { expect, test } from "@playwright/test";

const liveSmoke = process.env.LIVE_SMOKE === "1";

function smokeExternalId(): string {
  return `phoclinic2-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

test("deployed app responds", async ({ request }) => {
  const response = await request.get("/");

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("text/html");
});

test("treatment lookup returns a valid response shape for multiple terms", async ({ request }) => {
  for (const term of ["hydrocortisone", "mupirocin"]) {
    const response = await request.get(`/api/photon/treatments?term=${term}`);
    const body = (await response.json()) as {
      mode?: string;
      results?: Array<{ id?: string; name?: string }>;
    };

    expect(response.ok()).toBe(true);
    expect(["fixture", "live"]).toContain(body.mode);
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results?.[0]?.id).toEqual(expect.any(String));
    expect(body.results?.[0]?.name).toEqual(expect.any(String));
  }
});

test("instruction generation accepts new visit context", async ({ request }) => {
  const response = await request.post("/api/instructions", {
    data: {
      note: "New eczema flare on forearms. Reviewed moisturizer and topical steroid counseling.",
      visitContext: {
        language: "Spanish",
        specialty: "Dermatology",
        visitReason: "Eczema flare",
        allergies: "No known drug allergies",
        currentMeds: "Prenatal vitamin",
        raisedInVisit: "Breastfeeding question",
      },
      treatment: {
        id: "med_01KZPF528J4E6R0R3FD2XNV1JA",
        name: "Hydrocortisone (Perianal) Topical Cream 2.5 %",
      },
    },
  });
  const body = (await response.json()) as {
    mode?: string;
    headingEs?: string;
    plainText?: string;
    blocks?: unknown[];
  };

  expect(response.ok()).toBe(true);
  expect(["fixture", "live"]).toContain(body.mode);
  expect(body.headingEs).toEqual(expect.any(String));
  expect(body.plainText).toEqual(expect.any(String));
  expect(Array.isArray(body.blocks)).toBe(true);
});

test("message translation returns translated text and clinical classification", async ({ request }) => {
  const response = await request.post("/api/translate", {
    data: {
      text: "¿Es seguro usar esta crema mientras estoy amamantando?",
      direction: "es→en",
    },
  });
  const body = (await response.json()) as {
    mode?: string;
    translated?: string;
    isClinicalQuestion?: boolean;
  };

  expect(response.ok()).toBe(true);
  expect(["fixture", "live"]).toContain(body.mode);
  expect(body.translated).toEqual(expect.any(String));
  expect(body.isClinicalQuestion).toEqual(expect.any(Boolean));
});

test("live patient sync writes and reuses a generated smoke patient", async ({ request }) => {
  test.skip(!liveSmoke, "Set LIVE_SMOKE=1 to create Photon sandbox patient records.");

  const externalId = smokeExternalId();
  const payload = {
    patient: {
      externalId,
      firstName: "Smoke",
      lastName: `Patient${Date.now()}`,
      dateOfBirth: "1993-05-17",
      sex: "FEMALE",
      phone: "(718) 555-0199",
    },
    treatment: {
      id: "med_01KZPF528J4E6R0R3FD2XNV1JA",
      name: "Hydrocortisone (Perianal) Topical Cream 2.5 %",
    },
  };

  const firstResponse = await request.post("/api/photon/sync", { data: payload });
  const firstBody = (await firstResponse.json()) as { mode?: string; ok?: boolean; patientId?: string };

  expect(firstResponse.ok()).toBe(true);
  expect(firstBody.mode).toBe("live");
  expect(firstBody.ok).toBe(true);
  expect(firstBody.patientId).toEqual(expect.any(String));

  const secondResponse = await request.post("/api/photon/sync", { data: payload });
  const secondBody = (await secondResponse.json()) as { mode?: string; ok?: boolean; patientId?: string };

  expect(secondResponse.ok()).toBe(true);
  expect(secondBody.mode).toBe("live");
  expect(secondBody.ok).toBe(true);
  expect(secondBody.patientId).toBe(firstBody.patientId);
});
