import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL gerekli"),
  REDIS_URL: z.string().optional(),
  REDIS_DISABLED: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET gerekli"),
  NEXTAUTH_URL: z.string().optional(),
  PORT: z.string().optional()
});

export const ENV = (() => {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msgs = parsed.error.issues.map(i => `- ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`ENV doğrulama hatası:\n${msgs}`);
  }
  return parsed.data;
})();