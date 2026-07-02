const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');

dotenv.config();

const { initializeDatabase, closeDb } = require('./data/database');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
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

const dbReady = initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
  throw err;
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch {
    res.status(503).json({ error: 'Database unavailable' });
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

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NPP Constituency Management API is running' });
});

module.exports = app;

if (require.main === module) {
  dbReady
    .then(() => {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });

      process.on('SIGINT', () => {
        closeDb();
        server.close(() => process.exit(0));
      });
      process.on('SIGTERM', () => {
        closeDb();
        server.close(() => process.exit(0));
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
