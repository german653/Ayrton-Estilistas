# Ayrton SaaS — Plataforma de Agentes de IA para PyMEs

Plataforma multi-tenant de agentes de IA para pequeñas y medianas empresas de
Latinoamérica (estilo GoHighLevel / Lindy / Retell, enfocado en LatAm).
Primer tenant: **Ayrton Estilistas** (Villa Carlos Paz, Córdoba).

## Estado actual (lo que ya funciona de verdad)

- **Backend (NestJS + Prisma + PostgreSQL/pgvector)**: auth JWT multi-tenant,
  CRUD de empleados/servicios/clientes, motor de disponibilidad y turnos,
  CRM básico, RAG (ingesta + búsqueda semántica), agente con tool-use real
  contra la API de Claude (reservar, cancelar, reprogramar, buscar en la
  base de conocimientos, derivar a humano), webhooks de WhatsApp Cloud API
  y Messenger/Instagram (Meta Graph API), recordatorios y solicitudes de
  reseña automáticos vía BullMQ + cron, campañas de promociones.
- **Frontend (Next.js + Tailwind)**: landing pública de Ayrton Estilistas
  con widget de chat conectado al agente real, login, y dashboard con
  turnos, CRM, servicios, empleados, configuración del agente, base de
  conocimientos, promociones y conexión de canales.
- **Infra**: Docker Compose (Postgres+pgvector, Redis, API, Web), Dockerfiles
  multi-stage, GitHub Actions CI, seed de datos de Ayrton Estilistas,
  migración SQL opcional de Row Level Security.

## Lo que falta para vender esto a un segundo cliente (roadmap explícito)

Esto es honesto, no relleno: en el próximo sprint hay que sumar:
1. **Registro de nuevos tenants desde el dashboard** (hoy existe el endpoint
   `POST /auth/register-tenant`, falta la pantalla de alta self-service).
2. **Facturación** (Stripe/Mercado Pago) atada a `PlanTier`.
3. **Vista de conversaciones en vivo** en el dashboard (hoy la data ya se
   guarda en `Conversation`/`Message`, falta la UI para que un humano
   intervenga cuando `handedOffToHuman = true`).
4. **Editor visual de horarios de empleados/negocio** (hoy se edita el JSON
   `businessHours`/`workingHours` directamente).
5. **Tests end-to-end** (Playwright) y tests unitarios de `AvailabilityService`
   y `AgentToolExecutor`, que son la lógica más sensible del sistema.
6. **Hardening de RLS**: ver sección de seguridad más abajo.

## Arquitectura multi-tenant

- Una sola base de datos, un solo esquema. Aislamiento por `tenantId` en
  **cada tabla y cada query** (no hay excepciones — se revisó módulo por
  módulo).
- Esto escala a miles de tenants sin el overhead operativo de crear una
  base de datos o esquema por cliente.

### Seguridad: dónde está hoy el límite de aislamiento entre tenants

El límite que **hoy realmente aplica** es el filtro `tenantId` explícito en
cada método de cada servicio (`AppointmentsService`, `CustomersService`,
etc.), derivado del JWT en cada request. Esto está verificado en el 100% de
los módulos.

Además se incluye una migración opcional (`prisma/migrations_manual/001_enable_rls.sql`)
que activa Row Level Security en Postgres como defensa adicional. **Importante:**
esa migración por sí sola no alcanza en producción — Postgres exime al owner
de la tabla de RLS salvo que se use `FORCE ROW LEVEL SECURITY` (ya incluido)
y que la app se conecte con un rol de base de datos que **no** sea el owner,
seteando `app.current_tenant_id` en cada sesión. Wiring completo de esto con
el pool de conexiones de Prisma es el ítem de seguridad #1 del roadmap;
hasta entonces, el filtro por `tenantId` a nivel de aplicación es la
protección real y está aplicado sin excepciones.

## Stack técnico (decidido, no negociado)

| Capa | Tecnología | Por qué |
|---|---|---|
| Backend | NestJS + TypeScript | Estructura modular madura para SaaS multi-tenant |
| ORM / DB | Prisma + PostgreSQL + pgvector | RAG sin infra adicional (sin vector DB separada) |
| Colas | Redis + BullMQ | Recordatorios, reseñas y reintentos de mensajería |
| Agente | API de Claude (Anthropic), tool-use | Acciones reales, no solo texto |
| Embeddings | Voyage AI (`voyage-3-lite`) | Recomendado por Anthropic, Claude no expone embeddings propios |
| Canales | WhatsApp Cloud API + Meta Graph API | Estándar oficial, escalable, sin intermediarios de pago |
| Frontend | Next.js 14 + Tailwind | Dashboard + landing en un solo framework |
| Auth | JWT (access 15min / refresh 30d) | Simple, stateless, multi-tenant por claim |

## Cómo correr esto en desarrollo

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# completar ANTHROPIC_API_KEY, VOYAGE_API_KEY, JWT_SECRET en apps/api/.env

docker compose up --build
# API en http://localhost:4000/api/v1
# Web en http://localhost:3000

# en otra terminal, una vez que el contenedor de la API esté arriba:
docker compose exec api npm run seed
```

Esto crea el tenant **Ayrton Estilistas** con usuario
`admin@ayrtonestilistas.com.ar` / `CambiarEn123!` (cambiar en producción).

### Conectar WhatsApp real

1. Crear una app de Meta for Developers con el producto WhatsApp.
2. Configurar el webhook a `https://tu-dominio.com/api/v1/channels/whatsapp/webhook`
   con el `WHATSAPP_VERIFY_TOKEN` de tu `.env`.
3. Desde el dashboard → Configuración, conectar el canal WHATSAPP con el
   `phone_number_id` y el access token permanente de la app de Meta.

### Ingestar la base de conocimientos con embeddings reales

El seed crea el documento pero **no** genera los embeddings (requiere
`VOYAGE_API_KEY` real). Ingestar contenido real desde el dashboard →
Base de conocimientos, o vía `POST /api/v1/knowledge`.

## Estructura del repo

```
apps/
  api/     # Backend NestJS (multi-tenant, agente, canales, turnos, CRM)
  web/     # Frontend Next.js (landing + dashboard)
.github/workflows/ci.yml
docker-compose.yml
```

## Despliegue a producción (resumen)

- **API**: cualquier PaaS con soporte Docker (Railway, Render, Fly.io) o
  Kubernetes. Necesita Postgres con extensión `pgvector` y Redis.
- **Web**: Vercel (nativo para Next.js) o el mismo Docker Compose.
- Ejecutar `npx prisma migrate deploy` en cada deploy antes de levantar la
  API (ya está en el `command` del servicio `api` en `docker-compose.yml`).
- Configurar los webhooks de Meta apuntando al dominio de producción.
