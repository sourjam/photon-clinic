import { fixturePhotonSyncResponse } from "./fixtures";
import { normalizePhotonPatientInput, type NormalizedPhotonPatient } from "./patient";
import type { PhotonSyncRequest, PhotonSyncResponse } from "./types";

type GraphQlResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

type TokenResponse = {
  access_token: string;
  expires_in?: number;
};

type PatientSyncIds = {
  allergyId: string;
  medicationHistoryId: string;
};

function hasPhotonCredentials(): boolean {
  return Boolean(
    process.env.PHOTON_CLIENT_ID &&
      process.env.PHOTON_CLIENT_SECRET &&
      process.env.PHOTON_TOKEN_URL &&
      process.env.PHOTON_API_URL,
  );
}

async function exchangeToken(): Promise<TokenResponse> {
  const response = await fetch(process.env.PHOTON_TOKEN_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.PHOTON_CLIENT_ID,
      client_secret: process.env.PHOTON_CLIENT_SECRET,
      audience: process.env.PHOTON_AUDIENCE ?? "https://api.neutron.health",
    }),
  });

  if (!response.ok) throw new Error(`Photon auth failed: ${response.status}`);
  return response.json() as Promise<TokenResponse>;
}

async function graphqlRequest<T>(
  url: string,
  query: string,
  variables: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as GraphQlResponse<T>;
  if (!response.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message ?? `Photon GraphQL failed: ${response.status}`);
  }
  if (!json.data) throw new Error("Photon GraphQL returned no data");
  return json.data;
}

type TreatmentCatalogAttempt = {
  label: string;
  url: string;
  headers: Record<string, string>;
};

const TREATMENT_SEARCH_QUERY = `query Treatments($filter: TreatmentFilter!) {
    treatments(filter: $filter) {
      id
      name
    }
  }`;

function buildTreatmentCatalogAttempts(token?: string): TreatmentCatalogAttempt[] {
  const attempts: TreatmentCatalogAttempt[] = [];
  if (process.env.PHOTON_AUTH_TOKEN && process.env.PHOTON_CATALOG_API_URL) {
    attempts.push({
      label: "catalog auth token",
      url: process.env.PHOTON_CATALOG_API_URL,
      headers: { "x-photon-auth-token": process.env.PHOTON_AUTH_TOKEN, "x-photon-auth-token-type": "auth0" },
    });
  }
  if (token && process.env.PHOTON_CATALOG_API_URL) {
    attempts.push({
      label: "catalog authorization token",
      url: process.env.PHOTON_CATALOG_API_URL,
      headers: { authorization: token },
    });
    attempts.push({
      label: "catalog authorization bearer token",
      url: process.env.PHOTON_CATALOG_API_URL,
      headers: { authorization: `Bearer ${token}` },
    });
  }
  return attempts;
}

