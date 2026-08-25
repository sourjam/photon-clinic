import { syncPhotonClinicalData } from "../../../../lib/photon";

export async function POST() {
  try {
    return Response.json(await syncPhotonClinicalData());
  } catch {
    return Response.json({ error: "Photon sync failed" }, { status: 502 });
  }
}
