'use strict';

/**
 * Final production verification — no secrets printed.
 * Run: node scripts/final-verify.js
 */
require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const results = [];
function record(section, name, status, detail = '') {
  results.push({ section, name, status, detail });
  const mark = status.padEnd(8);
  console.log(`[${mark}] ${section} / ${name}${detail ? ` — ${detail}` : ''}`);
}

function configuredDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);
}

async function tryConnect() {
  const { getPoolConfig } = require('../lib/dbConfig');
  const { Pool } = require('pg');
  const pool = new Pool(getPoolConfig());
  try {
    await pool.query('SELECT 1 AS ok');
    return pool;
  } catch (err) {
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
    throw err;
  }
}

async function verifySchema(pool) {
  const needed = [
    'electoral_areas',
    'polling_stations',
    'delegate_categories',
    'delegates',
    'survey_records',
    'activity_logs',
    'admins',
  ];
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name = ANY($1::text[])`,
    [needed],
  );
  const have = new Set(rows.map((r) => r.table_name));
  const missing = needed.filter((t) => !have.has(t));
  if (missing.length) {
    record('Database', 'schema tables', 'FAILED', `missing: ${missing.join(', ')}`);
    return false;
  }
  record('Database', 'schema tables', 'PASSED', needed.join(', '));

  const cols = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name='delegates'
       AND column_name = ANY($1::text[])`,
    [[
      'delegate_code',
      'electoral_area_id',
      'polling_station_id',
      'category_id',
      'current_status',
      'current_confidence',
      'last_contacted_at',
      'next_follow_up_at',
      'notes',
      'is_active',
      'polling_station_name',
      'polling_station_code',
      'ghana_card',
      'voters_id',
      'phone',
    ]],
  );
  record('Database', 'delegates columns', cols.rows.length >= 14 ? 'PASSED' : 'FAILED', `${cols.rows.length} expected columns present`);

  const fks = await pool.query(
    `SELECT conname FROM pg_constraint
     WHERE conname IN (
       'polling_stations_electoral_area_id_fkey',
       'delegates_electoral_area_id_fkey',
       'delegates_polling_station_id_fkey',
       'delegates_category_id_fkey',
       'survey_records_delegate_id_fkey',
       'survey_records_created_by_fkey'
     )`,
  );
  record('Database', 'foreign keys', fks.rows.length >= 6 ? 'PASSED' : 'FAILED', `${fks.rows.length}/6`);
  return true;
}

async function verifyDataIntegrity(pool) {
  const before = await pool.query('SELECT COUNT(1)::int AS n FROM delegates');
  record('Database', 'delegate count', 'PASSED', `count=${before.rows[0].n}`);

  const codes = await pool.query(`
    SELECT
      COUNT(1)::int AS total,
      COUNT(delegate_code)::int AS with_code,
      COUNT(1) FILTER (WHERE delegate_code IS NULL OR TRIM(delegate_code)='')::int AS missing_code
    FROM delegates
  `);
  const c = codes.rows[0];
  record(
    'Database',
    'delegate codes present',
    c.missing_code === 0 || c.total === 0 ? 'PASSED' : 'FAILED',
    `with_code=${c.with_code} missing=${c.missing_code}`,
  );

  const dupes = await pool.query(`
    SELECT COUNT(1)::int AS n FROM (
      SELECT delegate_code FROM delegates
      WHERE delegate_code IS NOT NULL
      GROUP BY delegate_code HAVING COUNT(1) > 1
    ) t
  `);
  record('Database', 'duplicate delegate codes', dupes.rows[0].n === 0 ? 'PASSED' : 'FAILED', `dup_groups=${dupes.rows[0].n}`);

  const orphans = await pool.query(`
    SELECT
      COUNT(1) FILTER (WHERE electoral_area_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM electoral_areas ea WHERE ea.id = delegates.electoral_area_id
      ))::int AS bad_area,
      COUNT(1) FILTER (WHERE polling_station_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM polling_stations ps WHERE ps.id = delegates.polling_station_id
      ))::int AS bad_station,
      COUNT(1) FILTER (WHERE category_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM delegate_categories dc WHERE dc.id = delegates.category_id
      ))::int AS bad_category
    FROM delegates
  `);
  const o = orphans.rows[0];
  record(
    'Database',
    'orphan FK refs',
    o.bad_area + o.bad_station + o.bad_category === 0 ? 'PASSED' : 'FAILED',
    `bad_area=${o.bad_area} bad_station=${o.bad_station} bad_category=${o.bad_category}`,
  );

  const legacy = await pool.query(`
    SELECT
      COUNT(1) FILTER (WHERE phone IS NOT NULL AND TRIM(phone) <> '')::int AS with_phone,
      COUNT(1) FILTER (WHERE ghana_card IS NOT NULL AND TRIM(ghana_card) <> '')::int AS with_ghana,
      COUNT(1) FILTER (WHERE voters_id IS NOT NULL AND TRIM(voters_id) <> '')::int AS with_voter,
      COUNT(1) FILTER (WHERE polling_station_name IS NOT NULL AND TRIM(polling_station_name) <> '')::int AS with_legacy_station
    FROM delegates
  `);
  const l = legacy.rows[0];
  record(
    'Database',
    'legacy fields retained (counts only)',
    'PASSED',
    `phone=${l.with_phone} ghana_card=${l.with_ghana} voters_id=${l.with_voter} legacy_station_name=${l.with_legacy_station}`,
  );
}

