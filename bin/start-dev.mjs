import { spawn } from 'cross-spawn';

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${now()}]`, ...a);

// Load .env file
const loadEnv = async () => {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    log('✅ .env yüklendi');
  } catch (e) {
    log('⚠️  .env yüklenemedi:', e.message);
  }
};

// Validate required environment variables
const validateEnv = () => {
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`StartupError: Missing deps. Set DATABASE_URL, NEXTAUTH_SECRET. REDIS_URL is optional.`);
    process.exit(1);
  }
  
  // Check Redis availability
  if (!process.env.REDIS_URL || process.env.REDIS_URL.trim() === '') {
    log('⚠️  REDIS_URL yok - queue=degraded, ratelimit=disabled');
  } else {
    log('✅ REDIS_URL mevcut');
  }
  
  log('✅ Environment variables doğrulandı');
};

// Check port availability
const checkPort = async (port, name, tries = 60) => {
  for (let i = 0; i < tries; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        log(`✅ ${name} port ${port} hazır`);
        return true;
      }
    } catch (e) {
      // Port not ready, continue
    }
    await wait(1000);
  }
  log(`⚠️  ${name} port ${port} hazır değil`);
  return false;
};

// Run command with timeout and exit code check
const runCommand = async (command, args, timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

// Prisma migrate deploy
const prismaMigrate = async () => {
  try {
    log('🗄️ Prisma migrate deploy...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], 30000);
    log('✅ Prisma migrate tamamlandı');
  } catch (e) {
    console.error('PrismaError: migrate deploy failed (drift?). Options: A) npx prisma db pull && npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/000_init/migration.sql && npx prisma migrate resolve --applied 000_init, B) npx prisma migrate reset');
    process.exit(1);
  }
};

// Prisma generate
const prismaGenerate = async () => {
  try {
    log('🔧 Prisma generate...');
    await runCommand('npx', ['prisma', 'generate'], 15000);
    log('✅ Prisma generate tamamlandı');
  } catch (e) {
    console.error('PrismaError: generate failed. Check schema and dependencies.');
    process.exit(1);
  }
};

// Start Next.js and wait for health check
const startNext = async () => {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  log(`🚀 Next.js başlatılıyor (port ${port})...`);
  
  const child = spawn('npm', ['run', 'dev:api'], {
    stdio: 'inherit',
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', PORT: String(port) }
  });
  
  child.on('close', (code) => process.exit(code ?? 1));
  
  // Wait for /api/health to respond
  for (let i = 0; i < 25; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        log('✅ /api/health yanıt verdi');
        return;
      }
    } catch (e) {
      // Not ready yet, continue
    }
    await wait(1000);
  }
  
  console.error('HealthTimeout: Next dev did not respond at /api/health within 25s.');
  process.exit(1);
};

// Main function
const main = async () => {
  log('— Mixora Dev Boot —');
  
  // 1. Load .env
  await loadEnv();
  
  // 2. Validate environment variables
  validateEnv();
  
  // 3. Port checks (non-blocking, just warnings)
  log('🌐 Port kontrolleri (sadece uyarı)...');
  // No local services needed - using remote PostgreSQL
  
  // 5. Prisma migrate deploy (fail-fast)
  await prismaMigrate();
  
  // 6. Prisma generate (fail-fast)
  await prismaGenerate();
  
  // 7. Start Next.js (fail-fast)
  await startNext();
};

// Run main function
main().catch(e => {
  console.error('❌ Başlatma hatası:', e.message);
  process.exit(1);
});