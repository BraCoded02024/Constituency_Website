const express = require('express');
const path = require('path');
const os = require('os');
const multer = require('multer');
const fs = require('fs');

const cloudinaryLib = () => require('./lib/cloudinary');

function resolveUploadsDir() {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  if (process.env.VERCEL) return path.join(os.tmpdir(), 'cms-uploads');
  return path.join(__dirname, 'uploads');
}

function useCloudinary() {
  return cloudinaryLib().isCloudinaryEnabled();
}

let dbReady = null;
function getDbModule() {
  return require('./data/db');
}

function getDbReady() {
  if (!dbReady) {
    const db = getDbModule();
    const init = db.initializeDatabase;
    if (typeof init !== 'function') {
      dbReady = Promise.reject(new Error('Database module failed to load'));
    } else {
      dbReady = init().catch((err) => {
        console.error('Failed to initialize database:', err.message);
        throw err;
      });
    }
  }
  return dbReady;
}

/** Mount API routes, DB middleware, and uploads (deferred so /api/health can boot on Vercel). */
module.exports = function mountApi(app) {
  const uploadsDir = useCloudinary() ? null : resolveUploadsDir();
  if (uploadsDir) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (err) {
      console.warn('Uploads directory unavailable:', uploadsDir, err.message);
    }
    app.use('/uploads', express.static(uploadsDir));
  }

  const storage = useCloudinary()
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      });

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|webm/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype);
      cb(null, ext || mime);
    },
  });

  app.use(async (req, res, next) => {
    try {
      await getDbReady();
      next();
    } catch (err) {
      console.error('Database middleware error:', err.message);
      res.status(503).json({ error: 'Database unavailable — check DATABASE_URL on Vercel' });
    }
  });

  app.locals.upload = upload;

  const { authenticateToken } = require('./middleware/auth');

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/announcements', require('./routes/announcements'));
  app.use('/api/opportunities', require('./routes/opportunities'));
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api/events', require('./routes/events'));
  app.use('/api/constituents', require('./routes/constituents'));
  app.use('/api/concerns', require('./routes/concerns'));
  app.use('/api/volunteers', require('./routes/volunteers'));
  app.use('/api/gallery', require('./routes/gallery'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/services', require('./routes/services'));
  app.use('/api/success-stories', require('./routes/successStories'));
  app.use('/api/delegates', require('./routes/delegates'));
  app.use('/api/staff', require('./routes/staff'));

  app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
      if (useCloudinary()) {
        const { uploadBuffer } = cloudinaryLib();
        const result = await uploadBuffer(req.file.buffer, {
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        });
        return res.json({ url: result.secure_url, filename: result.public_id });
      }
      const pathUrl = `/uploads/${req.file.filename}`;
      res.json({ url: pathUrl, filename: req.file.filename });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
};

module.exports.getDbReady = getDbReady;
module.exports.getDbModule = getDbModule;
