import "./load-env.mjs";
import { spawn } from "cross-spawn";
import * as tcp from "tcp-port-used";

const now = () => new Date().toISOString().slice(11, 19);
const log = (...a) => console.log(`[${now()}]`, ...a);

console.log("🔍 Mixora Tanılama Başlatılıyor...\n");

// Check environment variables
const checkEnv = () => {
  console.log("📋 ENV Kontrolü:");
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || "undefined",
    DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
    REDIS_URL: process.env.REDIS_URL ? "✅ Set" : "❌ Missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
    S3_ENDPOINT: process.env.S3_ENDPOINT || "❌ Not set",
    S3_BUCKET: process.env.S3_BUCKET || "❌ Not set",
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "❌ Not set",
    PORT: process.env.PORT || "3000 (default)"
  };
  
  console.table(envVars);
  
  const required = ['DATABASE_URL', 'REDIS_URL', 'NEXTAUTH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Eksik zorunlu ENV değişkenleri: ${missing.join(', ')}`);
  } else {
    console.log("\n✅ Tüm zorunlu ENV değişkenleri mevcut");
  }
};

// Check port availability
const checkPorts = async () => {
  console.log("\n🌐 Port Kontrolü:");
  const ports = [
    { port: 5432, name: "PostgreSQL", service: "postgres" },
    { port: 6379, name: "Redis", service: "redis" },
    { port: 9000, name: "MinIO", service: "minio" },
    { port: Number(process.env.PORT || 3000), name: "Next.js Dev", service: "nextjs" }
  ];
  
  const results = await Promise.all(
    ports.map(async ({ port, name, service }) => {
      try {
        const isOpen = await tcp.check(port, "127.0.0.1");
        return {
          Port: port,
          Service: name,
          Status: isOpen ? "✅ Open" : "❌ Closed",
          Address: `127.0.0.1:${port}`
        };
      } catch (error) {
        return {
          Port: port,
          Service: name,
          Status: "❌ Error",
          Address: `127.0.0.1:${port}`
        };
      }
    })
  );
  
  console.table(results);
  
  const openPorts = results.filter(r => r.Status.includes("✅")).length;
  const totalPorts = results.length;
  console.log(`\n📊 Port Durumu: ${openPorts}/${totalPorts} açık`);
};

// Check Docker status
const checkDocker = async () => {
  console.log("\n🐳 Docker Kontrolü:");
  
  try {
    // Check if docker command exists
    const dockerVersion = await new Promise((resolve, reject) => {
      const child = spawn("docker", ["version", "--format", "{{.Server.Version}}"], { stdio: 'pipe' });
      let output = '';
      child.stdout.on('data', (data) => output += data.toString());
      child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Docker version failed: ${code}`)));
      child.on('error', reject);
    });
    
    console.log(`✅ Docker CLI: ${dockerVersion}`);
    
    // Check if docker daemon is running
    try {
      const dockerInfo = await new Promise((resolve, reject) => {
        const child = spawn("docker", ["info", "--format", "{{.ServerVersion}}"], { stdio: 'pipe' });
        let output = '';
        child.stdout.on('data', (data) => output += data.toString());
        child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Docker info failed: ${code}`)));
        child.on('error', reject);
      });
      
      console.log(`✅ Docker Daemon: ${dockerInfo}`);
      
      // Check docker compose status
      try {
        const composePs = await new Promise((resolve, reject) => {
          const child = spawn("docker", ["compose", "ps", "--format", "table"], { stdio: 'pipe' });
          let output = '';
          child.stdout.on('data', (data) => output += data.toString());
          child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Docker compose ps failed: ${code}`)));
          child.on('error', reject);
        });
        
        console.log("\n📋 Docker Compose Servisleri:");
        console.log(composePs);
        
        // Check recent logs
        try {
          const composeLogs = await new Promise((resolve, reject) => {
            const child = spawn("docker", ["compose", "logs", "--no-color", "--since=30s"], { stdio: 'pipe' });
            let output = '';
            child.stdout.on('data', (data) => output += data.toString());
            child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Docker compose logs failed: ${code}`)));
            child.on('error', reject);
          });
          
          if (composeLogs.trim()) {
            console.log("\n📄 Son 30 saniyelik Docker Compose logları:");
            console.log(composeLogs);
          } else {
            console.log("\n📄 Son 30 saniyelik Docker Compose logları: (boş)");
          }
        } catch (e) {
          console.log("\n📄 Docker Compose logları alınamadı:", e.message);
        }
        
      } catch (e) {
        console.log("❌ Docker Compose: Çalışmıyor veya servis yok");
      }
      
    } catch (e) {
      console.log("❌ Docker Daemon: Çalışmıyor");
    }
    
  } catch (e) {
    console.log("❌ Docker CLI: Bulunamadı veya çalışmıyor");
  }
};

// Check system resources
const checkSystem = () => {
  console.log("\n💻 Sistem Bilgileri:");
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB heap used`);
  console.log(`Uptime: ${Math.round(process.uptime())}s`);
};

// Main function
const main = async () => {
  try {
    checkEnv();
    await checkPorts();
    await checkDocker();
    checkSystem();
    
    console.log("\n✅ Tanılama tamamlandı!");
    console.log("\n💡 Öneriler:");
    console.log("- Docker çalışmıyorsa: npm run dev:nodocker");
    console.log("- Portlar kapalıysa: Docker servislerini başlatın veya yerel servisleri kurun");
    console.log("- ENV eksikse: .env dosyasını kontrol edin");
    
  } catch (error) {
    console.error("\n❌ Tanılama hatası:", error.message);
    process.exit(1);
  }
};

main();