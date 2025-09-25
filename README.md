# 📚 LeexDoc - Document & Media Management Platform

A modern, secure, and feature-rich document and media management platform built with Next.js, TypeScript, and comprehensive offline capabilities.

## ✨ Features

- 📄 **Document Management** - Upload, organize, and manage various document types
- 🎵 **Media Streaming** - High-quality audio/video streaming with multiple quality options
- 📱 **PWA Support** - Progressive Web App with offline capabilities
- 🔐 **Secure Authentication** - JWT-based authentication with Argon2 password hashing
- 📁 **File Upload** - Support for documents (PDF, DOC, TXT) and media (MP3, MP4, etc.)
- 🎵 **Media Processing** - Automatic transcoding and optimization
- 📊 **File Preview** - Built-in document and media viewers
- 📋 **Organization** - Create, edit, and manage document collections
- 💾 **Offline Downloads** - Download files for offline access
- 🎛️ **Advanced Player** - Media player with loop, shuffle, and speed control
- 🔒 **Security** - Comprehensive security measures with rate limiting and validation
- 🧪 **Testing** - Complete test suite with unit, integration, and E2E tests

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose (recommended)
- Git

## 🐳 Docker ile Kurulum (Önerilen)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-username/leexdoc.git
cd leexdoc

# Copy environment variables
cp .env.example .env

# Install dependencies
pnpm install
```

### 2. Environment Configuration

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://app:app@localhost:5432/leexdoc"

# Redis
REDIS_URL="redis://localhost:6379"

# Storage (local for dev, s3 for prod)
STORAGE_PROVIDER="local"
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="leexdoc"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_REGION="us-east-1"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 3. Start Services

```bash
# Start all services (PostgreSQL, Redis, MinIO)
docker compose up -d

# Wait for services to be ready
docker compose ps
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed the database
pnpm prisma seed
```

### 5. Create Admin User

```bash
# Create the first admin user
node scripts/create-admin.js
```

### 6. Start Development Server

```bash
# Start the development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application!

## 🛠️ Docker'sız Yerel Kurulum

Docker çalışmıyorsa veya kullanmak istemiyorsanız, aşağıdaki adımları takip ederek yerel servisleri kurabilirsiniz:

### 🚨 Docker Çalışmıyorsa (Hızlı Fallback)

Eğer Docker çalışmıyorsa, aşağıdaki komutlarla hızlıca yerel servisleri kurabilirsiniz:

#### Postgres (macOS - Homebrew)
```bash
brew install postgresql@15 && brew services start postgresql@15
createuser app --pwprompt  # Şifre: app
createdb offline_music -O app
```

#### Redis (macOS - Homebrew)
```bash
brew install redis && brew services start redis
```

#### MinIO (Opsiyonel - Dev'de atlanabilir)
```bash
brew install minio
# veya dev'de storage provider=local kullan
```

#### .env.local Örneği (Uzak DB)
```env
# Uzak veritabanı bağlantısı (zorunlu)
DATABASE_URL=postgresql://USER:PASSWORD@REMOTE_HOST:5432/DBNAME?schema=public

# Redis bağlantısı (opsiyonel - yoksa degrade mod)
REDIS_URL=redis://REMOTE_REDIS_HOST:6379

# Storage provider (local veya s3)
STORAGE_PROVIDER=local

# NextAuth secret (zorunlu)
NEXTAUTH_SECRET=dev-secret

# Port (opsiyonel)
PORT=3000
```

#### Çalıştırma
```bash
npm run dev:nodocker  # Docker'sız hızlı başlatma
npm run diagnose      # ENV ve port durumunu gör
```

### 🔧 Docker Sorun Giderme Komutları

#### Docker Canlılık Testi
```bash
# Docker daemon durumunu kontrol et
time docker info

# Docker Compose ile servisleri başlat
DOCKER_BUILDKIT=0 COMPOSE_HTTP_TIMEOUT=20 docker compose up -d --quiet-pull --no-ansi
```

#### Sorunlu Sistemlerde Konteks Kontrol
```bash
# Docker kontekslerini listele
docker context ls

# Default kontekse geç
docker context use default
```

#### Temizlik (Dikkatli Kullanın!)
```bash
# Tüm kullanılmayan Docker kaynaklarını sil (uyarı: geri alınamaz!)
docker system prune -af

# Sadece kullanılmayan container'ları sil
docker container prune -f

# Sadece kullanılmayan image'ları sil
docker image prune -f

# Sadece kullanılmayan volume'ları sil
docker volume prune -f
```

### 📋 Detaylı Kurulum Adımları

Docker kullanmak istemiyorsanız, aşağıdaki adımları takip ederek yerel servisleri kurabilirsiniz:

### 1. PostgreSQL Kurulumu

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-client-15
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Windows (Chocolatey)
choco install postgresql15
```

### 2. Redis Kurulumu

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Windows (Chocolatey)
choco install redis-64
```

### 3. MinIO Kurulumu (Opsiyonel)

```bash
# macOS (Homebrew)
brew install minio/stable/minio
minio server /tmp/minio --console-address ":9001"

# Ubuntu/Debian
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
minio server /tmp/minio --console-address ":9001"

# Windows (Chocolatey)
choco install minio
```

### 4. Veritabanı Oluşturma

```bash
# PostgreSQL'e bağlan
psql -U postgres

# Veritabanı ve kullanıcı oluştur
CREATE DATABASE leexdoc;
CREATE USER app WITH PASSWORD 'app';
GRANT ALL PRIVILEGES ON DATABASE leexdoc TO app;
\q
```

### 5. Environment Variables

`.env` dosyasını düzenleyin:

