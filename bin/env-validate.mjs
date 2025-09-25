// ENV doğrulama - fail-fast
const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET"
];

const optional = [
  "REDIS_URL",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "PORT",
  "NODE_ENV"
];

const missing = [];
const present = [];

// Gerekli alanları kontrol et
for (const key of required) {
  if (!process.env[key] || process.env[key].trim() === "") {
    missing.push(key);
  } else {
    present.push(key);
  }
}

// Opsiyonel alanları kontrol et
for (const key of optional) {
  if (process.env[key] && process.env[key].trim() !== "") {
    present.push(key);
  }
}

// Eksik varsa fail-fast
if (missing.length > 0) {
  console.error("❌ ENV doğrulama hatası:");
  console.error("Eksik gerekli anahtarlar:");
  missing.forEach(key => console.error(`- ${key}`));
  console.error("\nMevcut anahtarlar:");
  present.forEach(key => console.error(`+ ${key}`));
  process.exit(1);
}

// Redis durumu kontrol et
if (!process.env.REDIS_URL || process.env.REDIS_URL.trim() === "") {
  console.log("⚠️  REDIS_URL yok - queue=degraded, ratelimit=disabled");
} else {
  console.log("✅ REDIS_URL mevcut");
}

console.log("✅ ENV doğrulama başarılı");
console.log("Mevcut anahtarlar:", present.join(", "));
