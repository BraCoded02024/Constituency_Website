'use strict';

const { uuidv4 } = require('../lib/uuid');

const INITIAL_ELECTORAL_AREAS = [
  { name: 'New Dormaa', code: 'ND' },
  { name: 'Berekuum Road', code: 'BR' },
  { name: 'Atronie', code: 'AT' },
  { name: 'Abesim', code: 'AB' },
  { name: 'Bro / Nkrankwanta', code: 'BN' },
];

const INITIAL_CATEGORIES = [
  { name: 'Polling Station Executive', description: 'Executives at the polling station level' },
  { name: 'Electoral Area Coordinator', description: 'Coordinators for an electoral area' },
  { name: 'Youth Delegate', description: 'Youth wing delegates' },
  { name: 'Women Delegate', description: 'Women wing delegates' },
  { name: 'Opinion Leader', description: 'Community opinion leaders' },
  { name: 'Party Executive', description: 'Party executives' },
];

async function ensureConstraint(db, constraintName, sql) {
  const { rows } = await db.query('SELECT 1 FROM pg_constraint WHERE conname = $1', [constraintName]);
  if (rows.length === 0) {
    await db.query(sql);
  }
}

async function ensureIndex(db, sql) {
  await db.query(
    sql
      .replace('CREATE UNIQUE INDEX ', 'CREATE UNIQUE INDEX IF NOT EXISTS ')
      .replace('CREATE INDEX ', 'CREATE INDEX IF NOT EXISTS '),
  );
}

/**
 * Phase 1 — extend existing DB for delegate management / survey.
 * Idempotent: safe to run on every boot. Preserves all existing delegate rows.
 */
