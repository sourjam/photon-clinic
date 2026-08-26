import { z } from "zod";
import { syncPhotonClinicalData } from "../../../../lib/photon";

const requestSchema = z
  .object({
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
  return JSON.parse(text) as unknown;
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
