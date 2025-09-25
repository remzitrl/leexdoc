import "./load-env.mjs";
import { spawn } from "cross-spawn";
import * as tcp from "tcp-port-used";

const now = () => new Date().toISOString().slice(11, 19);
const log = () => {};


// Check environment variables
const checkEnv = () => {
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
  
  
  const required = ['DATABASE_URL', 'REDIS_URL', 'NEXTAUTH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
  } else {
  }
};

// Check port availability
const checkPorts = async () => {
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
  
  
  const openPorts = results.filter(r => r.Status.includes("✅")).length;
  const totalPorts = results.length;
};

// Check Docker status
const checkDocker = async () => {
  
  try {
    // Check if docker command exists
    const dockerVersion = await new Promise((resolve, reject) => {
      const child = spawn("docker", ["version", "--format", "{{.Server.Version}}"], { stdio: 'pipe' });
      let output = '';
      child.stdout.on('data', (data) => output += data.toString());
      child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Docker version failed: ${code}`)));
      child.on('error', reject);
    });
    
    
    // Check if docker daemon is running
    try {
      const dockerInfo = await new Promise((resolve, reject) => {
        const child = spawn("docker", ["info", "--format", "{{.ServerVersion}}"], { stdio: 'pipe' });
        let output = '';
        child.stdout.on('data', (data) => output += data.toString());
        child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Docker info failed: ${code}`)));
        child.on('error', reject);
      });
      
      
      // Check docker compose status
      try {
        const composePs = await new Promise((resolve, reject) => {
          const child = spawn("docker", ["compose", "ps", "--format", "table"], { stdio: 'pipe' });
          let output = '';
          child.stdout.on('data', (data) => output += data.toString());
          child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Docker compose ps failed: ${code}`)));
          child.on('error', reject);
        });
        
        
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
          } else {
          }
        } catch (e) {
        }
        
      } catch (e) {
      }
      
    } catch (e) {
    }
    
  } catch (e) {
  }
};

// Check system resources
const checkSystem = () => {
};

// Main function
const main = async () => {
  try {
    checkEnv();
    await checkPorts();
    await checkDocker();
    checkSystem();
    
    
  } catch (error) {
    process.exit(1);
  }
};

main();