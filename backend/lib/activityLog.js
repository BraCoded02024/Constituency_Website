'use strict';

const { uuidv4 } = require('./uuid');

/**
 * Append-only activity log. Never log passwords, JWTs, Ghana Card, or credentials.
 * @param {object} db - pg Pool or Client
 * @param {{ actor?: {id?: string, name?: string}, action: string, entity: string, entityId?: string, metadata?: object }} entry
 */
async function logActivity(db, entry) {
  const { actor, action, entity, entityId, metadata } = entry;
  if (!action || !entity) return;

  let safeMeta = null;
  if (metadata && typeof metadata === 'object') {
    const clone = { ...metadata };
    for (const key of Object.keys(clone)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('ghana') ||
        lower === 'ghanacard' ||
        lower === 'ghana_card' ||
        lower.includes('voter')
      ) {
        delete clone[key];
      }
    }
    safeMeta = JSON.stringify(clone);
  }

  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_name, action, entity, entity_id, metadata, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      uuidv4(),
      actor?.id || null,
      actor?.name || null,
      action,
      entity,
      entityId || null,
      safeMeta,
      new Date().toISOString(),
    ],
  );
}

module.exports = { logActivity };
