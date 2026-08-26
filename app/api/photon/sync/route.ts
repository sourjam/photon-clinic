import { z } from "zod";
import { syncPhotonClinicalData } from "../../../../lib/photon";

const requestSchema = z
  .object({
    patient: z
      .object({
        externalId: z.string().trim().min(1).optional(),
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        sex: z.enum(["FEMALE", "MALE", "UNKNOWN"]),
        phone: z.string().trim().min(1).optional(),
      })
      .optional(),
    treatment: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
      .optional(),
  })
  .optional();

async function parseRequest(request?: Request) {
  if (!request) return {};
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function POST(request?: Request) {
  const parsed = requestSchema.safeParse(await parseRequest(request));
  if (!parsed.success) {
    return Response.json({ error: "Invalid Photon sync request" }, { status: 400 });
  }

  try {
    return Response.json(await syncPhotonClinicalData(parsed.data ?? {}));
  } catch (error) {
    console.error("Photon sync failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "Photon sync failed" }, { status: 502 });
  }
}
