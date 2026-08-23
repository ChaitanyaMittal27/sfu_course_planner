# SFU Course Planner — Repository Guidance

## Scope and layout

- This repository contains two deployed applications:
  - `backend/`: Java 17 / Spring Boot 3 API and Gradle wrapper.
  - `frontend/`: Next.js App Router / React / TypeScript frontend.
- The frontend calls the separately deployed API through `NEXT_PUBLIC_API_URL`; it is not served by Spring Boot. Keep frontend API contracts and backend DTOs in sync.
- The former root static frontend was removed. Active browser assets are under `frontend/public/`; do not recreate the legacy static site.

## Backend

- PostgreSQL/Supabase is the source of persisted course metadata, terms, bookmarks, preferences, contact submissions, and CourseDiggers data. Course offering/enrollment data is fetched on demand from SFU CourseSys; do not model it as persisted data without an intentional schema change.
- JPA runs with `spring.jpa.hibernate.ddl-auto=validate`: it validates an existing schema and never creates or migrates it. Coordinate schema changes explicitly; entity changes alone will cause startup validation failures.
- Controllers expose DTOs, not entities. Preserve the `Api*DTO` / `Admin*DTO` boundary and map entities before returning them.
- Protected endpoints receive a Supabase access token in `Authorization: Bearer ...`. Use `JwtService` to verify it against Supabase and derive the user ID; do not parse JWTs locally or trust client-supplied user IDs. Admin routes require `app_metadata.role == "admin"` via `verifyAdmin`.
- Keep authorization checks server-side on every mutation. Bookmarks are scoped to the authenticated UUID and their DB uniqueness is `(dept_id, user_id, course_id, semester_code, section)`.
- Terms drive the current/enrolling semester and CourseSys history. Use `SemesterUtil` rather than duplicating SFU semester-code arithmetic (spring/summer/fall digits 1/4/7).
- The scheduled digest runs at 00:05 `America/Vancouver` and can also be triggered by an admin endpoint. It fetches external CourseSys data and sends Resend email, so treat changes there and to the admin test endpoint as production-affecting.
- Backend configuration is environment-only: `DB_URL_NEW`, `DB_USER_NEW`, `DB_PASS_NEW`, `SUPABASE_URL_NEW`, `SUPABASE_KEY_NEW`, and `RESEND_API_KEY`; `SERVER_PORT` defaults to 5000. Never commit values.
- `backend/.env.local` is an ignored Docker/runtime environment file, not an automatic Spring Boot configuration source. Load its values into the shell for manual Gradle/JAR runs.
- Springdoc serves the generated public API reference at `/api-docs` and its OpenAPI JSON at `/v3/api-docs`. Keep public/user controller annotations and API DTO schemas accurate; `/api/admin/**` controllers are intentionally `@Hidden` because they are internal operations.
- Run backend tasks from `backend/` with a Java 17+ runtime: `./gradlew bootRun`, `./gradlew test`, and `./gradlew bootJar`.
- Dockerfiles are multi-stage: `backend/Dockerfile` has `dev`, `builder`, and `runtime` targets; `frontend/Dockerfile` has `dev`, `build`, and `runtime` targets. Keep build contexts free of `.env*` files.
- `docker-compose.yaml` is development-only: it runs the frontend and backend `dev` targets. Supabase remains owned by the Supabase CLI, which starts its own local service stack. On Windows, use `scripts/dev.ps1` to start both and `scripts/dev-down.ps1` to stop both; this does not deploy either application.
- Browser-facing Supabase configuration must remain a browser-reachable URL (normally `http://127.0.0.1:54321` locally). When the frontend runs in Compose, its server-only `SUPABASE_INTERNAL_URL` reaches the host through `host.docker.internal`; `lib/supabase/server.ts` falls back to the public value outside Compose.

## Frontend

