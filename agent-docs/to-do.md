# Prioritized engineering to-do list

This is a product-hardening backlog derived from the repository audit. It is ordered by expected risk reduction and enabling value; it is not a release plan.

1. Add automated backend tests for semesters, authorization, bookmarks, terms, CourseSys parsing, and notifications.
2. Upgrade the backend to Java 21 LTS and Spring Boot 3.5.x after core tests exist; align local, Docker, and Elastic Beanstalk runtimes.
3. Fix `SemesterUtil.decodeSemesterCode()` so decoded semester years match its encoding, with regression coverage.
4. Add CourseSys request timeouts, safe error handling, and predictable fallback responses.
5. Cache CourseSys results in the backend, starting with an in-memory Caffeine cache.
6. Validate bookmark creation: course/department relationship, semester code, normalized section, and duplicate-insert races.
7. Add versioned database migrations with Flyway or Liquibase.
8. Add GitHub Actions CI for frontend lint/build and backend test/build on pull requests.
9. Redesign support from one-shot submissions into ticket threads with messages, statuses, delivery results, and a clearer admin workflow.
10. Decide and implement inbound support-email handling: a managed mailbox workflow or inbound-email/webhook ingestion into tickets.
11. Track email outcomes explicitly; do not equate an attempted Resend call with successful delivery.
12. Add an explicit, role-aware Admin navigation link for administrators while retaining backend role checks.
13. Redesign the admin Test page into a safer operations/diagnostics area, with confirmation for consequential actions.
14. Set up Supabase CLI local development, baseline migrations, and synthetic seed data.
15. Add Docker Compose for local frontend/backend development and integration testing.
16. Decide whether the backend remains JAR-on-Elastic-Beanstalk or becomes Docker-on-Elastic-Beanstalk/ECR.
17. Document the final Docker and local-development workflow in `README.md` after Docker Compose and local Supabase setup are complete.
18. Add generated API documentation with Springdoc OpenAPI and Swagger UI.
19. Add frontend component tests and a small end-to-end suite for critical user flows.
20. Standardize Python ingestion-script configuration, credential handling, execution instructions, and data-safety expectations.
21. Review and test the Supabase `auth.users` SQL dependency used by admin reporting, including required database permissions.
22. Improve observability for CourseSys and email: structured failures, latency visibility, and meaningful health checks.
23. Review CORS and production security configuration, especially allowed origins and environment-secret handling.

Start with item 1. It creates the safety net required for the known semester defect and for subsequent CourseSys, bookmark, support, and email work.
