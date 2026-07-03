'use strict';

/** Safe load for Vercel's Express bundle (server.cjs interop). */
function unwrap(mod) {
  if (!mod) return mod;
  if (typeof mod.getDb === 'function') return mod;
  if (mod.default && typeof mod.default.getDb === 'function') return mod.default;
  return mod;
}

module.exports = unwrap(require('./database'));
