// ===== HTTP utility — hlavičky, CORS, logování, čtení těla =====
// Sdílené pomocné funkce používané napříč všemi backend moduly.

const fs = require('fs');
const path = require('path');

const { ALLOWED_ORIGINS, LOG_FILE, VALIDATION } = require('./config');

// Vrátí origin požadavku, pokud je na whitelistu — jinak null.
// Null znamená, že CORS hlavičky se do odpovědi nepřidají.
function getCorsOrigin(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin) return null;
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-src https://www.google.com"
  };
}

function getCorsHeaders(req) {
  const origin = getCorsOrigin(req);
  const headers = { Vary: 'Origin' };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET,POST,PATCH,DELETE,OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return headers;
}

function sendJson(req, res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...getSecurityHeaders(),
    ...getCorsHeaders(req)
  });
  res.end(JSON.stringify(payload));
}

function sendText(req, res, statusCode, message) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...getSecurityHeaders()
  });
  res.end(message);
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function logRequest(req, pathname, statusCode, durationMs, requestId) {
  const record = {
    ts: new Date().toISOString(),
    requestId,
    method: req.method,
    path: pathname,
    status: statusCode,
    durationMs,
    ip: getClientIp(req),
    ua: String(req.headers['user-agent'] || '').slice(0, 160)
  };
  console.log('[HTTP]', JSON.stringify(record));
}

// Chyby se zapisují do souboru server.log a zároveň na stderr.
function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${context}\nError: ${error.message}\nStack: ${error.stack}\n---\n`;
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFile(LOG_FILE, message, () => {});
  console.error(message);
}

// Načte tělo požadavku jako streaming chunks a parsuje JSON.
// Pokud tělo překročí MAX_PAYLOAD_SIZE, spojení se přeruší (ochrana před DoS).
function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > VALIDATION.MAX_PAYLOAD_SIZE) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

module.exports = {
  getSecurityHeaders,
  getCorsHeaders,
  sendJson,
  sendText,
  getClientIp,
  logRequest,
  logError,
  getBody
};