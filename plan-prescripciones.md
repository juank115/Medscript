# Plan de Desarrollo — App de Prescripciones (Prueba Técnica Full-Stack)

> **Objetivo**: MVP simple y sólido. 3 roles (Admin / Médico / Paciente), prescripciones con ítems digitados manualmente, marcar como consumida, descargar PDF, métricas para admin.
>
> **Stack obligatorio**: NestJS + Prisma + PostgreSQL · JWT + refresh + RBAC · Next.js (App Router) + TypeScript + TailwindCSS · Railway (back + DB) + Vercel (front).

---

## 1. Estrategia y filosofía de ejecución

**Regla de oro**: el core perfecto vale más que el plus a medias. La distribución de puntos es clara: 35% funcionalidad + 25% calidad + 20% arquitectura = **80% sale del MVP bien hecho**. UX (15%) y Testing (5%) cierran el cuadro. Los "Plus" sólo suman si el core está impecable.

**Orden de prioridad por fase**:

1. **Fundamentos primero** (base de datos, auth, RBAC). Si esto está mal, todo lo demás se cae.
2. **Vertical slice del flujo principal**: médico crea prescripción → paciente la ve → la consume → descarga PDF. Una vez funciona end-to-end, el resto es repetición.
3. **Métricas y admin** son lo último funcional (no bloquean nada).
4. **Pulido, testing, README, deploy**.

**Anti-patrones a evitar**:
- No empezar por el frontend ni por el diseño.
- No sobre-ingenierizar: un módulo por dominio, DTOs claros, sin Clean Architecture innecesaria.
- No dejar el deploy para el final — desplegar vacío desde el día 1.
- No olvidar el `seed` (es lo primero que correrá el revisor).

---

## 2. Decisiones técnicas justificadas

Estas decisiones quedan documentadas en el README para puntos de **arquitectura (20%)**.

| Tema | Decisión | Justificación |
|---|---|---|
| **Auth** | JWT access (15m) + refresh (7d) en cookies HTTP-Only `SameSite=Lax`, con rotación de refresh | Cumple "almacenamiento seguro" del enunciado y mitiga XSS mejor que localStorage |
| **RBAC** | `@Roles()` decorator + `RolesGuard` global, leyendo `request.user.role` | Es exactamente lo que pide el enunciado; simple y limpio |
| **Validación** | `class-validator` + `class-transformer` con `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted: true`) | Estándar Nest; cubre el requerimiento de DTOs |
| **Errores** | Global `HttpExceptionFilter` con shape `{ message, code, details? }` | Respuestas consistentes (el enunciado lo pide explícito) |
| **Seguridad** | `helmet`, `cors` con origen del front, `express-rate-limit` en `/auth/*` | Los tres puntos del enunciado |
| **PDF** | `pdfkit` server-side (sin Chromium) | Más liviano que puppeteer en Railway free-tier; suficiente para un PDF estándar |
| **Frontend state** | React Query para datos servidor + Zustand para auth/UI ligero | Evita Redux boilerplate; React Query da loading/error/cache gratis (ayuda al 15% de UX) |
| **Forms** | React Hook Form + Zod | Tipado end-to-end con los DTOs |
| **Paginación** | `?page&limit&order` cursor-less, devuelve `{ data, total, page, limit }` | Simple y suficiente para el alcance |

---

## 3. Plan por fases (estimación ~30–40h de trabajo efectivo)

### Fase 0 — Setup (2h)

- [ ] Crear monorepo `pnpm` con dos workspaces: `apps/api` y `apps/web` (o dos repos separados — el enunciado lo permite).
- [ ] `nest new apps/api`, `npx create-next-app@latest apps/web --ts --tailwind --app`.
- [ ] Configurar ESLint + Prettier compartidos, `.editorconfig`, `.gitignore`.
- [ ] `docker-compose.yml` con Postgres local para desarrollo.
- [ ] Crear repo en GitHub. Primer commit con el esqueleto.
- [ ] Crear proyectos vacíos en **Railway** (backend + Postgres) y **Vercel** (frontend). Conectar a GitHub. **Deploy vacío funcionando antes de seguir.**

### Fase 1 — DB + Prisma + Seed (3h)

