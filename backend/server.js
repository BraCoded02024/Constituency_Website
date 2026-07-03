const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const db = require('./data/db');
const cloudinaryLib = () => require('./lib/cloudinary');

function resolveUploadsDir() {
  if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;
  if (process.env.VERCEL) return path.join(os.tmpdir(), 'cms-uploads');
  return path.join(__dirname, 'uploads');
}

const useCloudinary = () => cloudinaryLib().isCloudinaryEnabled();

const uploadsDir = useCloudinary() ? null : resolveUploadsDir();
if (uploadsDir) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.warn('Uploads directory unavailable:', uploadsDir, err.message);
  }
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

const app = express();
const PORT = process.env.PORT || 5001;

let dbReady = null;
function getDbReady() {
  if (!dbReady) {
    const init = db.initializeDatabase;
    if (typeof init !== 'function') {
      dbReady = Promise.reject(new Error('Database module failed to load on server'));
    } else {
      dbReady = init().catch((err) => {
        console.error('Failed to initialize database:', err.message);
        throw err;
      });
    }
  }
  return dbReady;
}

app.use(cors());
app.use(express.json());
if (uploadsDir) {
  app.use('/uploads', express.static(uploadsDir));
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NPP Suynani East Operations API is running',
    database: Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL),
    cloudinary: useCloudinary(),
  });
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

const authRouter = require('./routes/auth');
const announcementsRouter = require('./routes/announcements');
const opportunitiesRouter = require('./routes/opportunities');
const projectsRouter = require('./routes/projects');
const eventsRouter = require('./routes/events');
const constituentsRouter = require('./routes/constituents');
const concernsRouter = require('./routes/concerns');
const volunteersRouter = require('./routes/volunteers');
const galleryRouter = require('./routes/gallery');
const dashboardRouter = require('./routes/dashboard');
const servicesRouter = require('./routes/services');
const successStoriesRouter = require('./routes/successStories');
const delegatesRouter = require('./routes/delegates');
const staffRouter = require('./routes/staff');
const { authenticateToken } = require('./middleware/auth');

app.use('/api/auth', authRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/constituents', constituentsRouter);
app.use('/api/concerns', concernsRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/services', servicesRouter);
app.use('/api/success-stories', successStoriesRouter);
app.use('/api/delegates', delegatesRouter);
app.use('/api/staff', staffRouter);

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

module.exports = app;

if (require.main === module) {
  getDbReady()
    .then(() => {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });

      process.on('SIGINT', () => {
        db.closeDb();
        server.close(() => process.exit(0));
      });
      process.on('SIGTERM', () => {
        db.closeDb();
        server.close(() => process.exit(0));
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
