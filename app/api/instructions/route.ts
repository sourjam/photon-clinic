import { z } from "zod";
import { generatePatientInstructions } from "../../../lib/ai";

const requestSchema = z.object({
  note: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid instruction request" }, { status: 400 });
  }

  try {
    return Response.json(await generatePatientInstructions(parsed.data.note));
  } catch (error) {
    console.error("Instruction generation failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "Instruction generation failed" }, { status: 502 });
  }
}
