import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default("development-secret-change-me"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
