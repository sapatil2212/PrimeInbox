import dotenv from "dotenv";
import { z } from "zod";
import path from "path";

// Load environment variables from backend's own .env first,
// then fall back to the frontend's .env (shared in monorepo)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../email-outreach/.env") });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ENCRYPTION_KEY: z.string().length(64, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"),
  APP_URL: z.string().default("http://localhost:3000"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables configuration:");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
