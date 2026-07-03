const express = require('express');
const router = express.Router();
const { getDb } = require('../data/db');
const { authenticateToken } = require('../middleware/auth');
const { uuidv4 } = require('../lib/uuid');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

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

// ── Validation helpers ──

const VALID_GENDERS = ['Male', 'Female', 'Other'];
const VALID_STATUSES = ['Active', 'Inactive', 'Suspended'];

const GHANA_CARD_RE = /^GHA-\d{9}-\d$/;
const VOTERS_ID_RE = /^\d{10}$/;
const POLLING_CODE_RE = /^[A-Z0-9]{4,12}$/i;
const PHONE_RE = /^0[2-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateDelegate(body) {
  const errors = [];

  if (!body.fullName || !body.fullName.trim()) errors.push('Full name is required');
  if (body.gender && !VALID_GENDERS.includes(body.gender)) errors.push(`Gender must be one of: ${VALID_GENDERS.join(', ')}`);
  if (body.status && !VALID_STATUSES.includes(body.status)) errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  if (body.ghanaCard && !GHANA_CARD_RE.test(body.ghanaCard)) errors.push('Ghana Card must follow format GHA-XXXXXXXXX-X (e.g. GHA-123456789-0)');
  if (body.votersId && !VOTERS_ID_RE.test(body.votersId)) errors.push('Voter\'s ID must be exactly 10 digits');
  if (body.pollingStationCode && !POLLING_CODE_RE.test(body.pollingStationCode)) errors.push('Polling Station Code must be 4–12 alphanumeric characters');
  if (body.phone && !PHONE_RE.test(body.phone.replace(/[\s-]/g, ''))) errors.push('Phone must be a valid Ghana number (e.g. 0241234567)');
  if (body.email && !EMAIL_RE.test(body.email)) errors.push('Invalid email address');

  return errors;
}

// ── Row mapper ──

function camelRow(r) {
  return {
    id: r.id,
    fullName: r.full_name,
    address: r.address,
    gender: r.gender,
    ghanaCard: r.ghana_card,
    votersId: r.voters_id,
    pollingStationName: r.polling_station_name,
    pollingStationCode: r.polling_station_code,
    phone: r.phone,
    email: r.email,
    community: r.community,
    status: r.status,
    registeredAt: r.registered_at,
  };
}

const ALL_COLS = 'id, full_name, address, gender, ghana_card, voters_id, polling_station_name, polling_station_code, phone, email, community, status, registered_at';

// ── CRUD routes ──

router.get('/', authenticateToken, async (_req, res) => {
  const db = getDb();
  const { rows } = await db.query(`SELECT ${ALL_COLS} FROM delegates ORDER BY registered_at DESC`);
  res.json(rows.map(camelRow));
});

router.get('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(`SELECT ${ALL_COLS} FROM delegates WHERE id = $1`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Delegate not found' });
  res.json(camelRow(rows[0]));
});

router.post('/', authenticateToken, async (req, res) => {
  const errors = validateDelegate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const { fullName, address, gender, ghanaCard, votersId, pollingStationName, pollingStationCode, phone, email, community, status } = req.body;
  const db = getDb();
  const id = uuidv4();
  const registeredAt = new Date().toISOString().split('T')[0];

  await db.query(
    `INSERT INTO delegates (id, full_name, address, gender, ghana_card, voters_id, polling_station_name, polling_station_code, phone, email, community, status, registered_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, fullName.trim(), address || null, gender || null, ghanaCard || null, votersId || null, pollingStationName || null, pollingStationCode || null, phone || null, email || null, community || null, status || 'Active', registeredAt]
  );
  res.status(201).json(camelRow({
    id, full_name: fullName.trim(), address, gender, ghana_card: ghanaCard, voters_id: votersId,
    polling_station_name: pollingStationName, polling_station_code: pollingStationCode,
    phone, email, community, status: status || 'Active', registered_at: registeredAt,
  }));
});

router.put('/:id', authenticateToken, async (req, res) => {
  const errors = validateDelegate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const { fullName, address, gender, ghanaCard, votersId, pollingStationName, pollingStationCode, phone, email, community, status } = req.body;
  const db = getDb();
  const { rowCount } = await db.query(
    `UPDATE delegates SET full_name=$1, address=$2, gender=$3, ghana_card=$4, voters_id=$5, polling_station_name=$6, polling_station_code=$7, phone=$8, email=$9, community=$10, status=$11 WHERE id=$12`,
    [fullName.trim(), address || null, gender || null, ghanaCard || null, votersId || null, pollingStationName || null, pollingStationCode || null, phone || null, email || null, community || null, status || 'Active', req.params.id]
  );
  if (rowCount === 0) return res.status(404).json({ error: 'Delegate not found' });
  res.json({ success: true });
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  await db.query('DELETE FROM delegates WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ── Import ──

function normalizeHeader(h) {
  if (!h) return '';
  const lower = h.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const map = {
    fullname: 'fullName', name: 'fullName', delegatename: 'fullName',
    address: 'address', location: 'address', residentialaddress: 'address',
    gender: 'gender', sex: 'gender',
    ghanacard: 'ghanaCard', ghanacardno: 'ghanaCard', ghanacardnumber: 'ghanaCard', cardnumber: 'ghanaCard', idnumber: 'ghanaCard',
    votersid: 'votersId', voterid: 'votersId', votersidno: 'votersId', votersidnumber: 'votersId', votingid: 'votersId',
    pollingstationname: 'pollingStationName', pollingstation: 'pollingStationName', stationname: 'pollingStationName',
    pollingstationcode: 'pollingStationCode', stationcode: 'pollingStationCode', pscode: 'pollingStationCode',
    phone: 'phone', phonenumber: 'phone', telephone: 'phone', mobile: 'phone', mobilenumber: 'phone', contact: 'phone',
    email: 'email', emailaddress: 'email',
    community: 'community', town: 'community', area: 'community', locality: 'community',
    status: 'status',
  };
  return map[lower] || '';
}

router.post('/import', authenticateToken, importUpload.single('file'), async (req, res) => {
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
    const client = await db.connect();
    let imported = 0;
    let skipped = 0;

    try {
      await client.query('BEGIN');

      for (const raw of rawRows) {
        const row = {};
        for (const [origHeader, field] of Object.entries(columnMap)) {
          row[field] = raw[origHeader]?.toString().trim() || null;
        }

        if (!row.fullName) { skipped++; continue; }

        const id = uuidv4();
        const registeredAt = new Date().toISOString().split('T')[0];

        await client.query(
          `INSERT INTO delegates (id, full_name, address, gender, ghana_card, voters_id, polling_station_name, polling_station_code, phone, email, community, status, registered_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [id, row.fullName, row.address || null, row.gender || null, row.ghanaCard || null, row.votersId || null, row.pollingStationName || null, row.pollingStationCode || null, row.phone || null, row.email || null, row.community || null, row.status || 'Active', registeredAt]
        );
        imported++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    fs.unlinkSync(req.file.path);
    res.json({ imported, skipped, total: rawRows.length });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

module.exports = router;
