'use strict';

/**
 * One-time load of the Sunyani East delegate workbook.
 * Creates missing electoral areas, polling stations, and position categories,
 * then inserts every delegate row.
 */
require('dotenv').config();
const XLSX = require('xlsx');
const { Pool } = require('pg');
const { getPoolConfig } = require('../lib/dbConfig');
const { uuidv4 } = require('../lib/uuid');
const { ensureDelegateSchema } = require('../data/delegateSchema');

const FILE = process.argv[2] || 'C:/Users/navig/Downloads/SUNYANI_EAST_delegates.xlsx';

function text(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}

function titlePosition(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function main() {
  const pool = new Pool(getPoolConfig());
  await ensureDelegateSchema(pool);

  const existing = await pool.query('SELECT COUNT(*)::int AS n FROM delegates');
  if (existing.rows[0].n > 0) {
    throw new Error(`Refusing to import: delegates table already has ${existing.rows[0].n} rows`);
  }

  const workbook = XLSX.readFile(FILE);
  const sheet = workbook.Sheets.Delegates || workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (!rows.length) throw new Error('Delegates sheet is empty');

  const client = await pool.connect();
  const now = new Date().toISOString();
  const registeredAt = now.slice(0, 10);

  try {
    await client.query('BEGIN');

    const { rows: areaRows } = await client.query('SELECT id, name FROM electoral_areas');
    const areaByName = new Map(areaRows.map((area) => [area.name.toLowerCase(), area.id]));
    const workbookAreas = new Map();
    for (const row of rows) {
      const name = text(row['Electoral Area']);
      const code = text(row['Area Code']);
      if (!name) throw new Error('A row is missing Electoral Area');
      workbookAreas.set(name.toLowerCase(), { name, code });
    }

    for (const [key, area] of workbookAreas) {
      const existingId = areaByName.get(key);
      if (existingId) {
        await client.query(
          `UPDATE electoral_areas
           SET name = $1, code = $2, is_active = true, updated_at = $3
           WHERE id = $4`,
          [area.name, area.code, now, existingId],
        );
      } else {
        const id = uuidv4();
        await client.query(
          `INSERT INTO electoral_areas (id, name, code, description, is_active, created_at, updated_at)
           VALUES ($1,$2,$3,NULL,true,$4,$4)`,
          [id, area.name, area.code, now],
        );
        areaByName.set(key, id);
      }
    }

    await client.query(
      `UPDATE electoral_areas
       SET is_active = false, updated_at = $1
       WHERE LOWER(name) <> ALL($2::text[])`,
      [now, [...workbookAreas.keys()]],
    );

    const stationByKey = new Map();
    for (const row of rows) {
      const stationName = text(row['Polling Station']);
      const stationCode = text(row['Polling Station Code']);
      if (!stationName && !stationCode) continue;
      if (!stationName || !stationCode) {
        throw new Error(`Row ${row['No.']} is missing a polling station name or code`);
      }
      const areaName = text(row['Electoral Area']);
      const key = `${areaName.toLowerCase()}|${stationCode.toLowerCase()}`;
      if (!stationByKey.has(key)) {
        stationByKey.set(key, {
          name: stationName,
          code: stationCode,
          areaId: areaByName.get(areaName.toLowerCase()),
        });
      }
    }

    for (const station of stationByKey.values()) {
      const id = uuidv4();
      await client.query(
        `INSERT INTO polling_stations (id, electoral_area_id, name, code, description, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NULL,true,$5,$5)`,
        [id, station.areaId, station.name, station.code, now],
      );
      station.id = id;
    }

    const positions = [...new Set(rows.map((row) => text(row.Position)).filter(Boolean))];
    const categoryByPosition = new Map();
    for (const position of positions) {
      const label = titlePosition(position);
      const { rows: found } = await client.query(
        'SELECT id FROM delegate_categories WHERE LOWER(name) = LOWER($1)',
        [label],
      );
      let id = found[0]?.id;
      if (id) {
        await client.query(
          'UPDATE delegate_categories SET name = $1, is_active = true, updated_at = $2 WHERE id = $3',
          [label, now, id],
        );
      } else {
        id = uuidv4();
        await client.query(
          `INSERT INTO delegate_categories (id, name, description, is_active, created_at, updated_at)
           VALUES ($1,$2,$3,true,$4,$4)`,
          [id, label, 'Imported from the Sunyani East delegate workbook', now],
        );
      }
      categoryByPosition.set(position.toLowerCase(), id);
    }

    await client.query(
      `UPDATE delegate_categories
       SET is_active = false, updated_at = $1
       WHERE LOWER(name) <> ALL($2::text[])`,
      [now, positions.map((position) => titlePosition(position).toLowerCase())],
    );

    const usedCodes = new Set();
    let imported = 0;
    for (const row of rows) {
      const fullName = text(row['Full Name']);
      if (!fullName) throw new Error(`Row ${row['No.']} is missing a full name`);
      const areaName = text(row['Electoral Area']);
      const stationCode = text(row['Polling Station Code']);
      const stationName = text(row['Polling Station']);
      const station = stationCode
        ? stationByKey.get(`${areaName.toLowerCase()}|${stationCode.toLowerCase()}`)
        : null;
      const position = text(row.Position);
      const ageText = text(row.Age);
      const age = ageText && /^\d+$/.test(ageText) ? Number(ageText) : null;
      const sourceNo = Number(text(row['No.']));
      let codeNumber = Number.isInteger(sourceNo) && sourceNo > 0 ? sourceNo : imported + 1;
      while (usedCodes.has(codeNumber)) codeNumber += 1;
      usedCodes.add(codeNumber);
      const delegateCode = `DEL-${String(codeNumber).padStart(5, '0')}`;

      await client.query(
        `INSERT INTO delegates (
           id, delegate_code, full_name, gender, voters_id, phone, age, level, position,
           is_flagged, source_no, polling_station_name, polling_station_code, status,
           registered_at, electoral_area_id, polling_station_id, category_id,
           is_active, created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Active',$14,$15,$16,$17,true,$18,$18
         )`,
        [
          uuidv4(),
          delegateCode,
          fullName,
          text(row.Gender),
          text(row['Voter ID']),
          text(row['Phone No.']),
          age,
          text(row.Level),
          position,
          text(row['Flagged (■)']) === 'Yes',
          Number.isInteger(sourceNo) ? sourceNo : null,
          stationName,
          stationCode,
          registeredAt,
          areaByName.get(areaName.toLowerCase()),
          station ? station.id : null,
          position ? categoryByPosition.get(position.toLowerCase()) : null,
          now,
        ],
      );
      imported += 1;
    }

    await client.query('COMMIT');

    const check = await pool.query(`
      SELECT
        COUNT(*)::int AS delegates,
        COUNT(*) FILTER (WHERE level = 'Electoral Area')::int AS area_level,
        COUNT(*) FILTER (WHERE level = 'Polling Station')::int AS station_level,
        COUNT(*) FILTER (WHERE is_flagged)::int AS flagged,
        COUNT(*) FILTER (WHERE age IS NULL)::int AS missing_age,
        COUNT(DISTINCT electoral_area_id)::int AS areas,
        COUNT(DISTINCT polling_station_id)::int AS stations,
        COUNT(DISTINCT category_id)::int AS positions
      FROM delegates
    `);
    console.log(JSON.stringify({ imported, ...check.rows[0] }));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