- [ ] Copiar el `schema.prisma` del enunciado (respetando relaciones: `User` ↔ `Doctor`/`Patient`, `Prescription` ↔ `PrescriptionItem`).
- [ ] Agregar índices sugeridos: `Prescription(status, createdAt)`, `Prescription(patientId)`, `Prescription(authorId)`.
- [ ] Considerar agregar `deletedAt DateTime?` en `User` y `Prescription` para el soft delete opcional.
- [ ] `prisma migrate dev --name init`.
- [ ] **`prisma/seed.ts`** con las credenciales exactas que pide el enunciado:
  - `admin@test.com / admin123`
  - `dr@test.com / dr123`
  - `patient@test.com / patient123`
  - 5–10 prescripciones de ejemplo, mezcla de `pending` y `consumed`.
- [ ] Script `db:reset` en `package.json` que resetee y vuelva a sembrar.

### Fase 2 — Auth + RBAC (4h)

- [ ] Módulo `auth/`: `AuthService`, `AuthController`, `JwtStrategy`, `RefreshStrategy`, `JwtAuthGuard`, `RolesGuard`, decorator `@Roles()`, `@CurrentUser()`.
- [ ] Endpoints:
  - `POST /auth/login` → `{ accessToken, refreshToken }`
  - `POST /auth/refresh` → `{ accessToken }`
  - `GET /auth/profile` → usuario + rol
  - `POST /auth/register` (opcional para crear pacientes/médicos sin admin)
- [ ] Hash de password con `argon2` (o bcrypt como fallback).
- [ ] **Test crítico**: un usuario `patient` no puede llamar a endpoints de `doctor`/`admin` → 403.

### Fase 3 — Recurso Prescriptions (núcleo, 6h)

Este es **el** vertical slice. Si funciona bien, ganaste el 35% de funcionalidad.

- [ ] `PrescriptionsModule` con controller + service + DTOs.
- [ ] DTOs:
  - `CreatePrescriptionDto { patientId, notes?, items: PrescriptionItemDto[] }`
  - `PrescriptionItemDto { name, dosage?, quantity?, instructions? }`
  - `ConsumePrescriptionDto { consumed: boolean }`
- [ ] Endpoints **con guards de rol explícitos**:
  - `POST /prescriptions` *(doctor)* — crea con transacción Prisma para items
  - `GET /prescriptions?mine=true&status=&from=&to=&page=&limit=&order=` *(doctor)*
  - `GET /prescriptions/:id` *(doctor dueño, paciente dueño, admin)*
  - `GET /me/prescriptions?status=&page=&limit=` *(patient)*
  - `PUT /prescriptions/:id/consume` *(patient dueño)* — valida ownership y que esté `pending`
  - `GET /prescriptions/:id/pdf` *(patient dueño, doctor autor)* — genera PDF
  - `GET /admin/prescriptions?status=&doctorId=&patientId=&from=&to=&page=&limit=` *(admin)*
- [ ] Generar `code` único en la creación: `RX-` + nanoid corto. Va al PDF y al posible QR.
- [ ] **Lógica de ownership** en el service, no en el controller — esto es lo que separa código de junior de código de senior.

### Fase 4 — PDF Backend (3h)

- [ ] `PdfService` con `pdfkit`.
- [ ] Contenido obligatorio del PDF:
  - Encabezado: `Prescripción RX-XXXXX`
  - Datos del paciente (nombre, email, fecha nac. si existe)
  - Datos del médico (nombre, especialidad)
  - Fecha de emisión + estado (`PENDIENTE` / `CONSUMIDA`)
  - Tabla de ítems: `Nombre | Dosis | Cantidad | Indicaciones`
  - Notas del médico
  - Footer con código
- [ ] **Plus barato**: agregar QR (`qrcode` lib) que apunte a `/patient/prescriptions/:id`. Son 20 líneas de código y queda visualmente impactante.
- [ ] Stream del PDF directo con `res.set('Content-Type', 'application/pdf')` y `pdf.pipe(res)`.

### Fase 5 — Métricas Admin (3h)

- [ ] `MetricsService` con queries Prisma agregadas:
  - `totals`: counts simples de doctors/patients/prescriptions
  - `byStatus`: `groupBy({ by: ['status'], _count })`
  - `byDay`: query raw o `groupBy` por fecha truncada, últimos 30 días
  - `topDoctors`: `groupBy({ by: ['authorId'], _count })`, order desc, take 5
