const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

let apiMounted = false;

function ensureApiMounted() {
  if (!apiMounted) {
    require('./mountApi')(app);
    apiMounted = true;
  }
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);
    const payload = {
      status: 'ok',
      message: 'NPP Suynani East Operations API is running',
      database: hasDbUrl,
      cloudinary: isCloudinaryConfigured(),
      dbConnected: false,
      vercel: Boolean(process.env.VERCEL),
    };

    if (req.query.check === 'db') {
      if (!hasDbUrl) {
        return res.status(503).json({
          ...payload,
          status: 'error',
          error: 'DATABASE_URL is not set in Vercel Environment Variables',
        });
      }
      const mountApi = require('./mountApi');
      const db = mountApi.getDbModule();
      const ping = db.pingDatabase || db.default?.pingDatabase;
      if (typeof ping !== 'function') {
        return res.status(503).json({
          ...payload,
          status: 'error',
          error: 'Database module failed to load',
        });
      }
      await ping();
      payload.dbConnected = true;
    }

    res.json(payload);
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({
      status: 'error',
      error: err.message,
      hint: 'Use Supabase Session pooler (port 5432) or Transaction pooler (port 6543) in DATABASE_URL',
    });
  }
});

app.use((req, res, next) => {
  try {
    if (!apiMounted) {
      ensureApiMounted();
      return app.handle(req, res, next);
    }
    next();
  } catch (err) {
    console.error('API boot failed:', err.message);
    res.status(500).json({ error: `API boot failed: ${err.message}` });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;

if (require.main === module) {
  ensureApiMounted();
  const mountApi = require('./mountApi');
  mountApi
    .getDbReady()
    .then(() => {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });

      process.on('SIGINT', () => {
        mountApi.getDbModule().closeDb();
        server.close(() => process.exit(0));
      });
      process.on('SIGTERM', () => {
        mountApi.getDbModule().closeDb();
        server.close(() => process.exit(0));
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
