import { ERR_MALICIOUS_FILE } from "@/lib/security/messages";
import { sanitizeFilename } from "./filename";

const MAX = 512 * 1024 * 1024;
const ALLOWED = {
  mp3: ["audio/mpeg"],
  m4a: ["audio/mp4", "audio/aac"],
  aac: ["audio/aac", "audio/mp4"],
  flac: ["audio/flac"],
  wav: ["audio/wav", "audio/x-wav"],
  ogg: ["audio/ogg"],
};

export function detectMaliciousUpload(i: {
  originalName: string;
  mimeFromHeader: string;
  mimeFromSniff?: string;
  sizeBytes: number;
}): { safeName: string; ext: string } {
  if (i.sizeBytes <= 0 || i.sizeBytes > MAX) throw new Error(ERR_MALICIOUS_FILE);

  const safe = sanitizeFilename(i.originalName);
  const m = safe.match(/\.([a-z0-9]{1,10})$/);
  const ext = m ? m[1] : "";

  // çift uzantı: name.ext1.ext2 → ve ext2 ses değilse reddet
  const dotCount = safe.split(".").length - 1;
  if (dotCount > 1) {
    if (!ALLOWED[ext as keyof typeof ALLOWED]) throw new Error(ERR_MALICIOUS_FILE);
  }

  const allowedMimes = ALLOWED[ext as keyof typeof ALLOWED];
  if (!allowedMimes) throw new Error(ERR_MALICIOUS_FILE);

  if (!allowedMimes.includes(i.mimeFromHeader)) throw new Error(ERR_MALICIOUS_FILE);
  if (i.mimeFromSniff && i.mimeFromSniff !== i.mimeFromHeader) throw new Error(ERR_MALICIOUS_FILE);

  return { safeName: safe, ext };
}
