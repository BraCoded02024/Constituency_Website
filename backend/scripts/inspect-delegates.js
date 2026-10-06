'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const count = await pool.query('SELECT COUNT(*)::int AS n FROM delegates');
  console.log('delegate_count', count.rows[0].n);

  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delegates'
    ORDER BY ordinal_position
  `);
  console.log('columns', JSON.stringify(cols.rows, null, 2));

  const sample = await pool.query(`
    SELECT id, full_name, polling_station_name, polling_station_code, community, status, registered_at
    FROM delegates
    ORDER BY registered_at DESC NULLS LAST
    LIMIT 20
  `);
  console.log('sample', JSON.stringify(sample.rows, null, 2));

  const stations = await pool.query(`
    SELECT polling_station_name, polling_station_code, COUNT(*)::int AS n
    FROM delegates
    GROUP BY 1, 2
    ORDER BY n DESC
    LIMIT 40
  `);
  console.log('stations', JSON.stringify(stations.rows, null, 2));

  const communities = await pool.query(`
    SELECT community, COUNT(*)::int AS n
    FROM delegates
    GROUP BY 1
    ORDER BY n DESC
    LIMIT 40
  `);
  console.log('communities', JSON.stringify(communities.rows, null, 2));

  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY 1
  `);
  console.log('tables', tables.rows.map((r) => r.table_name).join(', '));

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
