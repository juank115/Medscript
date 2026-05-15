# Plataforma Médica — Sistema de Prescripciones

## Stack
- **Backend**: NestJS 11 · Prisma · PostgreSQL · JWT (access 15m + refresh 7d)
- **Frontend**: Next.js (App Router) · TypeScript · TailwindCSS · React Query · Zustand
- **Deploy**: Railway (API + DB) · Vercel (Frontend)

## URLs
- Frontend: `https://<your-app>.vercel.app`
- API: `https://<your-api>.railway.app`
- Swagger: `https://<your-api>.railway.app/docs`

## Cuentas de prueba

| Rol | Email | Password |
|---|---|---|
| Admin | admin@test.com | admin123 |
| Médico | dr@test.com | dr123 |
| Paciente | patient@test.com | patient123 |

## Setup local (< 15 minutos)

### Prerequisitos
- Node.js 20+
- pnpm 8+
- Docker (para PostgreSQL local)

### Pasos

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd plataforma-medica
pnpm install

# 2. Levantar PostgreSQL local
docker-compose up -d

# 3. Configurar variables de entorno del backend
cd apps/api
cp .env.example .env
# Editar .env con tu DATABASE_URL si no usás Docker

# 4. Ejecutar migraciones y seed
pnpm prisma migrate dev --name init
pnpm prisma db seed

# 5. Iniciar backend
pnpm start:dev

# 6. En otra terminal — frontend
cd apps/web
cp .env.local.example .env.local
pnpm dev
```

Abrir http://localhost:3000

## Comandos útiles

```bash
# Backend
pnpm --filter api start:dev       # Dev con hot reload
pnpm --filter api test            # Tests unitarios
pnpm --filter api test:e2e        # Tests e2e
pnpm --filter api db:reset        # Reset + seed

# Frontend
pnpm --filter web dev             # Dev server en :3000
pnpm --filter web build           # Build producción
```

## Decisiones técnicas

| Decisión | Justificación |
|---|---|
| JWT access (15m) + refresh (7d) en body | Seguridad vs. compatibilidad con App Router de Next.js |
| RBAC con `@Roles()` + `RolesGuard` global | Patrón estándar de NestJS, mínima configuración |
| Ownership en el service, no en controller | Separación de responsabilidades; el controller solo orquesta |
| `pdfkit` sin Chromium | Más liviano en Railway free-tier; suficiente para el formato requerido |
| React Query + Zustand | Cache automático + estado de auth ligero, sin Redux boilerplate |
| `nanoid` para código único `RX-XXXXXXXX` | Colisiones prácticamente imposibles, URL-friendly |
| Índices en `status+createdAt`, `patientId`, `authorId` | Optimizan los 3 queries más frecuentes |

## Estructura del proyecto

```
apps/
  api/          # NestJS backend
    src/
      auth/     # JWT, guards, decorators
      prescriptions/  # CRUD + PDF service
      metrics/  # Queries agregadas para admin
      users/    # Listado de usuarios
      common/   # Filters, interceptors
      prisma/   # PrismaService
    prisma/
      schema.prisma
      seed.ts
  web/          # Next.js frontend
    app/
      login/
      doctor/prescriptions/
      patient/prescriptions/
      admin/
    components/
    lib/         # API client, React Query hooks
    store/       # Zustand auth store
```

## Deploy en Railway + Vercel

### Railway (backend + DB)
1. Crear proyecto en Railway con servicio PostgreSQL
2. Agregar servicio de GitHub para el backend
3. Variables de entorno:
   - `DATABASE_URL` (provista por Railway)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `APP_ORIGIN` (URL de Vercel)
4. Comando de release: `pnpm prisma migrate deploy && pnpm prisma db seed`

### Vercel (frontend)
1. Importar repositorio en Vercel
2. Root directory: `apps/web`
3. Variable: `NEXT_PUBLIC_API_URL` con la URL de Railway