```env
# Database
DATABASE_URL="postgresql://app:app@localhost:5432/leexdoc"

# Redis
REDIS_URL="redis://localhost:6379"

# Storage (MinIO yoksa local kullanın)
STORAGE_PROVIDER=local
# veya MinIO varsa:
# STORAGE_PROVIDER=s3
# S3_ENDPOINT=http://localhost:9000
# S3_BUCKET=mixora
# S3_ACCESS_KEY=minioadmin
# S3_SECRET_KEY=minioadmin123
# S3_REGION=us-east-1

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 6. Uygulamayı Başlatma

```bash
# Bağımlılıkları yükle
npm install

# Prisma setup
npx prisma generate
npx prisma db push
npx prisma seed

# Admin kullanıcı oluştur
node scripts/create-admin.js

# Development server başlat
npm run dev
```

### 7. Sorun Giderme

**PostgreSQL bağlantı hatası:**
```bash
# PostgreSQL servisini kontrol et
brew services list | grep postgresql
# veya
sudo systemctl status postgresql

# Port kontrolü
lsof -i :5432
```

**Redis bağlantı hatası:**
```bash
# Redis servisini kontrol et
brew services list | grep redis
# veya
sudo systemctl status redis-server

# Port kontrolü
lsof -i :6379
```

**MinIO bağlantı hatası:**
```bash
# MinIO çalışıyor mu kontrol et
curl http://localhost:9000/minio/health/live
```

## 🐳 Docker Deployment

### Development Mode

```bash
# Start development environment
docker compose --profile dev up -d

# View logs
docker compose --profile dev logs -f
```

### Production Mode

```bash
# Build and start production environment
docker compose --profile prod up -d

# View logs
docker compose --profile prod logs -f
```

### Production Commands

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm worker           # Start transcoding worker

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:seed      # Seed database

# Testing
pnpm test             # Run unit tests
pnpm test:ui          # Run tests with UI
pnpm test:e2e         # Run E2E tests
pnpm test:all         # Run all tests

# Linting
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript checks
```

### Project Structure

```
leexdoc/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   │   ├── audio-processing/ # Audio processing utilities
│   │   ├── security/        # Security utilities
│   │   └── storage/         # Storage providers
│   ├── test/               # Test utilities and helpers
│   └── worker/             # Background workers
├── prisma/                 # Database schema and migrations
├── tests/                  # E2E tests
├── scripts/                # Utility scripts
├── public/                 # Static assets
└── docker-compose.yml      # Docker services
```

## 🔧 Configuration

### Storage Providers

#### Local Storage (Development)
```env
STORAGE_PROVIDER="local"
```

#### S3/MinIO (Production)
```env
STORAGE_PROVIDER="s3"
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="mixora"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_REGION="us-east-1"
```

### Audio Processing

The application supports automatic audio processing with:
- **EBU R128 Normalization** - Consistent loudness levels
- **Multiple Quality Options** - 128kbps and 320kbps MP3
- **Waveform Generation** - Interactive waveform visualization
- **Metadata Extraction** - Title, artist, album, BPM, duration
- **Cover Art Extraction** - Automatic album cover detection

### Security Features

- **File Validation** - MIME type and extension whitelisting
- **Size Limits** - 512MB per file, 2GB total per upload
- **Rate Limiting** - Redis-based sliding window rate limiting
- **CSRF Protection** - NextAuth session-based protection
- **XSS Protection** - Comprehensive CSP headers
- **Input Sanitization** - All user inputs are sanitized

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/lib/storage/__tests__/file-validation.test.ts
```

### E2E Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run in headed mode
pnpm test:e2e:headed
```

### Test Coverage
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: Complete API coverage
- **E2E Tests**: Full user journey coverage

## 📊 Monitoring

### Health Checks

All services include health checks:
- **Application**: `GET /api/health`
- **Database**: PostgreSQL connection check
- **Redis**: Redis ping check
- **MinIO**: MinIO health endpoint

### Logging

Comprehensive logging system with:
- **Request Logging** - All API requests with unique IDs
- **Security Events** - Rate limiting, CSRF, admin access
- **Error Tracking** - Detailed error logging with stack traces
- **Performance Metrics** - Request duration and resource usage

## 🔒 Security

### Authentication
- **JWT Tokens** - Secure session management
- **Argon2 Hashing** - Industry-standard password hashing
- **Session Management** - Secure session handling

### File Upload Security
- **MIME Type Validation** - Only audio files allowed
- **File Size Limits** - 512MB per file maximum
- **Extension Whitelisting** - Only allowed audio extensions
- **Malicious File Detection** - Blocks dangerous file patterns

### API Security
- **Rate Limiting** - Per-user and per-IP limits
- **CSRF Protection** - Cross-site request forgery protection
- **Input Validation** - Zod schema validation
- **SQL Injection Prevention** - Prisma ORM protection

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure production database
- [ ] Set up Redis instance
- [ ] Configure S3/MinIO storage
- [ ] Set up SSL certificates
- [ ] Configure domain name
- [ ] Set up monitoring
- [ ] Configure backups

### Environment Variables

Required production environment variables:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
REDIS_URL="redis://host:6379"
STORAGE_PROVIDER="s3"
S3_ENDPOINT="https://your-s3-endpoint.com"
S3_BUCKET="your-bucket-name"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_REGION="your-region"
NEXTAUTH_SECRET="your-strong-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [BullMQ](https://bullmq.io/) - Job queue
- [ffmpeg](https://ffmpeg.org/) - Audio processing

## 📞 Support

For support, email support@leexdoc.com or join our Discord community.

---

**Made with ❤️ by the LeexDoc Team**