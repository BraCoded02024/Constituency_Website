'use strict';

/**
 * Smoke-test Phase 1 modules without requiring a live database.
 * Run: node scripts/phase1-smoke.js
 */
const path = require('path');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const root = path.join(__dirname, '..');

const schema = require(path.join(root, 'data/delegateSchema'));
assert(typeof schema.ensureDelegateSchema === 'function', 'ensureDelegateSchema export');
assert(schema.INITIAL_ELECTORAL_AREAS.length === 5, '5 seed areas');
assert(schema.INITIAL_CATEGORIES.length === 6, '6 seed categories');

const { nextDelegateCode } = require(path.join(root, 'lib/delegateCodes'));
assert(typeof nextDelegateCode === 'function', 'nextDelegateCode');

const { logActivity } = require(path.join(root, 'lib/activityLog'));
assert(typeof logActivity === 'function', 'logActivity');

const { SURVEY_STATUSES, SURVEY_CONFIDENCES } = require(path.join(root, 'lib/surveyConstants'));
assert(SURVEY_STATUSES.includes('Supporting'), 'survey statuses');
assert(SURVEY_CONFIDENCES.includes('High'), 'confidences');

const serialize = require(path.join(root, 'data/serialize'));
assert(typeof serialize.delegate === 'function', 'serialize.delegate');
assert(typeof serialize.electoralArea === 'function', 'serialize.electoralArea');
assert(typeof serialize.surveyRecord === 'function', 'serialize.surveyRecord');

require(path.join(root, 'routes/electoralAreas'));
require(path.join(root, 'routes/pollingStations'));
require(path.join(root, 'routes/delegateCategories'));
require(path.join(root, 'routes/delegateDashboard'));
require(path.join(root, 'routes/activity'));
require(path.join(root, 'routes/delegates'));

const mountApi = require(path.join(root, 'mountApi'));
assert(typeof mountApi === 'function', 'mountApi');

console.log('Phase 1 smoke checks passed.');
