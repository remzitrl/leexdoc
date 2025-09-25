import { ERR_MALICIOUS_FILE } from "@/lib/security/messages";

export function sanitizeFilename(input: string): string {
  const s0 = input.normalize("NFKC");
  const parts = s0.split(".");
  const ext = parts.length > 1 ? parts.pop()! : "";
  let name = parts.join(".");

  name = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeName = name || "file";
  const safeExt = (ext || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 10);
  const nameMax = 64;

  const trimmedName = safeName.slice(0, nameMax);
  return safeExt ? `${trimmedName}.${safeExt}`.slice(0, 80) : trimmedName.slice(0, 80);
}
