'use strict';

require('dotenv').config();
const { getDb, initializeDatabase, closeDb } = require('../data/db');

async function main() {
  await initializeDatabase();
  const db = getDb();

  const tables = await db.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'electoral_areas','polling_stations','delegate_categories',
        'survey_records','activity_logs','delegates'
      )
    ORDER BY 1
  `);
  console.log('tables', tables.rows.map((r) => r.table_name));

  const cols = await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'delegates'
      AND column_name IN (
        'delegate_code','electoral_area_id','polling_station_id','category_id',
        'current_status','current_confidence','last_contacted_at','next_follow_up_at',
        'notes','is_active','created_at','updated_at'
      )
    ORDER BY 1
  `);
  console.log('delegate_new_columns', cols.rows.map((r) => r.column_name));

  const areas = await db.query('SELECT COUNT(1)::int AS n FROM electoral_areas');
  const cats = await db.query('SELECT COUNT(1)::int AS n FROM delegate_categories');
  const dels = await db.query(`
    SELECT COUNT(1)::int AS total,
           COUNT(delegate_code)::int AS with_code
    FROM delegates
  `);
  console.log('electoral_areas', areas.rows[0].n);
  console.log('delegate_categories', cats.rows[0].n);
  console.log('delegates', dels.rows[0]);

  const fks = await db.query(`
    SELECT conname FROM pg_constraint
    WHERE conname LIKE 'delegates_%_fkey'
       OR conname LIKE 'polling_stations_%'
       OR conname LIKE 'survey_records_%'
    ORDER BY 1
  `);
  console.log('fks', fks.rows.map((r) => r.conname));

  await closeDb();
  console.log('Phase 1 DB validation OK');
}

main().catch(async (err) => {
  console.error('Phase 1 DB validation FAILED:', err.message);
  try {
    await closeDb();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
