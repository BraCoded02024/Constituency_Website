# Database schema inventory (from codebase)

Source of truth: `backend/data/database.js` + `backend/data/delegateSchema.js`.

## Existing platform tables

| Table | Created by |
|-------|------------|
| `admins` | `initializeDatabase` |
| `services` | `initializeDatabase` |
| `announcements` | `initializeDatabase` |
| `opportunities` | `initializeDatabase` |
| `projects` (+ `image` ALTER) | `initializeDatabase` |
| `events` | `initializeDatabase` |
| `constituents` | `initializeDatabase` |
| `concerns` | `initializeDatabase` |
| `concern_responses` | `initializeDatabase` (FK → concerns) |
| `volunteers` | `initializeDatabase` |
| `gallery` | `initializeDatabase` |
| `success_stories` | `initializeDatabase` |
| `delegates` (base columns) | `initializeDatabase` |

Admin ALTERs: `privileges`, `is_active`. Role `admin` → `super_admin` with full privileges.

## Delegate Survey tables / extensions

| Table / change | Created by |
|----------------|------------|
| `electoral_areas` | `ensureDelegateSchema` |
| `polling_stations` | `ensureDelegateSchema` |
| `delegate_categories` | `ensureDelegateSchema` |
| `survey_records` | `ensureDelegateSchema` |
| `activity_logs` | `ensureDelegateSchema` |
| `delegates` extensions | ALTER IF NOT EXISTS: `delegate_code`, `electoral_area_id`, `polling_station_id`, `category_id`, `current_status`, `current_confidence`, `last_contacted_at`, `next_follow_up_at`, `notes`, `is_active`, `created_at`, `updated_at` |

Legacy kept: `polling_station_name`, `polling_station_code`.

## Foreign keys

- `polling_stations.electoral_area_id` → `electoral_areas(id)` ON DELETE RESTRICT
- `delegates.electoral_area_id` → `electoral_areas(id)` ON DELETE SET NULL
- `delegates.polling_station_id` → `polling_stations(id)` ON DELETE SET NULL
- `delegates.category_id` → `delegate_categories(id)` ON DELETE SET NULL
- `survey_records.delegate_id` → `delegates(id)` ON DELETE CASCADE
- `survey_records.created_by` → `admins(id)` ON DELETE SET NULL

## Seed behavior (idempotent)

- Admin: only if `admins` count = 0 (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Electoral areas / categories: only if those tables are empty
- Demo CMS content: skipped when `VERCEL=1`; seeded locally when admins empty

## Init safety

- `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`
- Unique indexes / FKs added only if missing
- No DROP TABLE
- Safe on empty database

## Auth

Express JWT + bcrypt `admins` table. Not Supabase Auth.
