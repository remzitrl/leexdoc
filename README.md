# LeexDoc - Doküman Yönetim Sistemi

LeexDoc, modern web teknolojileri kullanılarak geliştirilmiş kapsamlı bir doküman yönetim ve depolama sistemidir.

## Proje Yapısı

### 📁 Ana Dizinler

```
leexcode/
├── bin/                    # Geliştirme ve başlatma scriptleri
├── prisma/                 # Veritabanı şeması ve migrasyonları
├── public/                 # Statik dosyalar (ikonlar, manifest, PWA dosyaları)
├── scripts/                # Sistem kurulum ve doğrulama scriptleri
├── source_files/           # Docker ve deployment dosyaları
└── src/                    # Ana uygulama kaynak kodu
```

### 🔧 Konfigürasyon Dosyaları

- `package.json` - Proje bağımlılıkları ve scriptler
- `next.config.ts` - Next.js konfigürasyonu
- `tsconfig.json` - TypeScript konfigürasyonu
- `eslint.config.mjs` - ESLint kuralları
- `postcss.config.mjs` - PostCSS konfigürasyonu
- `components.json` - UI bileşen konfigürasyonu

### 🗄️ Veritabanı (Prisma)

```
prisma/
├── migrations/             # Veritabanı migrasyonları
├── schema.prisma          # Veritabanı şeması
└── seed.ts               # Veritabanı seed verileri
```

**Ana Modeller:**
- `User` - Kullanıcı bilgileri
- `Document` - Doküman metadata'sı
- `Download` - İndirme durumu takibi
- `UserSetting` - Kullanıcı tercihleri
- `PasswordResetToken` - Şifre sıfırlama tokenları

### 🎨 Frontend Yapısı (src/)

#### 📱 Uygulama Sayfaları (app/)
```
app/
├── (auth)/                # Kimlik doğrulama sayfaları
│   ├── forgot-password/
│   └── reset-password/
├── admin/                 # Admin paneli
├── api/                   # API endpoint'leri
│   ├── admin/            # Admin API'leri
│   ├── auth/             # Kimlik doğrulama API'leri
│   ├── documents/        # Doküman API'leri
│   ├── storage/          # Depolama API'leri
│   └── user/             # Kullanıcı API'leri
├── documents/            # Doküman listesi sayfası
├── downloads/            # İndirilen dosyalar
├── upload/               # Dosya yükleme sayfası
├── settings/             # Kullanıcı ayarları
└── archive/              # Arşiv sayfası
```

#### 🧩 Bileşenler (components/)
```
components/
├── document-viewer/       # Doküman görüntüleme bileşenleri
│   ├── PDFViewer.tsx
│   ├── ImageViewer.tsx
│   ├── VideoPlayer.tsx
│   ├── AudioPlayer.tsx
│   └── TextViewer.tsx
├── layout/               # Layout bileşenleri
├── offline/              # Offline çalışma bileşenleri
├── upload/               # Yükleme bileşenleri
└── ui/                   # Temel UI bileşenleri
```

#### 🔧 Kütüphaneler (lib/)
```
lib/
├── auth/                 # Kimlik doğrulama
├── hooks/                # React hook'ları
├── security/             # Güvenlik fonksiyonları
├── storage/              # Depolama yönetimi
├── offline/              # Offline veritabanı
├── audio-processing/     # Ses işleme
└── validations/          # Form validasyonları
```

### 🚀 Geliştirme Araçları (bin/)

- `start-dev.mjs` - Geliştirme sunucusu başlatma
- `diagnose.mjs` - Sistem teşhisi
- `env-validate.mjs` - Ortam değişkeni doğrulama
- `load-env.mjs` - Ortam değişkeni yükleme

### 📜 Sistem Scriptleri (scripts/)

- `setup.sh` - Sistem kurulumu
- `init-minio.sh` - MinIO depolama kurulumu
- `create-admin.js` - Admin kullanıcı oluşturma
- `validate-system.js` - Sistem doğrulama

### 🎯 Özellikler

#### 📄 Doküman Yönetimi
- PDF, resim, video, ses dosyası desteği
- Kategori bazlı organizasyon
- Etiket sistemi
- Arama ve filtreleme

#### 🔐 Güvenlik
- JWT tabanlı kimlik doğrulama
- Şifre sıfırlama sistemi
- Dosya güvenlik validasyonu
- Rate limiting

#### 💾 Depolama
- S3 uyumlu depolama (MinIO/AWS S3)
- Yerel disk depolama seçeneği
- Thumbnail oluşturma
- Dosya metadata yönetimi

#### 📱 PWA Desteği
- Offline çalışma
- Service Worker
- App manifest
- Push bildirimleri

#### 🎵 Medya İşleme
- Ses dosyası waveform oluşturma
- Video thumbnail çıkarma
- FFmpeg entegrasyonu
- Metadata çıkarma

### 🛠️ Teknoloji Stack'i

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Backend:** Next.js API Routes
- **Veritabanı:** PostgreSQL, Prisma ORM
- **Depolama:** AWS S3 / MinIO
- **Cache:** Redis, BullMQ
- **Kimlik Doğrulama:** NextAuth.js
- **PWA:** Next-PWA, Workbox
- **Medya İşleme:** FFmpeg, Sharp
- **Test:** Vitest, Playwright

### 📦 Bağımlılıklar

#### Ana Bağımlılıklar
- Next.js ve React ekosistemi
- Prisma ORM ve PostgreSQL client
- AWS SDK (S3 entegrasyonu)
- NextAuth.js (kimlik doğrulama)
- BullMQ (kuyruk yönetimi)
- FFmpeg (medya işleme)

#### UI Kütüphaneleri
- Radix UI bileşenleri
- Lucide React (ikonlar)
- React Dropzone (dosya yükleme)
- Zustand (state yönetimi)

Bu proje, modern web geliştirme standartlarına uygun olarak tasarlanmış, ölçeklenebilir ve güvenli bir doküman yönetim sistemidir.
