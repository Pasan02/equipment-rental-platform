# 🏗️ Equipment Rental Management Platform

An enterprise-grade equipment rental management system built as a full-stack monorepo — featuring a NestJS REST API, Next.js admin dashboard, and Flutter mobile application.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Docker Deployment](#-docker-deployment)
- [API Documentation](#-api-documentation)
- [Mobile App](#-mobile-app)
- [Testing](#-testing)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Default Credentials](#-default-credentials)
- [Documentation](#-documentation)

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 20, NestJS 11, TypeScript 5, Prisma 6 ORM |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 3 |
| **Mobile** | Flutter 3 (Dart), BLoC pattern, GoRouter, Dio |
| **Database** | PostgreSQL 16 |
| **Cache / Queue** | Redis 7, BullMQ |
| **Authentication** | JWT (Access + Refresh tokens), RBAC (4 roles) |
| **File Storage** | AWS S3 / Cloudflare R2 (presigned URL uploads) |
| **Email** | Nodemailer (SMTP) via BullMQ async queue |
| **API Docs** | Swagger / OpenAPI 3.0 (auto-generated) |
| **Build System** | Turborepo (npm workspaces) |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI/CD |

---

## 🏛 Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                      Clients                              │
│                                                           │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │  Next.js Web │  │ Flutter App  │  │   Postman /  │   │
│   │  (Port 3001) │  │ (Android/iOS)│  │   Swagger    │   │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│          │                 │                 │            │
└──────────┼─────────────────┼─────────────────┼────────────┘
           │      HTTPS / REST API             │
           └─────────────┬─────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   NestJS API        │
              │   (Port 3000)       │
              │   /api/v1/*         │
              └───┬────────────┬────┘
                  │            │
         ┌────────▼──┐   ┌────▼────────┐
         │ PostgreSQL │   │   Redis 7   │
         │    16      │   │  (BullMQ)   │
         │ (Port 5432)│   │ (Port 6379) │
         └────────────┘   └─────────────┘
```

**User Roles:**
- **Admin** — Full platform control, user management, dashboard analytics
- **Staff** — Reservation approvals, equipment pickup/return processing
- **Customer** — Browse equipment, make reservations, view history
- **Warehouse** — Inventory operations (receive, release, damage, maintenance)

---

## 📁 Project Structure

```
equipment-rental-platform/
├── apps/
│   ├── api/                      # NestJS Backend (REST API)
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema (12 tables, 8 enums)
│   │   │   ├── migrations/       # PostgreSQL migration files
│   │   │   └── seed.ts           # Database seed script
│   │   └── src/
│   │       ├── common/           # Guards, filters, interceptors, pipes, decorators
│   │       ├── config/           # Environment configuration & validation
│   │       ├── modules/          # Feature modules (11 modules)
│   │       │   ├── auth/         # JWT login, register, refresh, forgot/reset password
│   │       │   ├── users/        # User CRUD, role management
│   │       │   ├── categories/   # Equipment category CRUD
│   │       │   ├── equipment/    # Equipment CRUD, QR code generation
│   │       │   ├── reservations/ # Full reservation lifecycle (6 statuses)
│   │       │   ├── payments/     # Mock payment workflow (4 statuses)
│   │       │   ├── inventory/    # Warehouse stock operations
│   │       │   ├── notifications/# In-app + email notifications via BullMQ
│   │       │   ├── uploads/      # S3/R2 presigned URL file uploads
│   │       │   ├── dashboard/    # Admin analytics (KPIs, trends, top items)
│   │       │   └── activity-logs/# Audit logging
│   │       └── main.ts           # Application entry point
│   │
│   ├── web/                      # Next.js Frontend (Admin Dashboard)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/       # Login, Register, Forgot/Reset Password
│   │       │   └── (dashboard)/  # Dashboard, Equipment, Reservations,
│   │       │                     # Customers, Inventory, Payments, Settings
│   │       ├── components/       # Reusable UI components (layout + ui)
│   │       ├── lib/              # API client (Axios), utilities
│   │       ├── stores/           # Zustand auth state management
│   │       └── middleware.ts     # Auth route protection
│   │
│   └── mobile/                   # Flutter Mobile App
│       └── lib/
│           ├── core/             # Theme, router, constants, config
│           ├── data/             # Datasources (Dio HTTP), models
│           ├── domain/           # Entities, use cases, repository interfaces
│           └── presentation/     # BLoCs, screens, widgets
│               ├── screens/
│               │   ├── auth/         # Login screen
│               │   ├── equipment/    # Catalog list + detail
│               │   ├── reservation/  # Create, list, detail
│               │   ├── notification/ # Notification center
│               │   ├── staff/        # Pending queue, approval, QR scanner
│               │   └── home/         # Dashboard home
│               └── blocs/        # Auth, Equipment, Reservation, Notification
│
├── packages/
│   └── shared-types/             # Shared TypeScript interfaces & enums
│
├── docker/
│   ├── Dockerfile.api            # Multi-stage NestJS production image
│   ├── Dockerfile.web            # Multi-stage Next.js production image
│   ├── docker-compose.yml        # Development compose (builds from source)
│   └── docker-compose.prod.yml   # Production compose (pulls from Docker Hub)
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # Lint → Typecheck → Test (on PRs)
│       └── deploy.yml            # Build → Push Docker Hub → Deploy (on push to main)
│
├── docs/
│   ├── api-specification.md      # Complete REST API specification
│   ├── database-design.md        # ER diagram + schema documentation
│   ├── user-stories.md           # 40+ user stories across 12 epics
│   ├── requirements-traceability-matrix.md  # 135 requirements mapped
│   ├── implementation_plan.md    # Phase-by-phase implementation plan
│   ├── iteration_status.md       # Detailed iteration execution log
│   └── postman/
│       ├── collection.json       # Postman Collection v2.1.0 (35+ endpoints)
│       └── environment.json      # Postman environment variables
│
├── docker-compose.yml            # Root-level compose for full-stack deployment
├── turbo.json                    # Turborepo build pipeline configuration
├── .env.example                  # Environment variable template
└── requirement.txt               # Original assessment requirements
```

---

## ✅ Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | >= 20.x | Backend + Frontend runtime |
| **npm** | >= 10.x | Package management |
| **Docker** & **Docker Compose** | Latest | Containerized services (PostgreSQL, Redis) |
| **Flutter SDK** | >= 3.9.x | Mobile app development |
| **Git** | Latest | Version control |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Pasan02/equipment-rental-platform.git
cd equipment-rental-platform
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure your database, Redis, JWT secrets, storage, and SMTP credentials. See [Environment Variables](#-environment-variables) below.

### 3. Start Infrastructure Services (PostgreSQL + Redis)

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate --schema=apps/api/prisma/schema.prisma

# Apply database migrations
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Seed default data (admin, staff, customer, warehouse users + sample categories & equipment)
npx prisma db seed --schema=apps/api/prisma/schema.prisma
```

### 6. Run Development Servers

```bash
# Start both API (port 3000) and Web (port 3001) concurrently
npm run dev
```

- **API Server**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs
- **Web Dashboard**: http://localhost:3001

### 7. Run Flutter Mobile App

```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API server port | `3000` |
| `WEB_PORT` | Web app port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/equipment_rental_db?schema=public` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `JWT_SECRET` | Access token signing secret | *(change in production)* |
| `JWT_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | *(change in production)* |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |
| `STORAGE_ENDPOINT` | S3/R2 endpoint URL | — |
| `STORAGE_ACCESS_KEY_ID` | S3/R2 access key | — |
| `STORAGE_SECRET_ACCESS_KEY` | S3/R2 secret key | — |
| `STORAGE_BUCKET_NAME` | S3/R2 bucket name | — |
| `STORAGE_PUBLIC_URL` | Public URL for uploaded files | — |
| `SMTP_HOST` | SMTP mail server host | — |
| `SMTP_PORT` | SMTP mail server port | `2525` |
| `SMTP_USER` | SMTP authentication user | — |
| `SMTP_PASS` | SMTP authentication password | — |
| `SMTP_FROM` | Sender email address | — |

---

## 🐳 Docker Deployment

### Development (Build from Source)

```bash
docker compose up --build
```

This builds and starts all 4 services: `postgres`, `redis`, `api`, `web`.

### Production (Pull from Docker Hub)

On your cloud server (AWS EC2, Azure VM, GCP, VPS):

```bash
# Set your Docker Hub username
export DOCKERHUB_USERNAME=yourdockerhub

# Pull and launch production containers
docker compose -f docker/docker-compose.prod.yml pull
docker compose -f docker/docker-compose.prod.yml up -d

# Run database migrations
docker compose -f docker/docker-compose.prod.yml exec -T api npx prisma migrate deploy
```

---

## 📚 API Documentation

### Swagger UI (Interactive)

Start the API server and open: **http://localhost:3000/api/docs**

### Postman Collection

Import the collection and environment into Postman:

1. **Collection**: `docs/postman/collection.json`
2. **Environment**: `docs/postman/environment.json`

The Login request automatically captures JWT tokens for use across all authenticated endpoints.

### API Modules

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 7 | Register, Login, Refresh, Logout, Forgot/Reset Password, Profile |
| Users | 4 | List, Get, Update, Role Management |
| Categories | 5 | CRUD operations for equipment categories |
| Equipment | 5 | CRUD + QR code generation |
| Reservations | 8 | Create, List, Detail, Approve, Reject, Activate, Return, Cancel |
| Payments | 3 | Create payment, List, Refund |
| Inventory | 2 | Log operations, List audit trail |
| Notifications | 3 | List, Mark read, Mark all read |
| Uploads | 1 | Generate presigned S3/R2 upload URL |
| Dashboard | 3 | KPI stats, Most rented, Reservation trends |
| Activity Logs | 1 | Audit log list |

---

## 📱 Mobile App

The Flutter mobile app (`apps/mobile/`) supports two user flows:

**Customer Flow:**
- Login → Browse equipment catalog → View equipment detail → Reserve equipment → View reservations → View notifications

**Staff Flow:**
- Login → View pending reservations → Approve/Reject → Scan equipment QR code → Activate pickup → Process return

**Architecture:** Clean Architecture + BLoC state management + GoRouter navigation

**Build APK:**
```bash
cd apps/mobile
flutter build apk --release
```

---

## 🧪 Testing

### API Unit Tests

```bash
# Run all API unit tests
npm run test --workspace=api

# Run with coverage
npm run test:cov --workspace=api
```

Unit test files exist for all 11 service modules (`*.service.spec.ts`).

### Build Verification

```bash
# Build all workspace packages (shared-types, api, web)
npm run build
```

---

## ⚙️ CI/CD Pipeline

### Continuous Integration (`ci.yml`)

Triggered on **pull requests** to `main`/`master`:

1. Checkout code
2. Setup Node.js 20 + dependency cache
3. Install dependencies (`npm ci`)
4. Generate Prisma client
5. Lint (`npm run lint`)
6. Build all packages (`npm run build`)
7. Run API unit tests

### Continuous Deployment (`deploy.yml`)

Triggered on **push to main**:

1. Build multi-stage Docker images for API and Web
2. Push tagged images to Docker Hub (`:latest` + `:sha-xxxxxx`)
3. SSH into cloud host
4. Pull latest images and restart containers
5. Run database migrations

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub account username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key |
| `DEPLOY_PASSPHRASE` | SSH key passphrase (optional) |

---

## 🔑 Default Credentials

The seed script creates the following test accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@rental.com` | `Admin@123` |
| **Staff** | `staff@rental.com` | `Staff@123` |
| **Customer** | `customer@rental.com` | `Customer@123` |
| **Warehouse** | `warehouse@rental.com` | `Warehouse@123` |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [API Specification](docs/api-specification.md) | Complete REST API endpoint specification |
| [Database Design](docs/database-design.md) | ER diagram, schema, indexes, and constraints |
| [User Stories](docs/user-stories.md) | 40+ user stories across 12 epics |
| [Requirements Traceability Matrix](docs/requirements-traceability-matrix.md) | 135 requirements mapped to implementation |
| [Implementation Plan](docs/implementation_plan.md) | 7-phase implementation plan |
| [Postman Collection](docs/postman/collection.json) | Importable Postman collection (35+ endpoints) |

---