- Routes live in `frontend/app/`; interactive pages/components are client components. Root layout provides `AuthProvider`, `NuqsAdapter`, navigation, footer, and analytics.
- Keep normal backend calls in `lib/api.ts` and add matching interfaces to `lib/types.ts`. `fetchAuthAPI` obtains the Supabase session token and attaches it. The public contact form and the admin API-test page are intentional direct-fetch exceptions.
- Supabase owns browser auth. `proxy.ts` refreshes sessions and protects `/dashboard` and `/admin`; it also gates admin UI by `app_metadata.role`. Backend authorization remains mandatory.
- Keep frontend auth responsibilities separate: `proxy.ts` is the route guard and session-refresh boundary; `AuthContext` mirrors browser-session state for UI only; login, signup, and callback handlers navigate only after their own successful action. Do not add client-side route guards that compete with the proxy.
- `AppShell` keeps `/admin/**` outside the public navigation/footer; `AdminSidebar` owns desktop and mobile admin navigation. Use `AuthContext` only to conditionally render the existing Admin entry for `app_metadata.role === "admin"`; keep `proxy.ts` and backend `verifyAdmin` as the authorization boundaries. Build future admin pages with the shared `components/admin/AdminPage.tsx` primitives.
- Docker may use `SUPABASE_INTERNAL_URL` while the browser uses the public Supabase URL. Keep `lib/supabase/config.ts` as the shared cookie-name source so browser, proxy, and server clients read the same session cookie despite their different network hosts.
- The manual `/docs` frontend route was removed. Footer API Docs links directly to `${NEXT_PUBLIC_API_URL}/api-docs`; preserve that environment-aware link instead of duplicating endpoint documentation in the frontend.
- Human-facing course links use frontend-only canonical paths: `/browse/[deptCode]/[courseNumber]`, `/browse/[deptCode]/[courseNumber]/[semesterCode]`, graph paths under `/graph/[kind]/[deptCode]/[courseNumber]`, and `/compare/sections/[deptCode]/[courseNumber]/[semesterCode]?sections=D100,D200`. Build them with `lib/course-routes.ts`; resolve course code/number to internal IDs through `lib/course-resolver.ts` before calling the unchanged ID-based backend API. `sectionCode()` keeps section query values stable even though CourseSys display labels include the course prefix. Keep legacy numeric URLs as compatibility entries, but generate only canonical URLs in new navigation.
- Reuse existing components in `components/` and `components/ui/` (shadcn) before introducing primitives. Use Lucide icons rather than inline SVG paths.
- The UI is token-based and dark-mode aware. For new UI, use the semantic Tailwind tokens defined in `app/globals.css` and the typography constants in `app/fonts.ts`; do not introduce one-off colors, dark-mode hardcoded palettes, or typography scales. Add a token to both `:root` and `.dark` before using a new semantic color.
- Prefer the provided animation utilities in `globals.css` and Tailwind spacing over component-level CSS/style values. Type component props and reuse shared types instead of `any`.
- Frontend variables belong in `frontend/.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`. They are public-client configuration, not a place for service-role or Resend secrets.
- Local Supabase schema and catalog seed data live in `supabase/migrations/` and `supabase/seed.sql`. Use the CLI to test migrations locally before a reviewed `db push`; never use `db reset --linked` against production.
- `npx supabase start` also runs the local Mailpit inbox at `http://127.0.0.1:54324`; use it to verify password-reset and confirmation-email flows without sending real mail.
- From `frontend/`, use `npm install`, `npm run dev`, `npm run lint`, and `npm run build`.

## Data scripts and maintenance

- Python population scripts under `backend/src/main/java/com/example/courseplanner/scripts/` are operational database tooling, not Spring application code. They currently contain their own database-connection placeholders and are intended to be idempotent; inspect the targeted script and schema before running one.
- Avoid manual production-data edits when an appropriate population script can be corrected or rerun.

## Documentation hygiene and validation

- Treat implementation, `README.md`, and this guidance as the current references. Parts of `scripts_README.md` contain historical material (for example a nonexistent `populate_courses_deep_first.py`); verify any claim from them against code before acting on it.
- There is currently no `src/test` suite. At minimum, run frontend lint for frontend changes and the relevant Gradle task for backend changes; the backend requires Java 17+ even if the host default JVM is older.
