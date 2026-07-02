/**
 * Database connection settings.
 * Works with Supabase (PostgreSQL) via DATABASE_URL or SUPABASE_DB_URL.
 *
 * Supabase: Project Settings → Database → Connection string → URI
 * For Vercel/serverless, prefer "Session pooler" (port 5432).
 */
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error('DATABASE_URL or SUPABASE_DB_URL must be set (use your Supabase connection string).');
  }
  return url.trim();
}

function isSupabaseUrl(connectionString) {
  return /supabase\.(com|co)/i.test(connectionString);
}

function getPoolConfig() {
  const connectionString = getDatabaseUrl();
  const config = { connectionString };

  if (isSupabaseUrl(connectionString) || process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

module.exports = { getDatabaseUrl, getPoolConfig, isSupabaseUrl };
