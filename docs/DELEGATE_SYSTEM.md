# Delegate Management & Survey — Architecture (Phase 1)

Unified module inside the existing Sunyani East Constituency platform.

## Principles

- **One** PostgreSQL/Supabase database (extend, do not replace)
- **One** existing `delegates` table (extend columns; never recreate)
- **One** Express backend + Next.js admin portal
- **One** admin auth system (`admins` + JWT + bcrypt + privileges)

Flutter / separate survey portals are out of scope.

## Schema (same database)

| Table | Role |
|-------|------|
| `electoral_areas` | Electoral areas (seeded: New Dormaa, Berekuum Road, Atronie, Abesim, Bro / Nkrankwanta) |
| `polling_stations` | Stations belonging to an area (`electoral_area_id` FK, `ON DELETE RESTRICT`) |
| `delegate_categories` | Configurable categories (seeded) |
| `delegates` | **Existing table**, extended with codes, FKs, survey snapshot fields |
| `survey_records` | Append-only survey history (`created_by` → `admins`) |
| `activity_logs` | Audit trail (no passwords / Ghana Card / secrets) |

### Delegates extensions

- `delegate_code` — unique `DEL-00001` style (backfilled on migrate)
- `electoral_area_id`, `polling_station_id`, `category_id` — nullable until mapped
- Legacy `polling_station_name` / `polling_station_code` preserved
- `current_status`, `current_confidence`, `last_contacted_at`, `next_follow_up_at`, `notes`
- `is_active`, `created_at`, `updated_at`

Migration runs idempotently via `backend/data/delegateSchema.js` from `initializeDatabase()`.

Unmapped legacy station text is **not guessed** into areas; structured FKs stay null until an admin maps them.

## Authorization

All delegate-module routes require:

1. Valid JWT (`authenticateToken`)
2. Privilege `delegates` (`authorizePrivilege('delegates')`) — same privilege as nav

Applies to: `/api/delegates`, `/api/electoral-areas`, `/api/polling-stations`, `/api/delegate-categories`, `/api/delegate-dashboard`, `/api/activity`.

## Foundation API routes

| Method | Path | Notes |
|--------|------|-------|
| CRUD | `/api/electoral-areas` | No hard delete in Phase 1 |
| CRUD | `/api/polling-stations` | Filter `?electoralAreaId=` |
| CRUD | `/api/delegate-categories` | |
| CRUD + import | `/api/delegates` | Codes generated server-side |
| GET/POST | `/api/delegates/:id/surveys` | Append-only + updates current state in one transaction |
| GET | `/api/delegate-dashboard/stats` | Live aggregates |
| GET | `/api/activity` | Filtered activity log |

## Survey transaction

```
BEGIN
  INSERT survey_records (created_by = JWT admin id)
  UPDATE delegates current_* fields
  INSERT activity_logs
COMMIT
```

## Admin routes (Phase 2)

| Path | Purpose |
|------|---------|
| `/admin/delegates` | Paginated list, filters, import |
| `/admin/delegates/new` | Create delegate |
| `/admin/delegates/:id` | Profile + survey history |
| `/admin/delegates/:id/edit` | Edit profile (no survey overwrite) |
| `/admin/delegates/:id/survey` | Record survey (append-only) |
| `/admin/survey-dashboard` | Live survey analytics & classifications |
| `/admin/electoral-areas` | Area CRUD (activate/deactivate) |
| `/admin/polling-stations` | Station CRUD |
| `/admin/delegate-categories` | Category CRUD |

All require privilege `delegates`.

## Survey analytics (Phase 3)

`GET /api/delegate-dashboard/stats` returns live aggregates:

- Totals: total / surveyed / not surveyed / supporting / not supporting / floating
- Breakdowns: electoral area, polling station, category, survey officer
- Recent surveys (latest 15)
- Descriptive classifications (of **surveyed** within each area):
  - Strong Areas: Supporting ≥ 50%
  - Needs Attention: Not Supporting ≥ 25%
  - Persuasion Areas: Floating ≥ 18%

## Reports & exports (Phase 4)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/delegate-reports` | Snapshot or historical report JSON (filters supported) |
| `GET /api/delegate-reports/export.csv` | Same filters → CSV (includes Ghana Card / voter ID; auth required) |

- **Snapshot** (no dates): uses `delegates.current_*`
- **Historical** (`from` / `to`): latest `survey_records` per delegate in range — not today's snapshot
- JSON report responses omit Ghana Card / voter ID; detail profile and CSV export include them for authorized officers
- Print/PDF via browser print on `/admin/delegate-reports`

## Security notes

- Delegate module routes: JWT + active admin check + `delegates` privilege
- Activity logs strip passwords, tokens, Ghana Card, voter IDs
- List endpoints omit sensitive ID fields; `GET /api/delegates/:id` includes them

## Local apply

With a working `DATABASE_URL`, start the backend (`npm start` in `backend/`). Schema migrate + seed + code backfill run on boot.

Inspect helpers: `backend/scripts/inspect-delegates.js`

## Permissions

Phase 1 keeps a single privilege: `delegates`. Finer-grained privileges can be added in Phase 4 if needed.