- [ ] Endpoint único `GET /admin/metrics?from=&to=` que devuelve el shape del enunciado.
- [ ] Aceptar `from`/`to` ISO; default últimos 30 días.

### Fase 6 — Frontend: Auth + Routing (4h)

- [ ] `app/login/page.tsx` con form email/password (React Hook Form + Zod).
- [ ] `lib/api.ts`: cliente fetch con interceptor que mete `Authorization: Bearer` y reintenta una vez si 401, llamando a `/auth/refresh`.
- [ ] `lib/auth-store.ts` (Zustand): `user`, `accessToken`, `setAuth`, `logout`. Persistir en `localStorage` (refresh va en cookie HTTP-Only).
- [ ] `middleware.ts` de Next: redirigir según rol — `/admin/*` → admin, `/doctor/*` → doctor, `/patient/*` → patient. Si no autenticado → `/login`.
- [ ] Componente `<RoleGuard requiredRole="doctor">` para client-side guards también.

### Fase 7 — Frontend: Páginas por rol (6h)

**Doctor**
- [ ] `/doctor/prescriptions` — tabla con filtros (status, fecha desde/hasta), paginación, orden por `createdAt DESC`. Filtros en query string (`useSearchParams`).
- [ ] `/doctor/prescriptions/new` — form con `patientId` (input + lookup por email opcional), notas, y **lista de ítems dinámicos con add/remove** (`useFieldArray` de RHF).
- [ ] `/doctor/prescriptions/[id]` — detalle read-only.

**Paciente**
- [ ] `/patient/prescriptions` — listado con dos acciones por fila: **Marcar como consumida** (botón con `confirm`) y **Descargar PDF** (link a `/prescriptions/:id/pdf` con auth).
- [ ] `/patient/prescriptions/[id]` — detalle + las mismas acciones.

**Admin**
- [ ] `/admin` — dashboard con:
  - 3 KPI cards arriba (totales)
  - Gráfico de barras por estado (`Recharts`)
  - Gráfico de líneas por día (últimos 30)
  - Lista de top médicos (opcional)
- [ ] `/admin/prescriptions` — listado global con filtros `doctorId`, `patientId`, `status`, fechas.

**Cross-cutting**
- [ ] Layout con sidebar por rol + topbar con email + logout.
- [ ] `<Toaster>` global (`sonner` o `react-hot-toast`) para feedback de acciones.
- [ ] Estados: skeleton loaders, empty states con CTA, error boundary.

### Fase 8 — Testing mínimo (2h)

**Backend** (Jest + Supertest):
- [ ] `auth.service.spec.ts`: login con creds válidas/inválidas, refresh.
- [ ] `prescriptions.service.spec.ts`: crear, consumir, validar ownership.
- [ ] E2E: `auth.e2e-spec.ts` con flujo login → endpoint protegido → 403 con rol incorrecto.

**Frontend** (Vitest + Testing Library):
- [ ] Test del componente de ítems dinámicos (add/remove funciona).
- [ ] Test del hook `useAuth` o del store.

### Fase 9 — Pulido + README + Deploy (3h)

- [ ] **OpenAPI/Swagger** en `/docs` con `@nestjs/swagger` — esto es un Plus barato (5 líneas en `main.ts` + decorators ya escritos).
- [ ] Variables de entorno en Railway y Vercel.
- [ ] CORS apuntando a la URL de Vercel.
- [ ] Verificar que `seed` corre en Railway (`railway run pnpm prisma:seed`).
- [ ] README impecable (ver sección 8).
- [ ] Postman collection o link a `/docs`.

---

## 4. Estructura de carpetas

### Backend (`apps/api/`)

```
src/
  main.ts                       # bootstrap, swagger, helmet, cors, rate-limit
  app.module.ts
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/
      login.dto.ts
      register.dto.ts
    strategies/
      jwt.strategy.ts
      refresh.strategy.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    decorators/
      roles.decorator.ts
      current-user.decorator.ts
  users/
  patients/
  doctors/
  prescriptions/
    prescriptions.module.ts
    prescriptions.controller.ts
    prescriptions.service.ts
    pdf.service.ts
    dto/
      create-prescription.dto.ts
      consume-prescription.dto.ts
      query-prescriptions.dto.ts
  metrics/
    metrics.controller.ts
    metrics.service.ts
  common/
    filters/http-exception.filter.ts
    interceptors/transform.interceptor.ts
    pipes/
    types/
  prisma/
    prisma.module.ts
    prisma.service.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
test/
  *.e2e-spec.ts
```

