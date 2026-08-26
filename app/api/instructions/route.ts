import { z } from "zod";
import { generatePatientInstructions } from "../../../lib/ai";

const requestSchema = z.object({
  note: z.string().min(1),
  visitContext: z
    .object({
      language: z.literal("Spanish"),
      specialty: z.string(),
      visitReason: z.string(),
      allergies: z.string(),
      currentMeds: z.string(),
      raisedInVisit: z.string(),
    })
    .optional(),
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
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid instruction request" }, { status: 400 });
  }

  try {
    return Response.json(
      await generatePatientInstructions(
        parsed.data.note,
        parsed.data.treatment,
        parsed.data.patient,
        parsed.data.visitContext,
      ),
    );
  } catch (error) {
    console.error("Instruction generation failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "Instruction generation failed" }, { status: 502 });
  }
}