export async function searchPhotonTreatments(
  term: string,
  options: { token?: string; limit?: number } = {},
): Promise<{ id: string; name: string }[]> {
  const attempts = buildTreatmentCatalogAttempts(options.token);
  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const data = await graphqlRequest<{ treatments: { id: string; name?: string }[] }>(
        attempt.url,
        TREATMENT_SEARCH_QUERY,
        { filter: { term } },
        attempt.headers,
      );

      return data.treatments
        .filter((treatment): treatment is { id: string; name: string } => Boolean(treatment.id && treatment.name))
        .slice(0, options.limit ?? 8);
    } catch (error) {
      errors.push(`${attempt.label} (${term}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(errors.join(" | ") || "No Photon catalog API URL configured");
}

async function searchTreatment(token: string, terms: string | string[]): Promise<string> {
  const searchTerms = Array.isArray(terms) ? terms : [terms];
  const errors: string[] = [];

  for (const term of searchTerms) {
    try {
      const [treatment] = await searchPhotonTreatments(term, { token, limit: 1 });
      if (!treatment?.id) throw new Error(`No Photon treatment found for ${term}`);
      return treatment.id;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(errors.join(" | ") || "No Photon treatment found");
}

async function searchAllergen(token: string): Promise<string> {
  const apiUrl = process.env.PHOTON_API_URL as string;
  const data = await graphqlRequest<{ allergens: { id: string; name?: string }[] }>(
    apiUrl,
    `query Allergens($filter: AllergenFilter) {
      allergens(filter: $filter) {
        id
        name
      }
    }`,
    { filter: { name: "sulfa" } },
    { Authorization: `Bearer ${token}` },
  );

  const allergen = data.allergens[0];
  if (!allergen?.id) throw new Error("No Photon allergen found for sulfa");
  return allergen.id;
}

function isAlreadyAttachedClinicalRecordError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists on patient/i.test(message);
}

async function upsertPatient(token: string, ids: PatientSyncIds, patient: NormalizedPhotonPatient): Promise<string> {
  const headers = { Authorization: `Bearer ${token}` };
  const apiUrl = process.env.PHOTON_API_URL as string;

  const patients = await graphqlRequest<{ patients: { id: string; externalId?: string | null }[] }>(
    apiUrl,
    `query Patients {
      patients {
        id
        externalId
      }
    }`,
    {},
    headers,
  );

  const existing = patients.patients.find((candidate) => candidate.externalId === patient.externalId);
  const baseVariables = {
    externalId: patient.externalId,
    name: { first: patient.firstName, last: patient.lastName },
    dateOfBirth: patient.dateOfBirth,
    sex: patient.sex,
    phone: patient.phone,
  };
  const clinicalHistoryVariables = {
    allergies: [{ allergenId: ids.allergyId }],
    medicationHistory: [
      {
        medicationId: ids.medicationHistoryId,
        active: true,
        comment: "Patient reports prenatal vitamin.",
      },
    ],
  };
  const variables = { ...baseVariables, ...clinicalHistoryVariables };

  if (existing) {
    const updateExistingPatient = (updateVariables: Record<string, unknown>) =>
      graphqlRequest<{ updatePatient: { id: string } }>(
        apiUrl,
        `mutation UpdatePatient(
        $id: ID!
        $externalId: ID
        $name: NameInput
        $dateOfBirth: AWSDate
        $sex: SexType
        $phone: AWSPhone
        $allergies: [AllergenInput]
        $medicationHistory: [MedHistoryInput]
      ) {
        updatePatient(
          id: $id
          externalId: $externalId
          name: $name
          dateOfBirth: $dateOfBirth
          sex: $sex
          phone: $phone
          allergies: $allergies
          medicationHistory: $medicationHistory
        ) {
          id
        }
      }`,
        { id: existing.id, ...updateVariables },
        headers,
      );

    try {
      const updated = await updateExistingPatient(variables);
      return updated.updatePatient.id;
    } catch (error) {
      if (!isAlreadyAttachedClinicalRecordError(error)) throw error;
      const updated = await updateExistingPatient(baseVariables);
      return updated.updatePatient.id;
    }
  }

  const created = await graphqlRequest<{ createPatient: { id: string } }>(
    apiUrl,
    `mutation CreatePatient(
      $externalId: ID
      $name: NameInput!
      $dateOfBirth: AWSDate!
      $sex: SexType!
      $phone: AWSPhone!
      $allergies: [AllergenInput]
      $medicationHistory: [MedHistoryInput]
    ) {
      createPatient(
        externalId: $externalId
        name: $name
        dateOfBirth: $dateOfBirth
        sex: $sex
        phone: $phone
        allergies: $allergies
        medicationHistory: $medicationHistory
      ) {
        id
      }
    }`,
    variables,
    headers,
  );
  return created.createPatient.id;
}

export async function syncPhotonClinicalData(request: PhotonSyncRequest = {}): Promise<PhotonSyncResponse> {
  const patient = normalizePhotonPatientInput(request.patient);

  if (!hasPhotonCredentials()) return fixturePhotonSyncResponse(request.treatment, request.patient);

  const now = () => new Date().toTimeString().slice(0, 8);
  const token = await withStage("auth exchange", () => exchangeToken());
  const logEntries = [{ t: now(), code: "200", msg: "POST /auth/token" }];

  const treatmentId = request.treatment?.id ??
    (await withStage("treatment lookup", () =>
      searchTreatment(token.access_token, ["hydrocortisone cream 2.5%", "hydrocortisone cream", "hydrocortisone"]),
    ));
  logEntries.push({ t: now(), code: "200", msg: `GET /catalog/treatments → ${treatmentId}` });

  const allergyId = await withStage("allergen lookup", () => searchAllergen(token.access_token));
  logEntries.push({ t: now(), code: "200", msg: `GET /allergens → ${allergyId}` });

  const medicationHistoryId = await withStage("medication history lookup", () =>
    searchTreatment(token.access_token, ["prenatal vitamin", "prenatal"]),
  );
  logEntries.push({ t: now(), code: "200", msg: `GET /catalog/treatments → ${medicationHistoryId}` });

  const patientId = await withStage("patient sync", () =>
    upsertPatient(token.access_token, { allergyId, medicationHistoryId }, patient),
  );
  logEntries.push({ t: now(), code: "200", msg: `POST /patients → ${patientId}` });

  return {
    mode: "live",
    ok: true,
    patientId,
    treatmentId,
    patient,
    milestones: [
      { label: "Auth check", status: "ok", id: `token · ${token.expires_in ?? 3600}s` },
      { label: "Patient sync", status: "ok", id: patientId },
      { label: "Treatment lookup", status: "ok", id: treatmentId },
      { label: "Allergy history", status: "ok", id: `1 record · ${allergyId}` },
      { label: "Medication history", status: "ok", id: `1 record · ${medicationHistoryId}` },
    ],
    logEntries,
  };
}

async function withStage<T>(stage: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${stage}: ${detail}`);
  }
}
