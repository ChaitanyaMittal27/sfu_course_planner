# Prioritized engineering to-do list

This is a product-hardening backlog derived from the repository audit. It is ordered by expected risk reduction and enabling value; it is not a release plan.

0. ratemyprof integration
1. Add frontend component tests and a small end-to-end suite for critical user flows: auth, canonical routes, bookmarks, and dashboard states.
2. Add local Supabase/pgTAP tests for migrations, RLS, constraints, native repository SQL, and the `auth.users` dependency used by admin reporting.
3. Build a complete support-ticket lifecycle: persisted threads and replies, clear owner/status state, outbound delivery outcomes, and an inbound-email/webhook or managed-mailbox strategy that attaches replies to the correct ticket.
4. Upgrade the backend to Java 21 LTS and Spring Boot 3.5.x; align local, Docker, and Elastic Beanstalk runtimes.
5. Add CourseSys request timeouts, safe error handling, and predictable fallback responses.
6. Cache CourseSys results in the backend, starting with an in-memory Caffeine cache.
7. Finish strict bookmark input validation: semester code, normalized section, and duplicate-insert races.
8. Add versioned database migrations with Flyway or Liquibase.
9. Add GitHub Actions CI for frontend lint/build and backend test/build on pull requests.
10. Complete a frontend accessibility and responsive-design pass: keyboard-operable interactive rows, reduced-motion support, breakpoint coverage, and manual testing on narrow/mobile layouts.
11. Decide whether the backend remains JAR-on-Elastic-Beanstalk or becomes Docker-on-Elastic-Beanstalk/ECR.
12. Standardize Python ingestion-script configuration, credential handling, execution instructions, and data-safety expectations.
13. Improve observability for CourseSys and email: structured failures, latency visibility, and meaningful health checks.
14. Review CORS and production security configuration, especially allowed origins and environment-secret handling.

Backend Java unit/MVC coverage is complete for the current implementation. The next test layers are frontend behavior and local Supabase database behavior; neither is replaced by the existing mocked backend suite.
