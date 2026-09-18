import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.1"),
  PORT: z.coerce.number().int().default(3001),
});

export const env = envSchema.parse(process.env);
