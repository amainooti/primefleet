# Client portals

Public, link-shared client dashboards (the "MR1 Enterprises"-style portal).

| Route | Who | What |
|---|---|---|
| `/portal/new` | anyone (no login) | Form to create a portal, with document uploads |
| `/portal/<slug>` | anyone with the link | Read-only dashboard — **the link to share** |
| `/portal/<slug>?key=<manageKey>` | creator only | Same dashboard + upload / delete docs, mark steps done, copy links |
| `/portal/<slug>/edit?key=<manageKey>` | creator only | Edit every field, add documents |
| `/portal/<slug>/files/<docId>` | anyone with the link | Document download/preview |
| `/admin/portals` | admin | List and delete portals |

- `slug` is a random 128-bit token (not guessable). The manage key is a random 192-bit
  secret; only its SHA-256 hash is stored, so it **cannot be recovered** — it is shown
  once (it's the address of the page the creator lands on after creating).
- Files are stored **outside `public/`** in `PORTAL_UPLOAD_DIR` (default `./storage/portal`)
  and are only served through the download route. Type is checked by magic bytes
  (PDF/JPG/PNG/WEBP/DOCX), 10MB max each, 25 per portal, 4 per submit.
- Abuse protection on the public routes: honeypot field + in-memory rate limits
  (5 portals/hour/IP, 20 uploads/hour/IP). Portal pages send `noindex`.

## Deploy checklist
1. `npx prisma migrate deploy` (adds Portal, PortalStep, PortalCharge, PortalDocument).
2. Persist uploads: `docker-compose.yml` now mounts `./storage:/app/storage`.
   On the VPS: `mkdir -p storage && sudo chown -R 1001:1001 storage`.
3. If nginx fronts the app, allow big bodies: `client_max_body_size 50m;`
   (Server Actions body limit is set to 45mb in `next.config.ts`).
