import { syncPhotonClinicalData } from "../../../../lib/photon";

export async function POST() {
  try {
    return Response.json(await syncPhotonClinicalData());
  } catch (error) {
    console.error("Photon sync failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "Photon sync failed" }, { status: 502 });
  }
}
