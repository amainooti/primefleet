# PRIME FLEET — ENGINEERING BUILD SPECIFICATION

## Role

You are the principal software architect and senior full-stack engineer
responsible for building Prime Fleet.

Prime Fleet is a fleet inventory/catalogue platform.

The platform is inspired by the information architecture and usability
patterns of commercial truck/equipment marketplaces such as Truck Paper,
but Prime Fleet is NOT a multi-vendor marketplace.

Prime Fleet itself is the only inventory owner.

There is one administrator who manages the entire inventory.

Public users do not create accounts and do not create listings.

---

# PRODUCT GOAL

Build a production-quality web application where users can:

- Browse fleet inventory
- Search inventory
- Filter inventory
- Sort inventory
- View individual truck/equipment listings
- View specifications
- View images
- View listing availability/status
- Contact Prime Fleet

The administrator can:

- Login
- Create listings
- Edit listings
- Archive/delete listings
- Manage specifications
- Manage images
- Change inventory status
- Search and manage the inventory

---

# TECHNOLOGY

Use:

- Next.js
- TypeScript
- React
- App Router
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- Docker

Prefer Next.js server-side capabilities instead of creating a separate
backend service unless there is a strong architectural reason to do so.

Do not introduce unnecessary infrastructure.

---

# AUTHENTICATION

There is exactly one administrator.

Do NOT implement:

- User registration
- Vendor accounts
- Multiple roles
- Organization management
- OAuth
- Complex RBAC

Implement a secure admin login using an environment-provided secret.

Example:

ADMIN_PASSWORD_HASH=...

Use secure HTTP-only session cookies.

Admin routes must be protected server-side.

Never expose administrator credentials to the client.

Never hardcode credentials.

---

# DATABASE

Use PostgreSQL with Prisma.

The initial domain model should support:

- Truck/listing
- Category
- Images
- Specifications
- Admin/session information where required

The Truck entity should contain core searchable fields such as:

- id
- slug
- stock number
- year
- manufacturer
- model
- title
- description
- category
- condition
- status
- price
- location
- createdAt
- updatedAt

Do not create an unnecessarily enormous Truck table containing every
possible specification.

Use a flexible specification model for category-specific attributes.

Example:

Specification:

- id
- truckId
- group
- name
- value
- sortOrder

Core fields that are frequently searched/filtered should remain first-class
database fields.

---

# INVENTORY STATUS

Support at minimum:

- AVAILABLE
- RESERVED
- SOLD
- ARCHIVED

Status must be represented consistently throughout the application.

Archived listings should not appear in normal public inventory searches.

---

# IMAGES

Images must be associated with listings through a TruckImage entity.

Support:

- URL/path
- alt text
- sort order
- primary image

Do not store image binary data in PostgreSQL.

Create a storage abstraction so local VPS storage can be used initially
while allowing future migration to S3/R2/etc.

---

# PUBLIC ROUTES

Implement clean routes such as:

/
 /trucks
 /trucks/[slug]
 /categories/[slug]

The exact route structure may be adjusted if architectural analysis
suggests a better approach.

Individual listing URLs must be stable and human-readable.

---

# ADMIN ROUTES

Implement:

/admin/login
/admin
/admin/trucks
/admin/trucks/new
/admin/trucks/[id]/edit

Admin UI should allow full CRUD functionality.

---

# SEARCH

Public users should be able to search by relevant listing information,
including:

- manufacturer
- model
- title
- stock number
- description

Start with PostgreSQL-based search.

Do not introduce Elasticsearch, OpenSearch, Algolia, Meilisearch, etc.
unless the application requirements actually justify it.

Search must be designed so that additional searchable fields can be
added without major architectural changes.

---

# FILTERING

Support filters appropriate to the inventory.

Initial filters may include:

- Category
- Manufacturer
- Year
- Condition
- Status
- Price
- Location

Only expose filters that make sense for the actual inventory schema.

---

# UI / BRAND

Brand direction:

- Gold
- White
- Black

The visual design should feel:

- premium
- industrial
- trustworthy
- modern
- clean
- professional

White should be the primary content/background color.

Black should provide structure, typography, navigation, and contrast.

Gold should be used as an accent rather than overwhelming the interface.

Do not blindly copy Truck Paper's UI.

Use it only as inspiration for catalogue/search/detail-page information
architecture.

---

# RESPONSIVENESS

The application must work properly on:

- Desktop
- Tablet
- Mobile

The public catalogue is particularly important on mobile.

---

# SEO

Public listing pages should support:

- Metadata
- Open Graph metadata
- Canonical URLs
- Sitemap
- robots.txt
- Structured data where appropriate

Listing pages should be indexable by search engines.

Admin pages must not be indexed.

---

# PERFORMANCE

Prefer:

- Server Components where appropriate
- Server-side data fetching
- Pagination
- Database indexes
- Optimized images
- Minimal client-side JavaScript
- Lazy loading where appropriate

Do not build everything as a client component.

---

# SECURITY

Follow standard production security practices.

Protect:

- Admin routes
- Admin session cookies
- Database credentials
- Image upload endpoints
- Server actions
- API endpoints

