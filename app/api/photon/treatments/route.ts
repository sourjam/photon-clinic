import { z } from "zod";
import { fixtureTreatmentSearchResponse } from "../../../../lib/fixtures";
import { searchPhotonTreatments } from "../../../../lib/photon";

const requestSchema = z.object({
  term: z.string().trim().min(2),
});

function hasPhotonCatalogCredentials(): boolean {
  return Boolean(process.env.PHOTON_CATALOG_API_URL && process.env.PHOTON_AUTH_TOKEN);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({ term: url.searchParams.get("term") ?? "" });
  if (!parsed.success) {
    return Response.json({ error: "Invalid treatment search request" }, { status: 400 });
  }

  if (!hasPhotonCatalogCredentials()) {
    return Response.json(fixtureTreatmentSearchResponse(parsed.data.term));
  }

  try {
    return Response.json({
      mode: "live",
      results: await searchPhotonTreatments(parsed.data.term, { limit: 8 }),
    });
  } catch (error) {
    console.error("Photon treatment search failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "Photon treatment search failed" }, { status: 502 });
  }
}
