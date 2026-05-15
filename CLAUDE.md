# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo structure

pnpm workspace con dos aplicaciones:
- `apps/api` — NestJS backend (puerto 3001)
- `apps/web` — Next.js 16 frontend (puerto 3000)

## Comandos esenciales

### Backend (`apps/api`)
```bash
pnpm --filter api start:dev       # Dev con hot reload
pnpm --filter api build           # Compilar
pnpm --filter api test            # Unit tests (Jest)
pnpm --filter api test:e2e        # E2E tests (Supertest)
pnpm --filter api test:watch      # Tests en modo watch
pnpm --filter api lint            # ESLint + fix

# Prisma
pnpm --filter api prisma:migrate  # prisma migrate dev
pnpm --filter api prisma:seed     # Ejecutar seed
pnpm --filter api db:reset        # Reset completo + seed
npx prisma generate               # Regenerar cliente (desde apps/api)
```

### Frontend (`apps/web`)
```bash
pnpm --filter web dev             # Dev server
pnpm --filter web build           # Build producción
```

### Raíz del monorepo
```bash
docker-compose up -d              # PostgreSQL local en puerto 5432
pnpm install                      # Instalar todas las dependencias
```

### Correr un test individual
```bash
# Desde apps/api:
pnpm test -- --testPathPattern=auth.service
pnpm test -- --testNamePattern="login"
```

## Arquitectura backend (NestJS)

### Flujo de capas
`Controller` → `Service` → `PrismaService` (nunca saltar capas)

La **lógica de ownership** vive en el service, nunca en el controller. Patrón: el controller llama primero a `assertFullAccess(id, user)` antes de operar sobre un recurso.

### Módulos
- `auth/` — JWT (access 15m + refresh 7d), guards, estrategias Passport, decoradores `@Roles()` y `@CurrentUser()`
- `prescriptions/` — CRUD de prescripciones + `PdfService` (pdfkit + QR)
- `metrics/` — queries agregadas con `groupBy` y `$queryRaw` de Prisma, solo ADMIN
- `users/` — endpoints de listado para admin y médicos
- `common/` — `HttpExceptionFilter` (shape `{message, code, details, path, timestamp}`) y `TransformInterceptor` (envuelve respuestas en `{data: ...}`)
- `prisma/` — `PrismaService` global exportado via `PrismaModule` (`@Global()`)

### Auth y RBAC
- `JwtAuthGuard` + `RolesGuard` se aplican por endpoint con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.DOCTOR)`
- El token va en header `Authorization: Bearer <token>`
- El refresh token va en el body `{ refreshToken }` al `POST /auth/refresh`
- `@CurrentUser()` extrae `request.user` (el `User` completo de Prisma, sin password)

### Prisma
- Versión **5.22.0** (no v7 — tiene breaking changes incompatibles con este proyecto)
- Enums `Role` y `PrescriptionStatus` se importan de `@prisma/client`
- Tipos en parámetros de métodos decorados con `import type { User } from '@prisma/client'` (requerido por `isolatedModules` + `emitDecoratorMetadata`)
- `nanoid` v5 es ESM-only: en specs de Jest se debe mockear con `jest.mock('nanoid', () => ({ nanoid: () => 'TEST' }))` al inicio del archivo

### Variables de entorno (`apps/api/.env`)
`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `APP_ORIGIN`, `PORT`

## Arquitectura frontend (Next.js App Router)

### Estado global
- `store/auth-store.ts` — Zustand persistido en localStorage: `user`, `accessToken`, `refreshToken`
- El rol del usuario también se escribe en cookie `auth-role` para que el middleware de Next.js pueda leerlo (localStorage no es accesible en server-side)

### Cliente HTTP (`lib/api.ts`)
`apiFetch<T>(path, options)` — wrapper sobre `fetch` que:
1. Agrega `Authorization: Bearer` automáticamente
2. Si recibe 401, llama a `/auth/refresh` una vez y reintenta
3. Desenvuelve `json.data ?? json` (por el `TransformInterceptor`)

Usar `apiUrl(path)` para construir URLs absolutas cuando se necesita hacer fetch nativo (ej: descarga de PDF con `r.blob()`).

### Data fetching
React Query hooks en `lib/queries/` — un archivo por dominio (`prescriptions.ts`, `metrics.ts`). Los query keys incluyen los parámetros de filtro para invalidación granular.

### Protección de rutas
Doble capa:
1. `middleware.ts` — lee cookie `auth-role`, redirige si no autenticado o rol incorrecto
2. Layout de cada rol (`app/doctor/layout.tsx`, etc.) — verifica Zustand store client-side y redirige si es necesario

### Respuesta de la API
Todas las respuestas están envueltas en `{ data: ... }` por el `TransformInterceptor`. Los hooks de React Query llaman a `apiFetch` que ya desenvuelve esto. En el login (fetch nativo) acceder con `json.data?.accessToken ?? json.accessToken`.

## Seed y cuentas de prueba

| Rol | Email | Password |
|---|---|---|
| Admin | admin@test.com | admin123 |
| Médico | dr@test.com | dr123 |
| Paciente | patient@test.com | patient123 |

El seed también crea `dr2@test.com` y `patient2@test.com` con las mismas contraseñas para tener datos más ricos.
