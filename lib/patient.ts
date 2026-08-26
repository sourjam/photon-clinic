import type { PhotonPatientInput } from "./types";

export type NormalizedPhotonPatient = PhotonPatientInput & {
  externalId: string;
};

const defaultPatient: NormalizedPhotonPatient = {
  externalId: "phoclinic2-maria-gonzalez",
  firstName: "Maria",
  lastName: "Gonzalez",
  dateOfBirth: "1988-04-12",
  sex: "FEMALE",
  phone: "+12025550102",
};

function slugifyPatientPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return trimmed;
}

export function normalizePhotonPatientInput(patient?: PhotonPatientInput): NormalizedPhotonPatient {
  if (!patient) return defaultPatient;

  const firstName = patient.firstName.trim();
  const lastName = patient.lastName.trim();
  const dateOfBirth = patient.dateOfBirth.trim();
  const generatedExternalId = [
    "phoclinic2-demo",
    slugifyPatientPart(firstName),
    slugifyPatientPart(lastName),
    dateOfBirth,
  ]
    .filter(Boolean)
    .join("-");

  return {
    externalId: patient.externalId?.trim() || generatedExternalId,
    firstName,
    lastName,
    dateOfBirth,
    sex: patient.sex,
    phone: normalizePhone(patient.phone),
  };
}