async function ensureDelegateSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS electoral_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS polling_stations (
      id TEXT PRIMARY KEY,
      electoral_area_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS delegate_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS survey_records (
      id TEXT PRIMARY KEY,
      delegate_id TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'High',
      last_contacted_at TEXT NOT NULL,
      next_follow_up_at TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sms_messages (
      id TEXT PRIMARY KEY,
      delegate_id TEXT,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      provider_id TEXT,
      error TEXT,
      sent_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_name TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Extend existing delegates table (never drop / recreate)
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS delegate_code TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS electoral_area_id TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS polling_station_id TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS category_id TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS current_status TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS current_confidence TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS last_contacted_at TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS next_follow_up_at TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS notes TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS created_at TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS updated_at TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS age INTEGER');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS level TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS position TEXT');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false');
  await db.query('ALTER TABLE delegates ADD COLUMN IF NOT EXISTS source_no INTEGER');

  await ensureIndex(db, 'CREATE UNIQUE INDEX uq_electoral_areas_name ON electoral_areas (LOWER(name))');
  await ensureIndex(db, 'CREATE UNIQUE INDEX uq_delegate_categories_name ON delegate_categories (LOWER(name))');
  await ensureIndex(
    db,
    'CREATE UNIQUE INDEX uq_delegates_delegate_code ON delegates (delegate_code) WHERE delegate_code IS NOT NULL',
  );
  await db.query('DROP INDEX IF EXISTS uq_polling_stations_area_name');
  await ensureIndex(
    db,
    'CREATE UNIQUE INDEX uq_polling_stations_area_name_code ON polling_stations (electoral_area_id, LOWER(name), LOWER(COALESCE(code, \'\')))',
  );
  await ensureIndex(
    db,
    `CREATE UNIQUE INDEX uq_polling_stations_code ON polling_stations (LOWER(code))
     WHERE code IS NOT NULL AND code <> ''`,
  );

  await ensureIndex(db, 'CREATE INDEX idx_polling_stations_area ON polling_stations (electoral_area_id)');
  await ensureIndex(db, 'CREATE INDEX idx_delegates_area ON delegates (electoral_area_id)');
  await ensureIndex(db, 'CREATE INDEX idx_delegates_station ON delegates (polling_station_id)');
  await ensureIndex(db, 'CREATE INDEX idx_delegates_category ON delegates (category_id)');
  await ensureIndex(db, 'CREATE INDEX idx_delegates_current_status ON delegates (current_status)');
  await ensureIndex(
    db,
    'CREATE INDEX idx_survey_records_delegate ON survey_records (delegate_id, created_at DESC)',
  );
  await ensureIndex(db, 'CREATE INDEX idx_survey_records_created_by ON survey_records (created_by)');
  await ensureIndex(db, 'CREATE INDEX idx_activity_logs_entity ON activity_logs (entity, entity_id)');
  await ensureIndex(db, 'CREATE INDEX idx_activity_logs_created ON activity_logs (created_at DESC)');
  await ensureIndex(db, 'CREATE INDEX idx_sms_messages_delegate ON sms_messages (delegate_id, created_at DESC)');
  await ensureIndex(db, 'CREATE INDEX idx_sms_messages_created ON sms_messages (created_at DESC)');

  await ensureConstraint(
    db,
    'polling_stations_electoral_area_id_fkey',
    `ALTER TABLE polling_stations
       ADD CONSTRAINT polling_stations_electoral_area_id_fkey
       FOREIGN KEY (electoral_area_id) REFERENCES electoral_areas(id) ON DELETE RESTRICT`,
  );
  await ensureConstraint(
    db,
    'delegates_electoral_area_id_fkey',
    `ALTER TABLE delegates
       ADD CONSTRAINT delegates_electoral_area_id_fkey
       FOREIGN KEY (electoral_area_id) REFERENCES electoral_areas(id) ON DELETE SET NULL`,
  );
  await ensureConstraint(
    db,
    'delegates_polling_station_id_fkey',
    `ALTER TABLE delegates
       ADD CONSTRAINT delegates_polling_station_id_fkey
       FOREIGN KEY (polling_station_id) REFERENCES polling_stations(id) ON DELETE SET NULL`,
  );
  await ensureConstraint(
    db,
    'delegates_category_id_fkey',
    `ALTER TABLE delegates
       ADD CONSTRAINT delegates_category_id_fkey
       FOREIGN KEY (category_id) REFERENCES delegate_categories(id) ON DELETE SET NULL`,
  );
  await ensureConstraint(
    db,
    'survey_records_delegate_id_fkey',
    `ALTER TABLE survey_records
       ADD CONSTRAINT survey_records_delegate_id_fkey
       FOREIGN KEY (delegate_id) REFERENCES delegates(id) ON DELETE CASCADE`,
  );
  await ensureConstraint(
    db,
    'survey_records_created_by_fkey',
    `ALTER TABLE survey_records
       ADD CONSTRAINT survey_records_created_by_fkey
       FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL`,
  );

  await db.query(`
    UPDATE delegates
    SET created_at = COALESCE(created_at, registered_at, TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD'))
    WHERE created_at IS NULL
  `);

  // Assign codes without deleting rows; leave structured FKs null if unmapped (safe)
  await db.query(`
    WITH numbered AS (
      SELECT id,
             ROW_NUMBER() OVER (ORDER BY registered_at ASC NULLS LAST, id ASC) AS rn
      FROM delegates
      WHERE delegate_code IS NULL OR TRIM(delegate_code) = ''
    ),
    max_existing AS (
      SELECT COALESCE(MAX(CAST(SUBSTRING(delegate_code FROM 5) AS INTEGER)), 0) AS max_n
      FROM delegates
      WHERE delegate_code ~ '^DEL-[0-9]+$'
    )
    UPDATE delegates d
    SET delegate_code = 'DEL-' || LPAD((m.max_n + n.rn)::text, 5, '0'),
        updated_at = TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    FROM numbered n, max_existing m
    WHERE d.id = n.id
  `);

  await seedReferenceData(db);
}

async function seedReferenceData(db) {
  const areaCount = await db.query('SELECT COUNT(*)::int AS n FROM electoral_areas');
  if (areaCount.rows[0].n === 0) {
    const now = new Date().toISOString();
    for (const area of INITIAL_ELECTORAL_AREAS) {
      await db.query(
        `INSERT INTO electoral_areas (id, name, code, description, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,true,$5,$5)`,
        [uuidv4(), area.name, area.code, null, now],
      );
    }
    console.log(`Seeded ${INITIAL_ELECTORAL_AREAS.length} electoral areas`);
  }

  const catCount = await db.query('SELECT COUNT(*)::int AS n FROM delegate_categories');
  if (catCount.rows[0].n === 0) {
    const now = new Date().toISOString();
    for (const cat of INITIAL_CATEGORIES) {
      await db.query(
        `INSERT INTO delegate_categories (id, name, description, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,true,$4,$4)`,
        [uuidv4(), cat.name, cat.description, now],
      );
    }
    console.log(`Seeded ${INITIAL_CATEGORIES.length} delegate categories`);
  }
}

module.exports = {
  ensureDelegateSchema,
  INITIAL_ELECTORAL_AREAS,
  INITIAL_CATEGORIES,
};
