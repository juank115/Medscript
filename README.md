<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

# MedScript

**Sistema de prescripciones medicas digitales** con soporte multi-rol (Admin, Medico, Paciente), generacion de PDF con QR, metricas en tiempo real y autenticacion JWT con refresh tokens.

---

## Tabla de contenidos

- [Stack tecnologico](#stack-tecnologico)
- [Arquitectura](#arquitectura)
- [Funcionalidades](#funcionalidades)
- [Modelo de datos](#modelo-de-datos)
- [API Endpoints](#api-endpoints)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Testing](#testing)
- [Deploy](#deploy)
- [Decisiones tecnicas](#decisiones-tecnicas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cuentas de prueba](#cuentas-de-prueba)

---

## Stack tecnologico

| Capa | Tecnologias |
|---|---|
| **Backend** | NestJS 11 &middot; Prisma 5 &middot; PostgreSQL 16 &middot; Passport JWT &middot; Argon2 &middot; PDFKit &middot; QRCode |
| **Frontend** | Next.js 16 (App Router) &middot; React 19 &middot; TypeScript 5 &middot; TailwindCSS 4 &middot; React Query 5 &middot; Zustand 5 &middot; Recharts &middot; React Hook Form + Zod |
| **Testing** | Jest + Supertest (backend) &middot; Vitest + React Testing Library (frontend) |
| **Infra** | Docker Compose (dev) &middot; Railway (API + DB) &middot; Vercel (Frontend) |
| **DX** | pnpm workspaces &middot; ESLint 9 &middot; Prettier &middot; Swagger/OpenAPI |

---

## Arquitectura

```
                    ┌──────────────┐
                    │   Vercel     │
                    │  (Next.js)   │
                    └──────┬───────┘
                           │ HTTPS
                           ▼
                    ┌──────────────┐
                    │   Railway    │
                    │  (NestJS)    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘
```

### Backend — flujo de capas

```
Request → Guards (JWT + Roles) → Controller → Service → PrismaService → DB
                                                  ↑
                                            Ownership validation
```

- **Controllers** orquestan; nunca contienen logica de negocio.
- **Services** validan ownership, aplican reglas de negocio y ejecutan queries.
- **Guards** manejan autenticacion (`JwtAuthGuard`) y autorizacion (`RolesGuard` + `@Roles()`).

### Frontend — estado y data fetching

```
Zustand (auth state) ← persist → localStorage
                                    ↕
React Query (server state) ← apiFetch() → NestJS API
                                    ↑
                              auto-refresh on 401
```

- **Doble proteccion de rutas**: `middleware.ts` (server-side, lee cookie `auth-role`) + layouts por rol (client-side, verifican Zustand).

---

## Funcionalidades

### Medico
- Crear prescripciones con lista dinamica de medicamentos (add/remove items)
- Ver listado de prescripciones propias con filtros (estado, fechas) y paginacion
- Ver detalle de cada prescripcion
- Descargar PDF de prescripciones propias

### Paciente
- Ver prescripciones asignadas con filtros y paginacion
- Marcar prescripciones como consumidas (validacion de ownership + estado `PENDING`)
- Descargar PDF con QR code integrado
- Ver detalle de cada prescripcion

### Administrador
- Dashboard con KPIs: total de medicos, pacientes y prescripciones
- Grafico de barras por estado (pendiente/consumida)
- Grafico de lineas de prescripciones por dia (ultimos 30 dias)
- Ranking de top 5 medicos por prescripciones emitidas
- Listado global de prescripciones con filtros avanzados

### Cross-cutting
- Autenticacion JWT con access token (15 min) + refresh token (7 dias)
- RBAC con guards y decoradores
- PDF generado server-side con PDFKit (header, datos paciente/medico, tabla de items, notas, QR, footer)
- Rate limiting en endpoints de autenticacion
- Skeleton loaders, empty states, error states, toasts
- Sidebar contextual segun rol con logout
- UI responsiva con Apple-inspired design system

---

## Modelo de datos

```prisma
User (id, email, password, name, role, createdAt, updatedAt)
  ├── Doctor (id, userId, specialty?, licenseNumber?)
  │     └── Prescription[] (como author)
  └── Patient (id, userId, dateOfBirth?, phone?)
        └── Prescription[] (como patient)

Prescription (id, code, notes?, status, authorId, patientId, createdAt)
  └── PrescriptionItem[] (id, name, dosage?, quantity?, instructions?)
```

**Indices optimizados:**
- `Prescription(status, createdAt)` — filtros por estado + ordenamiento
- `Prescription(patientId)` — listado del paciente
- `Prescription(authorId)` — listado del medico

---

## API Endpoints

### Autenticacion

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `POST` | `/auth/login` | Publico | Login con email/password. Rate limited (5 req/min) |
| `POST` | `/auth/register` | Publico | Registro de nuevos usuarios |
| `POST` | `/auth/refresh` | Autenticado | Renueva access token con refresh token en body |
| `GET` | `/auth/profile` | Autenticado | Retorna perfil del usuario autenticado |

### Prescripciones

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `POST` | `/prescriptions` | Doctor | Crear prescripcion con items |
| `GET` | `/prescriptions` | Doctor | Listar prescripciones propias (filtros: `status`, `from`, `to`, `page`, `limit`, `order`) |
| `GET` | `/prescriptions/:id` | Doctor (autor) / Paciente (dueno) / Admin | Detalle de prescripcion |
| `GET` | `/prescriptions/:id/pdf` | Doctor (autor) / Paciente (dueno) / Admin | Descargar PDF |
| `PUT` | `/prescriptions/:id/consume` | Paciente (dueno) | Marcar como consumida |
| `GET` | `/me/prescriptions` | Paciente | Listar prescripciones propias |
| `GET` | `/admin/prescriptions` | Admin | Listado global con filtros (`doctorId`, `patientId`, `status`, `from`, `to`) |

### Metricas

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `GET` | `/admin/metrics` | Admin | Dashboard con totals, byStatus, byDay, topDoctors. Acepta `from`/`to` (default: ultimos 30 dias) |

### Usuarios

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `GET` | `/users` | Admin | Listado de todos los usuarios |
| `GET` | `/users/patients` | Admin / Doctor | Listado de pacientes (para selector en form) |

> Swagger disponible en `/docs` (solo en desarrollo).

**Formato de respuesta:**

```json
// Exitosa
{ "data": { ... } }

// Error
{ "message": "...", "code": 400, "details": [...], "path": "/...", "timestamp": "..." }

// Paginada
{ "data": [...], "total": 42, "page": 1, "limit": 10 }
```

---

## Setup local

### Prerequisitos

- **Node.js** 20+
- **pnpm** 8+
- **Docker** (para PostgreSQL local)

### Instalacion

```bash
# 1. Clonar el repositorio
git clone https://github.com/juank115/Medscript.git
cd Medscript

# 2. Instalar dependencias
pnpm install

# 3. Levantar PostgreSQL con Docker
docker-compose up -d

# 4. Configurar variables de entorno del backend
cd apps/api
cp .env.example .env
# El .env default apunta al Docker local — listo para usar

# 5. Ejecutar migraciones y seed
npx prisma migrate dev --name init
npx prisma db seed

# 6. Iniciar el backend (puerto 3001)
pnpm start:dev

# 7. En otra terminal — configurar y levantar el frontend
cd apps/web
cp .env.local.example .env.local
# Editar NEXT_PUBLIC_API_URL si es necesario (default: http://localhost:3001)
pnpm dev
```

Abrir **http://localhost:3000** y usar las cuentas de prueba para explorar.

---

## Variables de entorno

### Backend (`apps/api/.env`)

| Variable | Descripcion | Default |
|---|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://postgres:postgres@localhost:5432/plataforma_medica` |
| `JWT_SECRET` | Secret para access tokens | - |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens | - |
| `JWT_EXPIRES_IN` | TTL del access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | TTL del refresh token | `7d` |
| `APP_ORIGIN` | URL del frontend (CORS) | `http://localhost:3000` |
| `PORT` | Puerto del servidor | `3001` |

### Frontend (`apps/web/.env.local`)

| Variable | Descripcion | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base de la API | `http://localhost:3001` |

---

## Testing

### Comandos

```bash
# Backend — unit tests (Jest)
pnpm --filter api test

# Backend — un test especifico
pnpm --filter api test -- --testPathPattern=auth.service

# Backend — E2E tests (Supertest, requiere DB)
pnpm --filter api test:e2e

# Backend — coverage
pnpm --filter api test:cov

# Frontend — unit tests (Vitest + Testing Library)
pnpm --filter web test

# Frontend — modo watch
pnpm --filter web test:watch
```

### Cobertura de tests

| Capa | Archivo | Tests |
|---|---|---|
| Backend unit | `auth.service.spec.ts` | Login valido/invalido, registro duplicado, profile sin password |
| Backend unit | `prescriptions.service.spec.ts` | Crear prescripcion, ownership, consumir, ya consumida, assertFullAccess |
| Backend E2E | `auth.e2e-spec.ts` | Login 401, validacion 400, ruta protegida sin token, 403 con rol incorrecto |
| Frontend unit | `auth-store.test.ts` | Estado inicial, setAuth, reemplazo, logout |
| Frontend unit | `ItemsArray.test.tsx` | Render default, sin boton eliminar con 1 item, agregar item, eliminar item |

**Total: 23 tests** (14 backend + 9 frontend)

---

## Deploy

### Railway (Backend + PostgreSQL)

1. Crear proyecto en Railway con servicio PostgreSQL.
2. Agregar servicio desde GitHub (`apps/api` como root directory).
3. Configurar variables de entorno:
   - `DATABASE_URL` (provista automaticamente por Railway)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` (generar valores seguros)
   - `APP_ORIGIN` (URL de Vercel, e.g. `https://medscript.vercel.app`)
   - `NODE_ENV=production`
4. Build command: `pnpm install && pnpm --filter api build`
5. Start command: `pnpm --filter api start:prod`
6. Release command: `npx prisma migrate deploy && npx prisma db seed`

### Vercel (Frontend)

1. Importar repositorio en Vercel.
2. Root directory: `apps/web`
3. Framework: Next.js (autodetectado)
4. Variable de entorno: `NEXT_PUBLIC_API_URL` = URL de Railway

---

## Decisiones tecnicas

| Decision | Justificacion |
|---|---|
| **JWT access (15m) + refresh (7d) en body** | Seguridad: tokens de corta vida limitan la ventana de ataque. Refresh en body para compatibilidad con Next.js App Router (middleware no puede leer cookies httpOnly cross-origin). Trade-off documentado |
| **RBAC con `@Roles()` + `RolesGuard`** | Patron estandar de NestJS. Minima configuracion, facil de auditar. El guard lee `request.user.role` inyectado por `JwtStrategy` |
| **Ownership en service, no en controller** | Separacion de responsabilidades. El controller orquesta; el service valida que el recurso pertenezca al usuario. Previene bypasses si se agrega otro controller |
| **`ValidationPipe` global con `whitelist` + `forbidNonWhitelisted`** | Sanitiza automaticamente payloads extras. `class-validator` + `class-transformer` con DTOs tipados en cada endpoint |
| **`HttpExceptionFilter` global** | Shape consistente `{message, code, details, path, timestamp}` en todas las respuestas de error. Facilita el manejo en el frontend |
| **`TransformInterceptor` global** | Envuelve todas las respuestas exitosas en `{data: ...}`. Facilita la deserializacion uniforme en el cliente |
| **PDFKit sin Chromium** | Mas liviano que Puppeteer en Railway free-tier. Usa fuentes built-in (Helvetica) para evitar problemas con fonts del sistema |
| **QR code en PDF** | `qrcode` genera un QR que apunta a la prescripcion en el frontend. Bajo esfuerzo, alto impacto visual |
| **React Query + Zustand** | React Query maneja cache, loading, error y revalidacion del server state. Zustand maneja solo auth (ligero, sin boilerplate de Redux) |
| **React Hook Form + Zod** | Validacion tipada end-to-end. `useFieldArray` para la lista dinamica de medicamentos |
| **`nanoid` para codigo `RX-XXXXXXXX`** | Colisiones practicamente imposibles, URL-friendly, mas corto que UUID |
| **Indices en `(status, createdAt)`, `(patientId)`, `(authorId)`** | Optimizan los 3 queries mas frecuentes: filtrar por estado, listar por paciente, listar por medico |
| **Cookie `auth-role` para middleware** | Next.js middleware (server-side) no puede acceder a localStorage. Una cookie no-httpOnly con el rol permite proteger rutas server-side sin comprometer los tokens |
| **Rate limiting con `@nestjs/throttler`** | 5 requests/minuto en login para mitigar brute-force. Limite global de 20 req/min como safety net |
| **Helmet + CORS estricto** | Helmet agrega headers de seguridad. CORS restringido a `APP_ORIGIN` con metodos y headers explicitos |
| **Swagger condicional** | Solo disponible cuando `NODE_ENV !== 'production'` para no exponer la superficie de API en produccion |
| **Argon2 para hashing** | Mas resistente a ataques GPU que bcrypt. Memory-hard por defecto |

---

## Estructura del proyecto

```
MedScript/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Modelo de datos + indices
│   │   │   ├── seed.ts               # Datos de prueba
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── main.ts               # Bootstrap: Swagger, Helmet, CORS, pipes
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.service.spec.ts
│   │   │   │   ├── dto/              # LoginDto, RegisterDto
│   │   │   │   ├── strategies/       # JwtStrategy, RefreshStrategy
│   │   │   │   ├── guards/           # JwtAuthGuard, RolesGuard
│   │   │   │   └── decorators/       # @Roles(), @CurrentUser()
│   │   │   ├── prescriptions/
│   │   │   │   ├── prescriptions.controller.ts
│   │   │   │   ├── prescriptions.service.ts
│   │   │   │   ├── prescriptions.service.spec.ts
│   │   │   │   ├── pdf.service.ts    # Generacion PDF + QR
│   │   │   │   └── dto/              # CreatePrescriptionDto, QueryDto
│   │   │   ├── metrics/
│   │   │   │   ├── metrics.controller.ts
│   │   │   │   └── metrics.service.ts
│   │   │   ├── users/
│   │   │   │   └── users.controller.ts
│   │   │   ├── common/
│   │   │   │   ├── filters/          # HttpExceptionFilter
│   │   │   │   └── interceptors/     # TransformInterceptor
│   │   │   └── prisma/               # PrismaService + PrismaModule (@Global)
│   │   └── test/
│   │       └── auth.e2e-spec.ts
│   │
│   └── web/                          # Next.js frontend
│       ├── app/
│       │   ├── layout.tsx            # Root layout + providers
│       │   ├── login/page.tsx        # Login con RHF + Zod
│       │   ├── demo/page.tsx         # Modo demo sin backend
│       │   ├── doctor/
│       │   │   ├── layout.tsx        # Role guard (DOCTOR)
│       │   │   └── prescriptions/
│       │   │       ├── page.tsx       # Listado con filtros + paginacion
│       │   │       ├── new/page.tsx   # Crear prescripcion
│       │   │       └── [id]/page.tsx  # Detalle read-only
│       │   ├── patient/
│       │   │   ├── layout.tsx        # Role guard (PATIENT)
│       │   │   └── prescriptions/
│       │   │       ├── page.tsx       # Listado + consumir + PDF
│       │   │       └── [id]/page.tsx  # Detalle + acciones
│       │   └── admin/
│       │       ├── layout.tsx        # Role guard (ADMIN)
│       │       ├── page.tsx          # Dashboard (KPIs + charts)
│       │       └── prescriptions/
│       │           └── page.tsx       # Listado global
│       ├── components/
│       │   ├── layout/               # DashboardLayout, Sidebar
│       │   ├── ui/                   # Badge, Skeleton
│       │   └── prescriptions/        # ItemsArray
│       ├── lib/
│       │   ├── api.ts               # apiFetch con auto-refresh
│       │   └── queries/             # React Query hooks por dominio
│       ├── store/
│       │   └── auth-store.ts        # Zustand persistido
│       ├── middleware.ts            # Proteccion de rutas server-side
│       └── __tests__/              # Vitest tests
│           ├── auth-store.test.ts
│           └── ItemsArray.test.tsx
│
├── docker-compose.yml               # PostgreSQL 16 local
├── package.json                     # pnpm workspace root
└── pnpm-workspace.yaml
```

---

## Cuentas de prueba

El seed crea automaticamente las siguientes cuentas con 8 prescripciones de ejemplo (mezcla de `PENDING` y `CONSUMED`):

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@test.com` | `admin123` |
| Medico | `dr@test.com` | `dr1234` |
| Medico | `dr2@test.com` | `dr1234` |
| Paciente | `patient@test.com` | `patient123` |
| Paciente | `patient2@test.com` | `patient123` |

```bash
# Resetear la DB y volver a sembrar datos
pnpm --filter api db:reset
```

---

## Seguridad

- Passwords hasheados con **Argon2** (memory-hard)
- **Rate limiting**: 5 req/min en login, 20 req/min global
- **Helmet** para headers de seguridad
- **CORS** restringido a origen del frontend
- **Ownership validation** en service layer con DB lookups reales
- **ValidationPipe** con `whitelist` + `forbidNonWhitelisted` (sanitiza payloads)
- **Swagger deshabilitado** en produccion
- **Cookie `SameSite=Lax`** + `Secure` condicional en HTTPS
- **Paginacion acotada** (`limit` maximo 100) para prevenir abuso

---

## Licencia

Este proyecto fue desarrollado como prueba tecnica full-stack.
