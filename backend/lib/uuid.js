const { randomUUID } = require('crypto');

/** UUID v4 compatible with former `uuid` package usage in CommonJS routes. */
function uuidv4() {
  return randomUUID();
}

module.exports = { uuidv4, v4: uuidv4 };
