# Architecture Decisions

## ADR-001 — Backend

Decision:
Use Next.js server-side functionality rather than a separate API server.

Reason:
The initial product does not require an independent backend service.

## ADR-002 — Database

Decision:
PostgreSQL + Prisma.

Reason:
Strong relational model, excellent filtering/query capability,
mature ecosystem.

## ADR-003 — Authentication

Decision:
Single administrator with password authentication.

Reason:
There is currently only one administrator.

## ADR-004 — Images

Decision:
Store image metadata in PostgreSQL and image files in external/local
storage.

Reason:
Avoid bloating the relational database and allow future migration
to object storage.