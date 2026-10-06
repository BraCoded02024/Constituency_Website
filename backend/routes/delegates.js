'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken, requireActiveAdmin } = require('../middleware/auth');
const { authorizePrivilege } = require('../middleware/authorize');
const { uuidv4 } = require('../lib/uuid');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { nextDelegateCode } = require('../lib/delegateCodes');
const { logActivity } = require('../lib/activityLog');
const { delegate: mapDelegate, surveyRecord } = require('../data/serialize');
const {
  SURVEY_STATUSES,
  SURVEY_CONFIDENCES,
  DELEGATE_STATUSES,
  GENDERS,
} = require('../lib/surveyConstants');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const importStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    cb(null, `import-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const importUpload = multer({
  storage: importStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /xlsx|xls|csv/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    cb(null, allowed.test(ext));
  },
});

router.use(authenticateToken);
router.use(requireActiveAdmin);
router.use(authorizePrivilege('delegates'));

const GHANA_CARD_RE = /^GHA-\d{9}-\d$/;
const VOTERS_ID_RE = /^\d{10}$/;
const POLLING_CODE_RE = /^[A-Z0-9]{4,12}$/i;
const PHONE_RE = /^0[2-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DELEGATE_SELECT = `
  d.id, d.delegate_code, d.full_name, d.address, d.gender, d.ghana_card, d.voters_id,
  d.polling_station_name, d.polling_station_code, d.phone, d.email, d.community, d.status,
  d.registered_at, d.electoral_area_id, d.polling_station_id, d.category_id,
  d.current_status, d.current_confidence, d.last_contacted_at, d.next_follow_up_at,
  d.notes, d.is_active, d.created_at, d.updated_at,
  d.age, d.level, d.position, d.is_flagged, d.source_no,
  ea.name AS electoral_area_name,
  ps.name AS polling_station_label,
  dc.name AS category_name
`;

function validateDelegate(body) {
  const errors = [];
  if (!body.fullName || !String(body.fullName).trim()) errors.push('Full name is required');
  if (body.gender && !GENDERS.includes(body.gender)) {
    errors.push(`Gender must be one of: ${GENDERS.join(', ')}`);
  }
  if (body.status && !DELEGATE_STATUSES.includes(body.status)) {
    errors.push(`Status must be one of: ${DELEGATE_STATUSES.join(', ')}`);
  }
  if (body.ghanaCard && !GHANA_CARD_RE.test(body.ghanaCard)) {
    errors.push('Ghana Card must follow format GHA-XXXXXXXXX-X (e.g. GHA-123456789-0)');
  }
  if (body.votersId && !VOTERS_ID_RE.test(body.votersId)) {
    errors.push("Voter's ID must be exactly 10 digits");
  }
  if (body.pollingStationCode && !POLLING_CODE_RE.test(body.pollingStationCode)) {
    errors.push('Polling Station Code must be 4–12 alphanumeric characters');
  }
  if (body.phone && !PHONE_RE.test(String(body.phone).replace(/[\s-]/g, ''))) {
    errors.push('Phone must be a valid Ghana number (e.g. 0241234567)');
  }
  if (body.email && !EMAIL_RE.test(body.email)) errors.push('Invalid email address');
  if (body.currentStatus && !SURVEY_STATUSES.includes(body.currentStatus)) {
    errors.push(`Survey status must be one of: ${SURVEY_STATUSES.join(', ')}`);
  }
  if (body.currentConfidence && !SURVEY_CONFIDENCES.includes(body.currentConfidence)) {
    errors.push(`Confidence must be one of: ${SURVEY_CONFIDENCES.join(', ')}`);
  }
  return errors;
}

async function assertRefs(db, body) {
  if (body.electoralAreaId) {
    const { rows } = await db.query('SELECT id FROM electoral_areas WHERE id = $1', [body.electoralAreaId]);
    if (!rows[0]) return 'Invalid electoral area';
  }
  if (body.pollingStationId) {
    const { rows } = await db.query(
      'SELECT id, electoral_area_id FROM polling_stations WHERE id = $1',
      [body.pollingStationId],
    );
    if (!rows[0]) return 'Invalid polling station';
    if (body.electoralAreaId && rows[0].electoral_area_id !== body.electoralAreaId) {
      return 'Polling station does not belong to the selected electoral area';
    }
  }
  if (body.categoryId) {
    const { rows } = await db.query('SELECT id FROM delegate_categories WHERE id = $1', [body.categoryId]);
    if (!rows[0]) return 'Invalid delegate category';
  }
  return null;
}

async function fetchDelegate(db, id) {
  const { rows } = await db.query(
    `SELECT ${DELEGATE_SELECT}
     FROM delegates d
     LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
     LEFT JOIN polling_stations ps ON ps.id = d.polling_station_id
     LEFT JOIN delegate_categories dc ON dc.id = d.category_id
     WHERE d.id = $1`,
    [id],
  );
  return rows[0] ? mapDelegate(rows[0], { includeSensitive: true }) : null;
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '25'), 10) || 25, 1), 100);
    const offset = (page - 1) * limit;
    const sort = String(req.query.sort || 'newest');

    const params = [];
    const clauses = [];

    const search = req.query.search ? String(req.query.search).trim() : '';
    if (search) {
      params.push(`%${search}%`);
      const p = `$${params.length}`;
      clauses.push(`(
        d.delegate_code ILIKE ${p}
        OR d.full_name ILIKE ${p}
        OR d.phone ILIKE ${p}
        OR d.ghana_card ILIKE ${p}
        OR d.voters_id ILIKE ${p}
        OR d.community ILIKE ${p}
        OR d.polling_station_name ILIKE ${p}
        OR d.polling_station_code ILIKE ${p}
        OR ps.name ILIKE ${p}
        OR ea.name ILIKE ${p}
      )`);
    }

    if (req.query.electoralAreaId) {
      params.push(String(req.query.electoralAreaId));
      clauses.push(`d.electoral_area_id = $${params.length}`);
    }
    if (req.query.pollingStationId) {
      params.push(String(req.query.pollingStationId));
      clauses.push(`d.polling_station_id = $${params.length}`);
    }
    if (req.query.categoryId) {
      params.push(String(req.query.categoryId));
      clauses.push(`d.category_id = $${params.length}`);
    }
    if (req.query.status) {
      params.push(String(req.query.status));
      clauses.push(`d.status = $${params.length}`);
    }
    if (req.query.gender) {
      params.push(String(req.query.gender));
      clauses.push(`d.gender = $${params.length}`);
    }
    if (req.query.currentStatus) {
      if (req.query.currentStatus === 'Unsurveyed') {
        clauses.push('d.current_status IS NULL');
      } else {
        params.push(String(req.query.currentStatus));
        clauses.push(`d.current_status = $${params.length}`);
      }
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    let orderBy = 'd.registered_at DESC NULLS LAST, d.full_name ASC';
    if (sort === 'name') orderBy = 'd.full_name ASC';
    else if (sort === 'oldest') orderBy = 'd.registered_at ASC NULLS LAST, d.full_name ASC';

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM delegates d
       LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
       LEFT JOIN polling_stations ps ON ps.id = d.polling_station_id
       LEFT JOIN delegate_categories dc ON dc.id = d.category_id
       ${where}`,
      params,
    );
    const total = countResult.rows[0].total;

    const listParams = [...params, limit, offset];
    const { rows } = await db.query(
      `SELECT ${DELEGATE_SELECT}
       FROM delegates d
       LEFT JOIN electoral_areas ea ON ea.id = d.electoral_area_id
       LEFT JOIN polling_stations ps ON ps.id = d.polling_station_id
       LEFT JOIN delegate_categories dc ON dc.id = d.category_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );

    res.json({
      data: rows.map(mapDelegate),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error('List delegates:', err.message);
    res.status(500).json({ error: 'Failed to load delegates' });
  }
});

router.post('/import', importUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const wb = XLSX.readFile(req.file.path);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'The file contains no data rows' });
    }

    const headers = Object.keys(rawRows[0]);
    const columnMap = {};
    for (const h of headers) {
      const mapped = normalizeHeader(h);
      if (mapped) columnMap[h] = mapped;
    }

    if (!Object.values(columnMap).includes('fullName')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Could not find a "Name" or "Full Name" column in the file' });
    }

    const db = getDb();
    const areas = await db.query('SELECT id, name FROM electoral_areas');
    const stations = await db.query('SELECT id, name, code, electoral_area_id FROM polling_stations');
    const categories = await db.query('SELECT id, name FROM delegate_categories');
    const areaByName = new Map(areas.rows.map((a) => [a.name.toLowerCase(), a.id]));
    const stationByName = new Map(stations.rows.map((s) => [s.name.toLowerCase(), s]));
    const stationByCode = new Map(
      stations.rows.filter((s) => s.code).map((s) => [String(s.code).toLowerCase(), s]),
    );
    const categoryByName = new Map(categories.rows.map((c) => [c.name.toLowerCase(), c.id]));

    const client = await db.connect();
    let imported = 0;
    let skipped = 0;
    const failed = [];

    try {
      await client.query('BEGIN');

      for (let i = 0; i < rawRows.length; i++) {
        const rowNum = i + 2; // header is row 1
        const raw = rawRows[i];
        const row = {};
        for (const [origHeader, field] of Object.entries(columnMap)) {
          row[field] = raw[origHeader]?.toString().trim() || null;
        }

        if (!row.fullName) {
          skipped++;
          failed.push({ row: rowNum, field: 'fullName', reason: 'Full name is required' });
          continue;
        }

        const validation = validateDelegate({
          fullName: row.fullName,
          gender: row.gender || undefined,
          status: row.status || undefined,
          ghanaCard: row.ghanaCard || undefined,
          votersId: row.votersId || undefined,
          pollingStationCode: row.pollingStationCode || undefined,
          phone: row.phone || undefined,
          email: row.email || undefined,
        });
        if (validation.length) {
          skipped++;
          failed.push({ row: rowNum, field: 'validation', reason: validation.join('; ') });
          continue;
        }

        let electoralAreaId = null;
        let pollingStationId = null;
        let categoryId = null;

        if (row.electoralArea) {
          electoralAreaId = areaByName.get(row.electoralArea.toLowerCase()) || null;
          if (!electoralAreaId) {
            skipped++;
            failed.push({ row: rowNum, field: 'electoralArea', reason: `Unknown electoral area: ${row.electoralArea}` });
            continue;
          }
        }

        if (row.pollingStationName || row.pollingStationCode) {
          const byCode = row.pollingStationCode
            ? stationByCode.get(String(row.pollingStationCode).toLowerCase())
            : null;
          const byName = row.pollingStationName
            ? stationByName.get(row.pollingStationName.toLowerCase())
            : null;
          const station = byCode || byName;
          if (station) {
            pollingStationId = station.id;
            if (!electoralAreaId) electoralAreaId = station.electoral_area_id;
            else if (electoralAreaId !== station.electoral_area_id) {
              skipped++;
              failed.push({
                row: rowNum,
                field: 'pollingStation',
                reason: 'Polling station does not belong to the selected electoral area',
              });
              continue;
            }
          }
          // Keep free-text legacy fields even when structured ID is missing
        }

        if (row.category) {
          categoryId = categoryByName.get(row.category.toLowerCase()) || null;
          if (!categoryId) {
            skipped++;
            failed.push({ row: rowNum, field: 'category', reason: `Unknown category: ${row.category}` });
            continue;
          }
        }

        const id = uuidv4();
        const registeredAt = new Date().toISOString().split('T')[0];
        const code = await nextDelegateCode(client);

        await client.query(
          `INSERT INTO delegates (
             id, delegate_code, full_name, address, gender, ghana_card, voters_id,
             polling_station_name, polling_station_code, phone, email, community, status,
             registered_at, electoral_area_id, polling_station_id, category_id,
             is_active, created_at, updated_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true,$18,$18)`,
          [
            id,
            code,
            row.fullName,
            row.address || null,
            row.gender || null,
            row.ghanaCard || null,
            row.votersId || null,
            row.pollingStationName || null,
            row.pollingStationCode || null,
            row.phone || null,
            row.email || null,
            row.community || null,
            row.status || 'Active',
            registeredAt,
            electoralAreaId,
            pollingStationId,
            categoryId,
            new Date().toISOString(),
          ],
        );
        imported++;
      }

      await client.query('COMMIT');
      await logActivity(db, {
        actor: req.user,
        action: 'delegates_imported',
        entity: 'delegate',
        metadata: { imported, skipped, failed: failed.length, total: rawRows.length },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    fs.unlinkSync(req.file.path);
    res.json({
      total: rawRows.length,
      imported,
      skipped,
      failed: failed.slice(0, 100),
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

router.get('/:id/surveys', async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.query('SELECT id FROM delegates WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Delegate not found' });

    const { rows } = await db.query(
      `SELECT sr.*, a.name AS created_by_name
       FROM survey_records sr
       LEFT JOIN admins a ON a.id = sr.created_by
       WHERE sr.delegate_id = $1
       ORDER BY sr.created_at DESC`,
      [req.params.id],
    );
    res.json(rows.map(surveyRecord));
  } catch (err) {
    console.error('List surveys:', err.message);
    res.status(500).json({ error: 'Failed to load survey history' });
  }
});

router.post('/:id/surveys', async (req, res) => {
  const { status, confidence = 'High', lastContactedAt, nextFollowUpAt, notes } = req.body;
  if (!status || !SURVEY_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${SURVEY_STATUSES.join(', ')}` });
  }
  if (!SURVEY_CONFIDENCES.includes(confidence)) {
    return res.status(400).json({ error: `Confidence must be one of: ${SURVEY_CONFIDENCES.join(', ')}` });
  }
  if (!lastContactedAt) {
    return res.status(400).json({ error: 'Last contacted date is required' });
  }

  const client = await getDb().connect();
  try {
    await client.query('BEGIN');
    const { rows: delRows } = await client.query('SELECT id FROM delegates WHERE id = $1 FOR UPDATE', [
      req.params.id,
    ]);
    if (!delRows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Delegate not found' });
    }

    const surveyId = uuidv4();
    const createdAt = new Date().toISOString();
    await client.query(
      `INSERT INTO survey_records (
         id, delegate_id, status, confidence, last_contacted_at, next_follow_up_at, notes, created_by, created_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        surveyId,
        req.params.id,
        status,
        confidence,
        lastContactedAt,
        nextFollowUpAt || null,
        notes || null,
        req.user.id,
        createdAt,
      ],
    );

    await client.query(
      `UPDATE delegates SET
         current_status = $1,
         current_confidence = $2,
         last_contacted_at = $3,
         next_follow_up_at = $4,
         updated_at = $5
       WHERE id = $6`,
      [status, confidence, lastContactedAt, nextFollowUpAt || null, createdAt, req.params.id],
    );

    await logActivity(client, {
      actor: req.user,
      action: 'survey_recorded',
      entity: 'survey_record',
      entityId: surveyId,
      metadata: { delegateId: req.params.id, status, confidence },
    });

    await client.query('COMMIT');

    const { rows } = await getDb().query(
      `SELECT sr.*, a.name AS created_by_name
       FROM survey_records sr
       LEFT JOIN admins a ON a.id = sr.created_by
       WHERE sr.id = $1`,
      [surveyId],
    );
    const updated = await fetchDelegate(getDb(), req.params.id);
    res.status(201).json({ survey: surveyRecord(rows[0]), delegate: updated });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    console.error('Record survey:', err.message);
    res.status(500).json({ error: 'Failed to record survey' });
  } finally {
    client.release();
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await fetchDelegate(getDb(), req.params.id);
    if (!row) return res.status(404).json({ error: 'Delegate not found' });
    res.json(row);
  } catch (err) {
    console.error('Get delegate:', err.message);
    res.status(500).json({ error: 'Failed to load delegate' });
  }
});

router.post('/', async (req, res) => {
  try {
    const errors = validateDelegate(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const db = getDb();
    const refError = await assertRefs(db, req.body);
    if (refError) return res.status(400).json({ error: refError });

    const {
      fullName,
      address,
      gender,
      ghanaCard,
      votersId,
      pollingStationName,
      pollingStationCode,
      phone,
      email,
      community,
      status,
      electoralAreaId,
      pollingStationId,
      categoryId,
      notes,
      isActive = true,
    } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const id = uuidv4();
      const registeredAt = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const code = await nextDelegateCode(client);

      await client.query(
        `INSERT INTO delegates (
           id, delegate_code, full_name, address, gender, ghana_card, voters_id,
           polling_station_name, polling_station_code, phone, email, community, status,
           registered_at, electoral_area_id, polling_station_id, category_id, notes,
           is_active, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$20)`,
        [
          id,
          code,
          String(fullName).trim(),
          address || null,
          gender || null,
          ghanaCard || null,
          votersId || null,
          pollingStationName || null,
          pollingStationCode || null,
          phone || null,
          email || null,
          community || null,
          status || 'Active',
          registeredAt,
          electoralAreaId || null,
          pollingStationId || null,
          categoryId || null,
          notes || null,
          isActive !== false,
          now,
        ],
      );

      await logActivity(client, {
        actor: req.user,
        action: 'delegate_created',
        entity: 'delegate',
        entityId: id,
        metadata: { delegateCode: code, fullName: String(fullName).trim() },
      });
      await client.query('COMMIT');
      res.status(201).json(await fetchDelegate(db, id));
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Duplicate delegate identifier' });
    console.error('Create delegate:', err.message);
    res.status(500).json({ error: 'Failed to create delegate' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const errors = validateDelegate(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const db = getDb();
    const refError = await assertRefs(db, req.body);
    if (refError) return res.status(400).json({ error: refError });

    const {
      fullName,
      address,
      gender,
      ghanaCard,
      votersId,
      pollingStationName,
      pollingStationCode,
      phone,
      email,
      community,
      status,
      electoralAreaId,
      pollingStationId,
      categoryId,
      notes,
      isActive,
    } = req.body;

    // Profile edits must never rewrite survey history — survey fields are not updated here
    const { rowCount } = await db.query(
      `UPDATE delegates SET
         full_name=$1, address=$2, gender=$3, ghana_card=$4, voters_id=$5,
         polling_station_name=$6, polling_station_code=$7, phone=$8, email=$9,
         community=$10, status=$11, electoral_area_id=$12, polling_station_id=$13,
         category_id=$14, notes=$15, is_active=COALESCE($16, is_active), updated_at=$17
       WHERE id=$18`,
      [
        String(fullName).trim(),
        address || null,
        gender || null,
        ghanaCard || null,
        votersId || null,
        pollingStationName || null,
        pollingStationCode || null,
        phone || null,
        email || null,
        community || null,
        status || 'Active',
        electoralAreaId || null,
        pollingStationId || null,
        categoryId || null,
        notes || null,
        isActive === undefined ? null : isActive !== false,
        new Date().toISOString(),
        req.params.id,
      ],
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Delegate not found' });

    await logActivity(db, {
      actor: req.user,
      action: 'delegate_updated',
      entity: 'delegate',
      entityId: req.params.id,
      metadata: { fullName: String(fullName).trim() },
    });

    res.json(await fetchDelegate(db, req.params.id));
  } catch (err) {
    console.error('Update delegate:', err.message);
    res.status(500).json({ error: 'Failed to update delegate' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { rowCount } = await db.query('DELETE FROM delegates WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Delegate not found' });
    await logActivity(db, {
      actor: req.user,
      action: 'delegate_deleted',
      entity: 'delegate',
      entityId: req.params.id,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete delegate:', err.message);
    res.status(500).json({ error: 'Failed to delete delegate' });
  }
});

function normalizeHeader(h) {
  if (!h) return '';
  const lower = h.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const map = {
    fullname: 'fullName',
    name: 'fullName',
    delegatename: 'fullName',
    address: 'address',
    location: 'address',
    residentialaddress: 'address',
    gender: 'gender',
    sex: 'gender',
    ghanacard: 'ghanaCard',
    ghanacardno: 'ghanaCard',
    ghanacardnumber: 'ghanaCard',
    cardnumber: 'ghanaCard',
    idnumber: 'ghanaCard',
    votersid: 'votersId',
    voterid: 'votersId',
    votersidno: 'votersId',
    votersidnumber: 'votersId',
    votingid: 'votersId',
    pollingstationname: 'pollingStationName',
    pollingstation: 'pollingStationName',
    stationname: 'pollingStationName',
    pollingstationcode: 'pollingStationCode',
    stationcode: 'pollingStationCode',
    pscode: 'pollingStationCode',
    phone: 'phone',
    phonenumber: 'phone',
    telephone: 'phone',
    mobile: 'phone',
    mobilenumber: 'phone',
    contact: 'phone',
    email: 'email',
    emailaddress: 'email',
    community: 'community',
    town: 'community',
    area: 'community',
    locality: 'community',
    status: 'status',
    electoralarea: 'electoralArea',
    electoralareaname: 'electoralArea',
    category: 'category',
    delegatecategory: 'category',
  };
  return map[lower] || '';
}

module.exports = router;
