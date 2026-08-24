# SFU Course Planner

SFU Course Planner helps Simon Fraser University students research courses, inspect current and historical offerings, compare options, bookmark sections, and receive daily enrollment updates.

- Live site: [sfucourseplanner.com](https://sfucourseplanner.com)
- Public API reference: [api.sfucourseplanner.com/api-docs](https://api.sfucourseplanner.com/api-docs)
- License: MIT

## What it does

- Browse SFU departments, courses, and term-specific offerings.
- Fetch current enrollment, capacity, instructors, and locations from SFU CourseSys when requested.
- Show stored CourseDiggers grade distributions and enrollment/load history.
- Compare courses and sections using readable, shareable URLs.
- Let authenticated users bookmark offerings and receive daily Resend digest emails.
- Provide a role-gated admin console for health checks, terms, users, bookmarks, and support submissions.

## Architecture

| Area | Technology | Responsibility |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind | Public UI, Supabase Auth UI, canonical readable routes |
| Backend | Java 17, Spring Boot 3.0, Gradle | ID-based REST API, authorization, CourseSys integration, email jobs |
| Database and Auth | Supabase PostgreSQL and Auth | Persisted catalog, terms, preferences, bookmarks, support data, and email/password, Google, or Microsoft sessions |
| External data | SFU CourseSys and CourseDiggers | Live offerings/enrollment and historical grade data |
| Email | Resend | Support replies and daily bookmark digests |

The frontend and backend are independently deployed. The browser calls the backend through `NEXT_PUBLIC_API_URL`; Spring Boot does not serve the Next.js app.

### Data and authorization boundaries

- PostgreSQL/Supabase is the source of truth for catalog metadata, terms, bookmarks, preferences, and support submissions.
- CourseSys offering data is fetched on demand and is not persisted as normal offering records.
- Supabase owns authentication. The frontend proxy refreshes sessions and protects UI routes; the backend independently verifies bearer tokens and enforces ownership/admin permissions.
- Readable frontend routes such as `/browse/cmpt/125` resolve to internal numeric IDs before calling the existing backend APIs.

## Repository layout

```text
backend/                         Spring Boot API
  src/main/java/.../
    controller/                  Public, protected, and admin REST controllers
    dto/                         API DTOs; controllers do not expose entities
    entity/, repository/         JPA model and repositories
    service/                     JWT, CourseSys, and email integrations
    scheduler/                   Daily bookmark digest
    utils/                       Semester utilities
  Dockerfile                     dev, builder, and runtime targets

frontend/                        Next.js application
  app/                           App Router pages and layouts
  components/
    layout/, course/, feedback/  Shared UI by responsibility
    dashboard/, analytics/       Feature-specific display components
    landing/, admin/, ui/        Landing, admin, and shadcn components
  contexts/                      UI-only auth context
  hooks/                         Route, retry, theme, and animation hooks
  lib/                           API client, types, auth, course-route helpers
  proxy.ts                       Session refresh and route/admin UI gates
  Dockerfile                     dev, build, and runtime targets

supabase/                        Local Supabase configuration, migrations, and seed data
scripts/                         Windows development start/stop helpers
agent-docs/                      Persistent project guidance and engineering backlog
docker-compose.yaml              Development frontend and backend only
```

## Local development

### Prerequisites

- Docker Desktop running
- Node.js 22+ and npm
- Java 17+ only if running the backend outside Docker
- Supabase CLI available through `npx supabase@latest`

### 1. Create local environment files

Copy the examples and fill them with local Supabase values:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item backend/.env.example backend/.env.local
```

Start Supabase once to obtain the local URL, anon key, database user, and password:

```powershell
npx supabase@latest start
npx supabase@latest status
```

Set these values in `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Set `backend/.env.local` with the local database credentials shown by `supabase status`. Use the JDBC URL `jdbc:postgresql://host.docker.internal:54322/postgres` when running through Compose. `docker-compose.yaml` supplies the local Supabase URL override automatically.

`backend/.env.local` is read by Docker Compose; Spring Boot does not automatically load it for manual Gradle/JAR commands. Load those variables into your shell first when running the backend outside Docker.

### 2. Start the complete development environment

From the repository root, the helper starts Supabase first and then the frontend and backend containers:

```powershell
.\scripts\dev.ps1
```

Equivalent manual commands:

```powershell
npx supabase@latest start
docker compose up --build
```

Open:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:5000>
- Swagger UI: <http://localhost:5000/api-docs>
- Supabase Studio: <http://127.0.0.1:54323>
- Mailpit inbox: <http://127.0.0.1:54324>

Stop everything with:

```powershell
.\scripts\dev-down.ps1
```

This Docker setup is for development only. It does not deploy the frontend, backend, or database.

### Run applications outside Docker

Frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

Backend, after loading the required environment variables into the current shell:

```powershell
Set-Location backend
.\gradlew.bat bootRun
```

## Environment variables

Never commit `.env.local` files or service-role/Resend secrets.

| File | Variable | Purpose |
| --- | --- | --- |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Browser-visible backend base URL |
| | `NEXT_PUBLIC_SUPABASE_URL` | Browser-visible Supabase URL |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-visible Supabase anon key |
| | `NEXT_PUBLIC_SITE_URL` | Auth callback origin |
| `backend/.env.local` | `DB_URL_NEW`, `DB_USER_NEW`, `DB_PASS_NEW` | PostgreSQL connection |
| | `SUPABASE_URL_NEW`, `SUPABASE_KEY_NEW` | Backend Supabase JWT verification |
| | `RESEND_API_KEY` | Server-only email credential |
| | `SERVER_PORT` | Optional backend port; defaults to `5000` |

`NEXT_PUBLIC_*` values are intentionally exposed to the browser; they must never contain service-role credentials.

## Validation and builds

```powershell
# Frontend
Set-Location frontend
npm run lint
npm run build

# Backend
Set-Location ../backend
.\gradlew test
.\gradlew bootJar
```

The backend has JUnit 5/Mockito/MockMvc coverage under `backend/src/test/java`. Tests mock external boundaries, so they do not require live Supabase, CourseSys, or Resend credentials. View the generated HTML report at `backend/build/reports/tests/test/index.html`.

## Local Supabase workflow

The local schema is in `supabase/migrations/`; `supabase/seed.sql` seeds catalog data after a local reset.

```powershell
# Rebuild the local database from migrations and seed data
npx supabase@latest db reset

# Create a new reviewed migration for a schema change
npx supabase@latest migration new <descriptive_name>
```

Test migrations locally before a reviewed `db push`. Never run `db reset --linked` against production.

Local auth emails are captured by Mailpit rather than sent externally. Use its inbox to verify signup-confirmation and password-reset flows.

## API and deployment

Springdoc generates the public API specification:

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/v3/api-docs`

Internal `/api/admin/**` operations are intentionally excluded from the generated public reference.

Production deployment is split:

- Frontend: Vercel, served from the custom domain.
- Backend: a Spring Boot JAR on AWS Elastic Beanstalk.
- Database and Auth: hosted Supabase.

See [`agent-docs/AGENTS.md`](agent-docs/AGENTS.md) for persistent engineering conventions and [`agent-docs/to-do.md`](agent-docs/to-do.md) for the prioritized hardening backlog.
