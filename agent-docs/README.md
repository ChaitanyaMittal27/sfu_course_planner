# Agent knowledge base

This directory captures system behavior that is distributed across the Spring API, Next.js app, Supabase schema assumptions, and external integrations. It complements—not replaces—[the repository guidance](AGENTS.md).

Read the document that matches the change:

| Change area | Start here |
| --- | --- |
| Cross-application change or feature planning | [Architecture and flows](architecture-and-flows.md) |
| API contract, authentication, dashboard, or admin UI | [Frontend, API, and access control](frontend-api-and-access.md) |
| Courses, terms, graphs, or external data | [Course data and semesters](course-data-and-semesters.md) |
| Email, admin actions, database ingestion, or validation | [Operations and maintenance](operations-and-maintenance.md) |
| Project-specific implementation and test conventions | [Coding standards](coding-standards.md) |
| Conflicting documentation or known implementation hazards | [Discrepancies and hazards](discrepancies-and-hazards.md) |

These documents describe verified implementation behavior as of their creation. They deliberately omit endpoint-by-endpoint and field-by-field reference material; source and DTOs remain the authority for exact shapes.
