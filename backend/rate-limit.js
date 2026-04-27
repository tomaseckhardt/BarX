// ===== Rate limiting (sliding window) =====
// Platí pouze pro mutující metody (POST, PATCH, DELETE) — viz api.js.
// Čtecí požadavky (GET) nejsou omezeny.

const RATE_LIMIT = {
  windowMs: 60_000,     // okno 1 minuta
  maxRequests: 300      // max 300 zápisových požadavků za minutu na IP
};

// Mapa IP → pole timestampů požadavků v aktuálním okně
const rateLimitStore = new Map();

// Sliding window algoritmus: vyřadí timestampy starší než 1 min, pak zkontroluje limit.
function isRateLimited(ip) {
  const now = Date.now();
  let timestamps = rateLimitStore.get(ip);
  if (!timestamps) {
    timestamps = [];
    rateLimitStore.set(ip, timestamps);
  }
  while (timestamps.length > 0 && timestamps[0] <= now - RATE_LIMIT.windowMs) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_LIMIT.maxRequests) return true;
  timestamps.push(now);
  return false;
}

// Pravidelný cleanup — odstraní záznamy pro IP adresy, které jsou dlouho neaktivní,
// aby mapa nerostla donekonečna.
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitStore) {
    while (timestamps.length > 0 && timestamps[0] <= now - RATE_LIMIT.windowMs) {
      timestamps.shift();
    }
    if (timestamps.length === 0) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60_000);

module.exports = {
  isRateLimited
};