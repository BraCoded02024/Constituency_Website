'use strict';

/** Offline unit checks that do not need a database. */
const assert = require('assert');
const { authorizePrivilege } = require('../middleware/authorize');
const { delegate } = require('../data/serialize');
const { logActivity } = require('../lib/activityLog');

// Serialize privacy
const listed = delegate({
  id: '1',
  full_name: 'Test',
  ghana_card: 'GHA-123456789-0',
  voters_id: '1234567890',
  status: 'Active',
  registered_at: '2026-01-01',
});
assert.strictEqual(listed.ghanaCard, undefined);
assert.strictEqual(listed.votersId, undefined);

const detail = delegate(
  {
    id: '1',
    full_name: 'Test',
    ghana_card: 'GHA-123456789-0',
    voters_id: '1234567890',
    status: 'Active',
    registered_at: '2026-01-01',
  },
  { includeSensitive: true },
);
assert.strictEqual(detail.ghanaCard, 'GHA-123456789-0');
assert.strictEqual(detail.votersId, '1234567890');

// Authorization middleware
const deny = authorizePrivilege('delegates');
let deniedStatus = null;
deny(
  { user: { role: 'staff', privileges: ['announcements'] } },
  { status: (c) => ({ json: () => { deniedStatus = c; } }) },
  () => { deniedStatus = 200; },
);
assert.strictEqual(deniedStatus, 403);

let allowed = false;
deny(
  { user: { role: 'staff', privileges: ['delegates'] } },
  { status: () => ({ json: () => {} }) },
  () => { allowed = true; },
);
assert.strictEqual(allowed, true);

deny(
  { user: { role: 'super_admin', privileges: [] } },
  { status: () => ({ json: () => {} }) },
  () => { allowed = true; },
);
assert.strictEqual(allowed, true);

// Activity sanitizer — mock db
const inserts = [];
const fakeDb = {
  query: async (sql, params) => {
    inserts.push({ sql, params });
  },
};
awaitedLog();

async function awaitedLog() {
  await logActivity(fakeDb, {
    actor: { id: 'a1', name: 'Admin' },
    action: 'delegate_updated',
    entity: 'delegate',
    entityId: 'd1',
    metadata: {
      fullName: 'X',
      ghanaCard: 'GHA-123456789-0',
      votersId: '1234567890',
      password: 'secret',
      token: 'jwt',
    },
  });
  const meta = JSON.parse(inserts[0].params[6]);
  assert.strictEqual(meta.ghanaCard, undefined);
  assert.strictEqual(meta.votersId, undefined);
  assert.strictEqual(meta.password, undefined);
  assert.strictEqual(meta.token, undefined);
  assert.strictEqual(meta.fullName, 'X');
  console.log('offline-security-checks PASSED');
}
