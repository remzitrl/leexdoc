# LeexDoc - Document Management System

LeexDoc is a comprehensive document management and storage system built with modern web technologies.

## Project Structure

### Main Directories

```
leexcode/
├── bin/                    # Development and startup scripts
├── prisma/                 # Database schema and migrations
├── public/                 # Static files (icons, manifest, PWA files)
├── scripts/                # System setup and validation scripts
├── source_files/           # Docker and deployment files
└── src/                    # Main application source code
```

### Configuration Files

- `package.json` - Project dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - UI component configuration

### Database (Prisma)

```
prisma/
├── migrations/             # Database migrations
├── schema.prisma          # Database schema
└── seed.ts               # Database seed data
```

**Main Models:**
- `User` - User information
- `Document` - Document metadata
- `Download` - Download status tracking
- `UserSetting` - User preferences
- `PasswordResetToken` - Password reset tokens

### Frontend Structure (src/)

#### Application Pages (app/)
```
app/
├── (auth)/                # Authentication pages
│   ├── forgot-password/
│   └── reset-password/
├── admin/                 # Admin panel
├── api/                   # API endpoints
│   ├── admin/            # Admin APIs
│   ├── auth/             # Authentication APIs
│   ├── documents/        # Document APIs
│   ├── storage/          # Storage APIs
│   └── user/             # User APIs
├── documents/            # Document listing page
├── downloads/            # Downloaded files
├── upload/               # File upload page
├── settings/             # User settings
└── archive/              # Archive page
```

#### Components (components/)
```
components/
├── document-viewer/       # Document viewing components
│   ├── PDFViewer.tsx
│   ├── ImageViewer.tsx
│   ├── VideoPlayer.tsx
│   ├── AudioPlayer.tsx
│   └── TextViewer.tsx
├── layout/               # Layout components
├── offline/              # Offline functionality components
├── upload/               # Upload components
└── ui/                   # Basic UI components
```

#### Libraries (lib/)
```
lib/
├── auth/                 # Authentication
├── hooks/                # React hooks
├── security/             # Security functions
├── storage/              # Storage management
├── offline/              # Offline database
├── audio-processing/     # Audio processing
└── validations/          # Form validations
```

### Development Tools (bin/)

- `start-dev.mjs` - Development server startup
- `diagnose.mjs` - System diagnosis
- `env-validate.mjs` - Environment variable validation
- `load-env.mjs` - Environment variable loading

### System Scripts (scripts/)

- `setup.sh` - System setup
- `init-minio.sh` - MinIO storage setup
- `create-admin.js` - Admin user creation
- `validate-system.js` - System validation

### Features

#### Document Management
- PDF, image, video, audio file support
- Category-based organization
- Tag system
- Search and filtering

#### Security
- JWT-based authentication
- Password reset system
- File security validation
- Rate limiting

#### Storage
- S3-compatible storage (MinIO/AWS S3)
- Local disk storage option
- Thumbnail generation
- File metadata management

#### PWA Support
- Offline functionality
- Service Worker
- App manifest
- Push notifications

#### Media Processing
- Audio file waveform generation
- Video thumbnail extraction
- FFmpeg integration
- Metadata extraction

### Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL, Prisma ORM
- **Storage:** AWS S3 / MinIO
- **Cache:** Redis, BullMQ
- **Authentication:** NextAuth.js
- **PWA:** Next-PWA, Workbox
- **Media Processing:** FFmpeg, Sharp
- **Testing:** Vitest, Playwright

### Dependencies

#### Main Dependencies
- Next.js and React ecosystem
- Prisma ORM and PostgreSQL client
- AWS SDK (S3 integration)
- NextAuth.js (authentication)
- BullMQ (queue management)
- FFmpeg (media processing)

#### UI Libraries
- Radix UI components
- Lucide React (icons)
- React Dropzone (file upload)
- Zustand (state management)

This project is a scalable and secure document management system designed according to modern web development standards.
