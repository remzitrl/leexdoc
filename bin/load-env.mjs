import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [".env.local", ".env"]; // Next ile uyumlu yükleme sırası


for (const f of candidates) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) {
    const r = dotenv.config({ path: p });
    dotenvExpand.expand(r);
  }
}

// NODE_ENV varsayılan değeri
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// PORT varsayılan değeri
if (!process.env.PORT) {
  process.env.PORT = "3000";
}