Validate all admin input server-side.

Never trust client-side validation alone.

Prevent unauthorized mutation of inventory.

Do not expose PostgreSQL publicly in production.

---

# DOCKER

The application must be containerizable.

Expected production architecture:

Internet
    |
Cloudflare
    |
Nginx
    |
Next.js container
    |
PostgreSQL container

PostgreSQL should communicate with the application over an internal
Docker network.

Do not unnecessarily expose PostgreSQL to the public internet.

---

# VPS

The eventual deployment target is a Linux VPS.

The developer currently accesses the VPS using:

ssh vps

Do not assume that the VPS filesystem, existing containers, domains,
Nginx configuration, or environment variables should be modified during
development.

Deployment should be treated as a separate phase.

Never destroy or modify unrelated containers.

Before deployment, inspect the existing environment.

---

# EXISTING VPS CONTEXT

The VPS already runs several Docker containers.

Do not assume ownership of existing infrastructure.

Before deploying Prime Fleet:

- Inspect Docker networks
- Inspect running containers
- Inspect existing PostgreSQL instances
- Inspect available disk space
- Inspect available RAM
- Inspect Nginx configuration
- Inspect existing domains
- Determine whether a dedicated PostgreSQL container/database is preferable

Do not expose ports unnecessarily.

---

# DEVELOPMENT PROCESS

IMPORTANT:

Do NOT build the entire application in one shot.

Work in explicit phases.

Before implementing each phase:

1. Inspect the current repository.
2. Understand existing architecture.
3. State what will be changed.
4. Implement only that phase.
5. Run TypeScript checks.
6. Run linting.
7. Run relevant tests.
8. Review the resulting code.
9. Document important architectural decisions.
10. Only then proceed to the next phase.

Do not rewrite working code unnecessarily.

Do not introduce dependencies without justification.

---

# PHASES

## Phase 0 — Architecture

Do not build the application yet.

Produce:

ARCHITECTURE.md

It should document:

- Product architecture
- Domain model
- Database design
- Authentication strategy
- Image storage strategy
- Search strategy
- Route structure
- Component structure
- Docker architecture
- Deployment strategy
- Security model
- Future scaling considerations

Identify architectural risks before implementation.

---

## Phase 1 — Project Foundation

Set up:

- Next.js
- TypeScript
- Tailwind
- Prisma
- PostgreSQL configuration
- Environment configuration
- Docker development environment

Create:

.env.example

Do not commit secrets.

---

## Phase 2 — Database

Design Prisma schema.

Create migrations.

Create seed data.

Seed realistic sample listings such as:

2027 BENSON 48 ft x 102 in Aluminum

Include representative specifications.

---

## Phase 3 — Admin Authentication

Implement:

/admin/login

Secure admin session.

Protect all /admin routes.

Test:

- successful login
- invalid password
- expired session
- unauthorized access

---

## Phase 4 — Admin CRUD

Implement complete inventory management.

Admin must be able to:

- Create
- Read
- Update
- Archive/delete

listings.

Build validation.

---

## Phase 5 — Image Management

Implement listing image management.

Support:

- Upload
- Delete
- Reorder
- Primary image

Keep storage behind an abstraction.

---

## Phase 6 — Public Inventory

Implement:

/trucks

and:

/trucks/[slug]

Build:

- Listing cards
- Listing details
- Specification display
- Image gallery
- Status
- Pagination

---

## Phase 7 — Search and Filters

Implement:

- Search
- Filtering
- Sorting
- Pagination
- Empty states

Keep queries efficient and indexed.

---

## Phase 8 — Design System

Apply Prime Fleet visual identity.

Palette:

Gold
White
Black

Create reusable components for:

- Buttons
- Inputs
- Cards
- Badges
- Tables
- Filters
- Modals
- Forms
- Navigation
- Specification tables

---

## Phase 9 — SEO / Performance

Implement:

- Metadata
- Open Graph
- Sitemap
- robots.txt
- Structured data
- Image optimization
- Performance improvements

---

## Phase 10 — Production Deployment

Create production Docker configuration.

Document:

- Build
- Start
- Migration
- Seed
- Backup
- Restore
- Logs
- Health checks

Then inspect the VPS before deployment.

Do not modify unrelated infrastructure.

---

# CODE QUALITY

Prefer simple, understandable code over clever abstractions.

Use strict TypeScript.

Avoid any unless absolutely necessary.

Validate external input.

Keep business logic separate from UI components.

Use reusable services for:

- inventory
- search
- storage
- authentication

Do not put database logic throughout React components.

---

# IMPORTANT ENGINEERING PRINCIPLE

The first version should be intentionally boring.

The goal is not to build Truck Paper.

The goal is to build a clean Prime Fleet inventory platform that can later
grow into:

- Thousands of listings
- Multiple categories
- Advanced search
- Saved searches
- Inquiry management
- Analytics
- Featured inventory
- Financing integrations
- Dealer integrations if ever required

But none of those should be implemented until the core inventory system
is stable.

When uncertain, prefer the smallest architecture that correctly solves
the current requirement.