### Frontend (`apps/web/`)

```
src/
  app/
    layout.tsx
    login/page.tsx
    doctor/
      layout.tsx                # RoleGuard("doctor")
      prescriptions/
        page.tsx
        new/page.tsx
        [id]/page.tsx
    patient/
      layout.tsx
      prescriptions/
        page.tsx
        [id]/page.tsx
    admin/
      layout.tsx
      page.tsx                  # dashboard
      prescriptions/page.tsx
  components/
    ui/                          # botones, inputs, cards reutilizables
    prescriptions/
      PrescriptionTable.tsx
      PrescriptionForm.tsx
      ItemsArray.tsx
    layout/
      Sidebar.tsx
      Topbar.tsx
    charts/
      StatusBarChart.tsx
      DailyLineChart.tsx
  lib/
    api.ts                       # fetcher con auth
    auth.ts                      # helpers
    queries/                     # React Query hooks
  store/
    auth-store.ts                # zustand
  middleware.ts                  # route protection
```

---

## 5. Modelo de datos (notas sobre el schema dado)

El schema viene casi listo en el enunciado. Sólo dos cosas a cuidar:

1. **Relación `User ↔ Doctor/Patient`**: el enunciado tiene perfiles opcionales en `User` (`doctorId?`, `patientId?`). Yo lo invertiría — en `Doctor`/`Patient` ya tienes `userId @unique` que apunta a `User`. Quitar los campos opcionales de `User` deja el modelo más limpio. Documentar la decisión en el README.
2. **Índices** que pide explícitamente:
   ```prisma
   @@index([status, createdAt])
   @@index([patientId])
   @@index([authorId])
   ```
   No olvidar — son puntos de arquitectura directos.

Para soft delete opcional (sólo si sobra tiempo): `deletedAt DateTime?` en `User` y `Prescription`, y filtrar globalmente con middleware Prisma.

---

## 6. Mapa de endpoints → permisos (RBAC matrix)

| Endpoint | Admin | Doctor | Patient |
|---|---|---|---|
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `POST /auth/refresh` | ✅ | ✅ | ✅ |
| `GET /auth/profile` | ✅ | ✅ | ✅ |
| `POST /prescriptions` | ❌ | ✅ | ❌ |
| `GET /prescriptions?mine=true` | ❌ | ✅ (solo suyas) | ❌ |
| `GET /prescriptions/:id` | ✅ | ✅ (autor) | ✅ (dueño) |
| `GET /me/prescriptions` | ❌ | ❌ | ✅ |
| `PUT /prescriptions/:id/consume` | ❌ | ❌ | ✅ (dueño) |
| `GET /prescriptions/:id/pdf` | ✅ | ✅ (autor) | ✅ (dueño) |
| `GET /admin/prescriptions` | ✅ | ❌ | ❌ |
| `GET /admin/metrics` | ✅ | ❌ | ❌ |
| `GET /users` | ✅ | ❌ | ❌ |

**Implementación**: Guards de rol con `@Roles()` cubren la primera dimensión. La segunda (ownership) se valida en el `service` con un `if (resource.userId !== currentUser.id && currentUser.role !== 'admin') throw new ForbiddenException()`.

---

## 7. Checklist contra criterios de evaluación

### Funcionalidad (35%)
- [ ] Login funciona y devuelve perfil + rol
- [ ] Médico crea prescripción con ítems manuales
- [ ] Paciente ve sólo las suyas
- [ ] Paciente marca como consumida
- [ ] Paciente descarga PDF
- [ ] Admin ve métricas con filtros de fecha
- [ ] Paginación, filtros y orden funcionan en los 3 listados principales

### Calidad de código (25%)
- [ ] Módulos claros, una responsabilidad por archivo
- [ ] DTOs con `class-validator` en todos los endpoints con body
- [ ] Manejo de errores consistente (filter global, shape `{message, code, details?}`)
- [ ] TypeScript estricto: `"strict": true`, sin `any`
- [ ] Naming consistente (inglés en código, español sólo en strings de UI)
- [ ] ESLint + Prettier sin warnings

### Arquitectura (20%)
- [ ] Separación de capas (controller → service → prisma)
- [ ] Guards y strategies bien usados
- [ ] Prisma con relaciones e índices correctos
- [ ] Variables de entorno separadas, no hardcodeadas
- [ ] Decisiones documentadas en README