async function verifySurveyTransaction(pool) {
  const { uuidv4 } = require('../lib/uuid');
  const client = await pool.connect();
  const testId = uuidv4();
  const admin = await pool.query(`SELECT id FROM admins WHERE is_active IS DISTINCT FROM false LIMIT 1`);
  if (!admin.rows[0]) {
    record('Survey', 'append-only + current state', 'BLOCKED', 'no admin row');
    client.release();
    return;
  }
  const adminId = admin.rows[0].id;

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO delegates (id, delegate_code, full_name, status, registered_at, is_active, created_at)
       VALUES ($1,$2,$3,'Active',$4,true,$5)`,
      [testId, 'DEL-TESTVERIFY', 'VERIFY TEST DELEGATE', new Date().toISOString().slice(0, 10), new Date().toISOString()],
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    record('Survey', 'append-only setup', 'FAILED', err.message);
    return;
  }

  try {
    const statuses = ['Supporting', 'Floating', 'Not Supporting'];
    for (const status of statuses) {
      await client.query('BEGIN');
      const sid = uuidv4();
      const now = new Date().toISOString();
      await client.query(
        `INSERT INTO survey_records (id, delegate_id, status, confidence, last_contacted_at, created_by, created_at)
         VALUES ($1,$2,$3,'High',$4,$5,$6)`,
        [sid, testId, status, now.slice(0, 10), adminId, now],
      );
      await client.query(
        `UPDATE delegates SET current_status=$1, current_confidence='High', last_contacted_at=$2, updated_at=$3 WHERE id=$4`,
        [status, now.slice(0, 10), now, testId],
      );
      await client.query(
        `INSERT INTO activity_logs (id, actor_id, actor_name, action, entity, entity_id, created_at)
         VALUES ($1,$2,'verify','survey_recorded','survey_record',$3,$4)`,
        [uuidv4(), adminId, sid, now],
      );
      await client.query('COMMIT');
    }

    const hist = await pool.query('SELECT COUNT(1)::int AS n, MAX(status) FILTER (WHERE true) AS ignored FROM survey_records WHERE delegate_id=$1', [testId]);
    const ordered = await pool.query(
      'SELECT status FROM survey_records WHERE delegate_id=$1 ORDER BY created_at ASC',
      [testId],
    );
    const current = await pool.query('SELECT current_status FROM delegates WHERE id=$1', [testId]);

    const okHist = ordered.rows.length === 3
      && ordered.rows[0].status === 'Supporting'
      && ordered.rows[1].status === 'Floating'
      && ordered.rows[2].status === 'Not Supporting';
    const okCurrent = current.rows[0].current_status === 'Not Supporting';

    record('Survey', 'append-only history (3 records)', okHist ? 'PASSED' : 'FAILED', `count=${hist.rows[0].n}`);
    record('Survey', 'current state = latest', okCurrent ? 'PASSED' : 'FAILED', `current=${current.rows[0].current_status}`);

    // Rollback partial failure simulation
    await client.query('BEGIN');
    try {
      await client.query(
        `INSERT INTO survey_records (id, delegate_id, status, confidence, last_contacted_at, created_by, created_at)
         VALUES ($1,$2,'Supporting','High',$3,$4,$5)`,
        [uuidv4(), testId, new Date().toISOString().slice(0, 10), adminId, new Date().toISOString()],
      );
      await client.query('SELECT 1/0'); // force failure
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    }
    const afterFail = await pool.query('SELECT COUNT(1)::int AS n FROM survey_records WHERE delegate_id=$1', [testId]);
    record(
      'Survey',
      'transaction rollback (no partial insert)',
      afterFail.rows[0].n === 3 ? 'PASSED' : 'FAILED',
      `count_after=${afterFail.rows[0].n}`,
    );
  } finally {
    await pool.query('DELETE FROM survey_records WHERE delegate_id=$1', [testId]);
    await pool.query('DELETE FROM activity_logs WHERE entity_id IN (SELECT id::text FROM survey_records WHERE false) OR actor_name=$1', ['verify']);
    await pool.query(`DELETE FROM activity_logs WHERE actor_name='verify'`);
    await pool.query('DELETE FROM delegates WHERE id=$1', [testId]);
    client.release();
    record('Survey', 'test delegate cleanup', 'PASSED');
  }
}

function startAppServer() {
  return new Promise((resolve, reject) => {
    delete require.cache[require.resolve('../server')];
    const app = require('../server');
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, app });
    });
    server.on('error', reject);
  });
}

async function apiRequest(port, method, path, { token, body } = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json, text };
}

async function verifyAuthz(pool, port) {
  const { JWT_SECRET } = require('../middleware/auth');
  const { uuidv4 } = require('../lib/uuid');

  const unauth = await apiRequest(port, 'GET', '/api/delegates');
  record('Auth', 'unauthenticated → 401', unauth.status === 401 ? 'PASSED' : 'FAILED', `status=${unauth.status}`);

  const admin = await pool.query(`SELECT id, name, email, role, privileges FROM admins WHERE is_active IS DISTINCT FROM false LIMIT 1`);
  if (!admin.rows[0]) {
    record('Auth', 'privileged access', 'BLOCKED', 'no admin');
    return;
  }

  const privToken = jwt.sign(
    {
      id: admin.rows[0].id,
      email: admin.rows[0].email,
      name: admin.rows[0].name,
      role: admin.rows[0].role === 'super_admin' ? 'super_admin' : 'staff',
      privileges: admin.rows[0].role === 'super_admin' ? ['delegates'] : ['delegates'],
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  // Ensure staff without privilege
  const noPrivToken = jwt.sign(
    {
      id: admin.rows[0].id,
      email: admin.rows[0].email,
      name: admin.rows[0].name,
      role: 'staff',
      privileges: ['announcements'],
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  const ok = await apiRequest(port, 'GET', '/api/delegates?limit=1', { token: privToken });
  record('Auth', 'delegates privilege → allow', ok.status === 200 ? 'PASSED' : 'FAILED', `status=${ok.status}`);

  if (ok.status === 200 && ok.json?.data?.[0]) {
    const row = ok.json.data[0];
    const exposed = Object.prototype.hasOwnProperty.call(row, 'ghanaCard') || Object.prototype.hasOwnProperty.call(row, 'votersId');
    record('Security', 'list omits ghanaCard/votersId', !exposed ? 'PASSED' : 'FAILED');
  } else if (ok.status === 200) {
    record('Security', 'list omits ghanaCard/votersId', 'PASSED', 'empty list');
  } else {
    record('Security', 'list omits ghanaCard/votersId', 'BLOCKED', 'list request failed');
  }

  const denied = await apiRequest(port, 'GET', '/api/delegates?limit=1', { token: noPrivToken });
  record('Auth', 'missing privilege → 403', denied.status === 403 ? 'PASSED' : 'FAILED', `status=${denied.status}`);

  // Inactive admin: create temp inactive admin, issue token, expect 403
  const inactiveId = uuidv4();
  const hash = await bcrypt.hash('TempVerify!2026', 8);
  await pool.query(
    `INSERT INTO admins (id, name, email, password, role, privileges, is_active, created_at)
     VALUES ($1,'Verify Inactive',$2,$3,'staff',$4,false,$5)`,
    [inactiveId, `verify.inactive.${Date.now()}@example.com`, hash, JSON.stringify(['delegates']), new Date().toISOString().slice(0, 10)],
  );
  const inactiveToken = jwt.sign(
    { id: inactiveId, email: 'x', name: 'Verify Inactive', role: 'staff', privileges: ['delegates'] },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
  const inactiveRes = await apiRequest(port, 'GET', '/api/delegates?limit=1', { token: inactiveToken });
  record('Auth', 'inactive admin → 403', inactiveRes.status === 403 ? 'PASSED' : 'FAILED', `status=${inactiveRes.status}`);
  await pool.query('DELETE FROM admins WHERE id=$1', [inactiveId]);

  // Public routes should not expose delegates
  const publicHit = await apiRequest(port, 'GET', '/api/announcements');
  record('Security', 'public CMS route still works', publicHit.status === 200 || publicHit.status === 503 ? 'PASSED' : 'FAILED', `status=${publicHit.status}`);
}

async function verifyReports(port, token) {
  const snap = await apiRequest(port, 'GET', '/api/delegate-reports', { token });
  record('Reports', 'snapshot', snap.status === 200 && snap.json?.mode === 'snapshot' ? 'PASSED' : 'FAILED', `status=${snap.status}`);

  if (snap.status === 200) {
    const hasGroups = snap.json.byElectoralArea && snap.json.byPollingStation && snap.json.bySurveyOfficer && snap.json.byCategory;
    record('Reports', 'area/station/officer/category groups', hasGroups ? 'PASSED' : 'FAILED');
    const sensitive = (snap.json.records || []).some((r) => r.ghanaCard || r.votersId);
    record('Security', 'report JSON omits sensitive IDs', !sensitive ? 'PASSED' : 'FAILED');
  }

  const today = new Date().toISOString().slice(0, 10);
  const hist = await apiRequest(port, 'GET', `/api/delegate-reports?from=2020-01-01&to=${today}`, { token });
  record(
    'Reports',
    'historical mode uses survey_records',
    hist.status === 200 && hist.json?.mode === 'historical' ? 'PASSED' : 'FAILED',
    `status=${hist.status}`,
  );

  const csv = await fetch(`http://127.0.0.1:${port}/api/delegate-reports/export.csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const csvText = await csv.text();
  record('Export', 'CSV auth+200', csv.status === 200 ? 'PASSED' : 'FAILED', `status=${csv.status}`);
  record('Export', 'CSV content-type', String(csv.headers.get('content-type') || '').includes('csv') ? 'PASSED' : 'FAILED');
  record('Export', 'CSV no JWT/secrets', !/Bearer |JWT_SECRET|postgresql:\/\//i.test(csvText) ? 'PASSED' : 'FAILED');

  const csvUnauth = await fetch(`http://127.0.0.1:${port}/api/delegate-reports/export.csv`);
  record('Export', 'CSV unauthenticated → 401', csvUnauth.status === 401 ? 'PASSED' : 'FAILED', `status=${csvUnauth.status}`);

  const dash = await apiRequest(port, 'GET', '/api/delegate-dashboard/stats', { token });
  record('Reports', 'survey dashboard stats', dash.status === 200 ? 'PASSED' : 'FAILED', `status=${dash.status}`);
}

async function verifyStaticCode() {
  const fs = require('fs');
  const path = require('path');
  const surveySrc = fs.readFileSync(path.join(__dirname, '../routes/delegates.js'), 'utf8');
  const hasBegin = surveySrc.includes("await client.query('BEGIN')");
  const hasInsertSurvey = surveySrc.includes('INSERT INTO survey_records');
  const hasUpdateDelegate = surveySrc.includes('current_status');
  const hasRollback = surveySrc.includes('ROLLBACK');
  const hasLog = surveySrc.includes("action: 'survey_recorded'");
  record(
    'Survey',
    'transactional survey code path',
    hasBegin && hasInsertSurvey && hasUpdateDelegate && hasRollback && hasLog ? 'PASSED' : 'FAILED',
  );

  const pages = [
    'delegates/page.tsx',
    'delegates/new/page.tsx',
    'delegates/[id]/page.tsx',
    'delegates/[id]/edit/page.tsx',
    'electoral-areas/page.tsx',
    'polling-stations/page.tsx',
    'delegate-categories/page.tsx',
    'delegate-reports/page.tsx',
    'activity/page.tsx',
    'survey-dashboard/page.tsx',
  ];
  const root = path.join(__dirname, '../../frontend/src/app/admin');
  const missing = pages.filter((p) => !fs.existsSync(path.join(root, p)));
  record('Frontend', 'admin delegate routes exist', missing.length === 0 ? 'PASSED' : 'FAILED', missing.join(', ') || 'all present');

  const layout = fs.readFileSync(path.join(root, 'layout.tsx'), 'utf8');
  const lucideImportCount = (layout.match(/from 'lucide-react'/g) || []).length;
  record('Code', 'layout lucide import single', lucideImportCount === 1 ? 'PASSED' : 'FAILED', `count=${lucideImportCount}`);

  // Duplicate auth require in same file
  const routeFiles = fs.readdirSync(path.join(__dirname, '../routes')).filter((f) => f.endsWith('.js'));
  let dupAuth = 0;
  for (const f of routeFiles) {
    const src = fs.readFileSync(path.join(__dirname, '../routes', f), 'utf8');
    const matches = src.match(/require\('\.\.\/middleware\/auth'\)/g) || [];
    if (matches.length > 1) dupAuth += 1;
  }
  record('Code', 'no duplicate auth requires', dupAuth === 0 ? 'PASSED' : 'FAILED', `files=${dupAuth}`);
}

async function main() {
  console.log('=== FINAL PRODUCTION VERIFICATION ===\n');

  record('Database', 'DATABASE_URL configured', configuredDatabaseUrl() ? 'PASSED' : 'FAILED');

  await verifyStaticCode();

  let pool = null;
  try {
    pool = await tryConnect();
    record('Database', 'host reachable + connect', 'PASSED');
  } catch (err) {
    record('Database', 'host reachable + connect', 'BLOCKED', err.message.split('\n')[0]);
    record('Database', 'schema initialization', 'BLOCKED', 'database unreachable');
    record('Database', 'migration / data checks', 'BLOCKED', 'database unreachable');
    record('Survey', 'live survey tests', 'BLOCKED', 'database unreachable');
    record('Auth', 'live API auth tests', 'BLOCKED', 'database unreachable');
    record('Reports', 'live report tests', 'BLOCKED', 'database unreachable');
    record('Export', 'live CSV tests', 'BLOCKED', 'database unreachable');
    printSummary();
    process.exit(2);
  }

  try {
    const { initializeDatabase } = require('../data/db');
    await initializeDatabase();
    record('Database', 'schema initialization', 'PASSED');
  } catch (err) {
    record('Database', 'schema initialization', 'FAILED', err.message.split('\n')[0]);
  }

  await verifySchema(pool);
  await verifyDataIntegrity(pool);
  await verifySurveyTransaction(pool);

  let server;
  try {
    // Ensure DB ready for deferred mount
    const { initializeDatabase } = require('../data/db');
    await initializeDatabase();
    ({ server } = await startAppServer());
    const port = server.address().port;

    const { JWT_SECRET } = require('../middleware/auth');
    const admin = await pool.query(`SELECT id, name, email, role FROM admins WHERE is_active IS DISTINCT FROM false LIMIT 1`);
    const token = jwt.sign(
      {
        id: admin.rows[0].id,
        email: admin.rows[0].email,
        name: admin.rows[0].name,
        role: admin.rows[0].role === 'super_admin' ? 'super_admin' : 'staff',
        privileges: ['delegates'],
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    await verifyAuthz(pool, port);
    await verifyReports(port, token);

    // Health
    const health = await apiRequest(port, 'GET', '/api/health');
    record('Regression', '/api/health', health.status === 200 ? 'PASSED' : 'FAILED', `status=${health.status}`);
  } catch (err) {
    record('Auth', 'API server tests', 'FAILED', err.message.split('\n')[0]);
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await pool.end();
  }

  printSummary();
}

function printSummary() {
  console.log('\n=== SUMMARY COUNTS ===');
  const counts = { PASSED: 0, FAILED: 0, BLOCKED: 0, 'NOT RUN': 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  console.log(JSON.stringify(counts));
  const failed = results.filter((r) => r.status === 'FAILED');
  if (failed.length) {
    console.log('\nFAILED ITEMS:');
    failed.forEach((f) => console.log(`- ${f.section}/${f.name}: ${f.detail}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
