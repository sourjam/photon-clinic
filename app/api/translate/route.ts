import { z } from "zod";
import { translateText } from "../../../lib/ai";

const requestSchema = z.object({
  text: z.string().min(1),
  direction: z.union([z.literal("es→en"), z.literal("en→es")]),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid translation request" }, { status: 400 });
  }

  try {
    return Response.json(await translateText(parsed.data.text, parsed.data.direction));
  } catch (error) {
    console.error("Translation failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "Translation failed" }, { status: 502 });
  }
}
