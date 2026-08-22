# Prioritized engineering to-do list

This is a product-hardening backlog derived from the repository audit. It is ordered by expected risk reduction and enabling value; it is not a release plan.

1. Add automated backend tests for semesters, authorization, bookmarks, terms, CourseSys parsing, and notifications.
2. Upgrade the backend to Java 21 LTS and Spring Boot 3.5.x after core tests exist; align local, Docker, and Elastic Beanstalk runtimes.
3. Audit end-to-end frontend/backend logic flows—especially authentication, redirects, authorization, and duplicated state ownership—and add regression coverage for the inconsistencies found.
   - Reproduce and fix the local authenticated Dashboard blank screen after login; it currently redirects to `/dashboard` but never renders usable content.
   - Fix Section Comparison deep links: its initial URL-sync flow drops the `sections` query parameter before the selected sections are restored.
4. Fix `SemesterUtil.decodeSemesterCode()` so decoded semester years match its encoding, with regression coverage.
5. Add CourseSys request timeouts, safe error handling, and predictable fallback responses.
6. Cache CourseSys results in the backend, starting with an in-memory Caffeine cache.
7. Validate bookmark creation: course/department relationship, semester code, normalized section, and duplicate-insert races.
8. Add versioned database migrations with Flyway or Liquibase.
9. Add GitHub Actions CI for frontend lint/build and backend test/build on pull requests.
10. Redesign support from one-shot submissions into ticket threads with messages, statuses, delivery results, and a clearer admin workflow.
11. Decide and implement inbound support-email handling: a managed mailbox workflow or inbound-email/webhook ingestion into tickets.
12. Track email outcomes explicitly; do not equate an attempted Resend call with successful delivery.
13. Add an explicit, role-aware Admin navigation link for administrators while retaining backend role checks.
14. Redesign the admin Test page into a safer operations/diagnostics area, with confirmation for consequential actions.
15. Decide whether the backend remains JAR-on-Elastic-Beanstalk or becomes Docker-on-Elastic-Beanstalk/ECR.
16. Document the final Docker, Supabase, and local-development workflow in `README.md` after the local Dashboard flow is verified.
17. Add frontend component tests and a small end-to-end suite for critical user flows.
18. Standardize Python ingestion-script configuration, credential handling, execution instructions, and data-safety expectations.
19. Review and test the Supabase `auth.users` SQL dependency used by admin reporting, including required database permissions.
20. Improve observability for CourseSys and email: structured failures, latency visibility, and meaningful health checks.
21. Review CORS and production security configuration, especially allowed origins and environment-secret handling.

Start with item 1. It creates the safety net required for the known semester defect and for subsequent CourseSys, bookmark, support, and email work.