### UX/UI (15%)
- [ ] Responsive (probar en mobile)
- [ ] Skeleton loaders en todos los listados
- [ ] Empty states con CTA
- [ ] Error states con mensaje útil
- [ ] Toasts en acciones (creado, consumido, error)
- [ ] Filtros persistidos en query string
- [ ] Navegación clara según rol (sidebar contextual)

### Testing (5%)
- [ ] Al menos 3 tests unitarios de service backend
- [ ] Al menos 1 e2e de auth
- [ ] Al menos 1 test de componente/hook front
- [ ] Comandos de test documentados en README

---

## 8. README (estructura recomendada)

```markdown
# App de Prescripciones

## Stack
- Backend: NestJS 10 · Prisma · PostgreSQL · JWT
- Frontend: Next.js 14 (App Router) · TypeScript · Tailwind · React Query · Zustand
- Deploy: Railway (API + DB) · Vercel (Web)

## URLs
- Frontend: https://...vercel.app
- API: https://...railway.app
- Swagger: https://...railway.app/docs

## Cuentas de prueba
| Rol | Email | Password |
|---|---|---|
| Admin | admin@test.com | admin123 |
| Médico | dr@test.com | dr123 |
| Paciente | patient@test.com | patient123 |

## Setup local
... pasos exactos ...

## Decisiones técnicas
... cada decisión justificada en 2 líneas ...

## Estructura del proyecto
... árbol de carpetas ...

## Testing
... comandos ...
```

**Tip clave**: el enunciado dice "README suficiente para levantar en < 15 minutos". Probarlo en una VM limpia o pidiéndole a alguien que lo siga.

---

## 9. Plus priorizados (orden de retorno)

Si sobra tiempo, atacar en este orden (mayor impacto / menor esfuerzo primero):

1. ⭐ **Swagger** (`/docs`) — 30 min, impacto altísimo en revisión.
2. ⭐ **QR en el PDF** — 1h, visualmente impactante.
3. ⭐ **Dark mode** persistido — 1h, demuestra atención a UX.
4. **Búsqueda libre** por nombre de ítem/notas — 1h, requiere `mode: 'insensitive'` en Prisma.
5. **Auditoría** (tabla `AuditLog` con eventos de cambio de estado) — 2h, muestra pensamiento de senior.
6. **Notificaciones por email** (Resend free tier) al crear prescripción — 2h.
7. **SSE** para métricas en vivo en admin — 3h, sólo si todo lo demás está perfecto.

---

## 10. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| PDF no se ve bien en Railway por fuentes | Media | Usar fuentes built-in de pdfkit (Helvetica), no externas |
| CORS roto entre Vercel y Railway | Alta | Configurar `APP_ORIGIN` exacto desde el día 1; probar el deploy temprano |
| Refresh token en cookies + Next App Router | Media | Si se complica, fallback a refresh en body — documentar trade-off |
| Migraciones fallan en Railway | Media | Script de release: `pnpm prisma migrate deploy && pnpm prisma:seed` |
| Quedarse sin tiempo en frontend | Alta | Tener componentes base (`<Card>`, `<Table>`, `<Button>`) listos desde Fase 6 |
| Olvidar el seed | Baja | Es lo primero del README + script `db:reset` |

---

## 11. Comandos clave (snippet para el README)

```bash
# Backend
cd apps/api
pnpm install
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed
pnpm start:dev

# Frontend
cd apps/web
pnpm install
cp .env.local.example .env.local
pnpm dev

# Tests
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter web test
```

---

## 12. Resumen ejecutivo (TL;DR)

1. **Día 1**: Setup + DB + Auth + RBAC + deploy vacío funcionando.
2. **Día 2**: Recurso Prescriptions completo en backend + PDF + métricas.
3. **Día 3**: Frontend de los 3 roles, vertical slice por rol.
4. **Día 4**: Pulido UX, testing, README, Swagger, deploy final.
5. **Día 5 (opcional)**: 2–3 Plus de la lista priorizada.

**Filosofía final**: la prueba dice *"Demuestra tu capacidad técnica y de liderazgo creando una solución completa y profesional"*. Eso se demuestra con **decisiones documentadas, código consistente, deploy funcionando y un README que cualquiera puede levantar**. No con features de más.
