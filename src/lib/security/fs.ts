import path from "node:path";
import { ERR_DANGEROUS_PATH, WARN_NON_STRICT } from "@/lib/security/messages";

export type Strictness = "strict" | "non-strict";

export function assertSafeRelativePath(p: string, mode: Strictness = "strict"): void {
  // normalize
  const n = path.posix.normalize(p).replace(/^\.\/+/,"");
  // tehlikeli kalıplar
  const dangerous =
    n.startsWith("/") ||
    n.includes("..") ||
    /[\x00-\x1F]/.test(n) ||                 // control chars
    /[:*?"<>|\\]/.test(n) ||                 // illegal on windows
    /^\s*$/.test(n);

  if (dangerous) {
    const e = new Error(ERR_DANGEROUS_PATH);
    // makine-okunur neden
    (e as any).code = "ERR_DANGEROUS_PATH";
    throw e;
  }

  if (mode === "non-strict") {
    console.warn(WARN_NON_STRICT);
  }
}
