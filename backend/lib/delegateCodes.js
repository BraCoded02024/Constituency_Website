'use strict';

/**
 * Generate next DEL-XXXXX code. Must be called inside a transaction with a client
 * when concurrent inserts are possible.
 * @param {object} db - pg Pool or Client
 */
async function nextDelegateCode(db) {
  const { rows } = await db.query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(delegate_code FROM 5) AS INTEGER)), 0) AS max_n
    FROM delegates
    WHERE delegate_code ~ '^DEL-[0-9]+$'
  `);
  const next = (rows[0]?.max_n || 0) + 1;
  return `DEL-${String(next).padStart(5, '0')}`;
}

module.exports = { nextDelegateCode };
