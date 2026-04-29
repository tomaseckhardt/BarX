// ===== Centrální konfigurace BarX serveru =====
// Všechny konstanty jsou definovány tady — žádný modul si hodnoty nepočítá sám.
// Prostředí se přizpůsobuje přes env proměnné (PORT, ALLOWED_ORIGINS).

const path = require('path');

// Kořenový adresář projektu — o úroveň výš než tento soubor (backend/)
const ROOT_DIR = path.join(__dirname, '..');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(ROOT_DIR, 'reservations.json');
const LOG_FILE = path.join(ROOT_DIR, 'logs', 'server.log');

// Povolené CORS origins — čárkou oddělený seznam v env proměnné ALLOWED_ORIGINS.
// Výchozí hodnota pokrývá lokální vývoj (localhost i 127.0.0.1).
const ALLOWED_ORIGINS = new Set(
  String(process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

const VALIDATION = {
  MAX_GUESTS: 100,
  // Rezervace se auto-dokončí 1 hodinu po jejím začátku
  AUTO_COMPLETE_DELAY_MS: 60 * 60 * 1000,
  // Background job kontroluje expirované rezervace každých 5 minut
  AUTO_COMPLETE_INTERVAL_MS: 5 * 60 * 1000,
  // Maximální velikost těla POST/PATCH požadavku (1 MB)
  MAX_PAYLOAD_SIZE: 1_000_000
};

// Regulární výrazy pro validaci vstupů
const PATTERNS = {
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^\d{2}:00$/,        // pouze celé hodiny (slot)
  TIME_FULL: /^\d{2}:\d{2}$/, // pro parsování date+slot do ms
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]{1,64}@[^\s@]{1,64}\.[^\s@]{2,}$/,
  PHONE: /^[+\d][\d\s]{7,}$/
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const TABLES = [
  { id: 'bar-2', seats: 2 },
  { id: 'window-4', seats: 4 },
  { id: 'lounge-4', seats: 4 },
  { id: 'booth-6', seats: 6 },
  { id: 'vip-8', seats: 8 }
];

const RESERVATION_STATUSES = new Set(['new', 'called', 'confirmed', 'done', 'completed']);

module.exports = {
  PORT,
  ROOT_DIR,
  DATA_FILE,
  LOG_FILE,
  ALLOWED_ORIGINS,
  VALIDATION,
  PATTERNS,
  MIME_TYPES,
  TABLES,
  RESERVATION_STATUSES
};