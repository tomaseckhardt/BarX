// ===== Doménová logika rezervací =====
// Validace, normalizace, řazení a auto-dokončení rezervací.

const { randomUUID } = require('crypto');

const {
  PATTERNS,
  TABLES,
  VALIDATION,
  RESERVATION_STATUSES
} = require('./config');

// Převede date + slot z rezervace na Unix timestamp v ms pro porovnávání.
function getReservationStartMs(item) {
  const dateValue = String(item.date || '');
  const slotValue = String(item.slot || '');
  if (!PATTERNS.DATE.test(dateValue)) return null;
  if (!PATTERNS.TIME_FULL.test(slotValue)) return null;
  const ms = new Date(dateValue + 'T' + slotValue + ':00').getTime();
  return Number.isFinite(ms) ? ms : null;
}

// Projde všechny rezervace a ty, jejichž čas vypršel (+ grace period z configu),
// označí jako 'completed'. Vrátí { next, changed } — changed říká, zda je třeba zapsat.
function autoCompleteExpiredReservations(items) {
  const nowMs = Date.now();
  let changed = false;
  const next = items.map(item => {
    const startMs = getReservationStartMs(item);
    if (startMs === null) return item;                                      // nelze parsovat datum
    if (nowMs < startMs + VALIDATION.AUTO_COMPLETE_DELAY_MS) return item;  // ještě nenastal čas
    if (String(item.status || 'new').trim() === 'completed') return item;  // již dokončeno

    changed = true;
    return {
      ...item,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };
  });

  return { next, changed };
}

function isValidEmail(email) {
  return typeof email === 'string' && PATTERNS.EMAIL.test(email);
}

function isValidPhone(phone) {
  return typeof phone === 'string' && PATTERNS.PHONE.test(phone);
}

function isValidUUID(id) {
  return typeof id === 'string' && PATTERNS.UUID.test(id);
}

function validateReservation(payload) {
  const requiredFields = ['name', 'phone', 'email', 'guests', 'date', 'slot', 'tableId', 'vibe'];
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      return 'Chybí povinné pole: ' + field;
    }
  }

  const name = String(payload.name).trim();
  const phone = String(payload.phone).trim();
  const email = String(payload.email).trim();
  const note = payload.note ? String(payload.note).trim() : '';
  const drink = payload.drink ? String(payload.drink).trim() : '';
  if (name.length > 100) return 'Jméno je příliš dlouhé (max 100 znaků).';
  if (phone.length > 30) return 'Telefonní číslo je příliš dlouhé.';
  if (email.length > 254) return 'E-mail je příliš dlouhý.';
  if (note.length > 1000) return 'Poznámka je příliš dlouhá (max 1000 znaků).';
  if (drink.length > 100) return 'Název drinku je příliš dlouhý.';

  const guests = Number(payload.guests);
  const vibe = Number(payload.vibe);
  const table = TABLES.find(item => item.id === payload.tableId);
  if (!table) return 'Neplatný stůl.';
  if (!Number.isInteger(guests) || guests < 1 || guests > VALIDATION.MAX_GUESTS) return 'Počet hostů musí být 1-' + VALIDATION.MAX_GUESTS + '.';
  if (!Number.isInteger(vibe) || vibe < 1 || vibe > 11) return 'Neplatná hodnota vibe (1-11).';
  if (guests > table.seats) return 'Vybraný stůl nemá dost míst.';
  if (!PATTERNS.DATE.test(payload.date)) return 'Neplatné datum.';
  if (!PATTERNS.TIME.test(payload.slot)) return 'Neplatný čas.';
  if (!isValidEmail(payload.email)) return 'Neplatný e-mail.';
  if (!isValidPhone(payload.phone)) return 'Neplatné telefonní číslo.';
  return null;
}

function normalizeReservation(payload) {
  const drink = typeof payload.drink === 'string' ? payload.drink.trim() : '';
  return {
    id: randomUUID(),
    name: String(payload.name).trim(),
    phone: String(payload.phone).trim(),
    email: String(payload.email).trim(),
    guests: Number(payload.guests),
    date: String(payload.date).trim(),
    slot: String(payload.slot).trim(),
    tableId: String(payload.tableId).trim(),
    vibe: Number(payload.vibe),
    status: 'new',
    note: payload.note ? String(payload.note).trim() : '',
    drink,
    createdAt: new Date().toISOString()
  };
}

function validatePatchPayload(payload) {
  const hasStatus = Object.prototype.hasOwnProperty.call(payload, 'status');
  const hasNote = Object.prototype.hasOwnProperty.call(payload, 'note');
  if (!hasStatus && !hasNote) return 'Není co aktualizovat.';
  if (hasStatus && !RESERVATION_STATUSES.has(String(payload.status).trim())) {
    return 'Neplatný stav rezervace.';
  }
  return null;
}

function sortReservations(items) {
  return [...items].sort((a, b) => {
    const left = new Date(a.date + 'T' + a.slot + ':00');
    const right = new Date(b.date + 'T' + b.slot + ':00');
    return left - right;
  });
}

function getReservationIdFromPath(pathname) {
  return String(pathname || '').split('/').pop();
}

function findDuplicateReservation(items, payload) {
  return items.find(item => item.date === payload.date && item.slot === payload.slot && item.tableId === payload.tableId);
}

module.exports = {
  autoCompleteExpiredReservations,
  validateReservation,
  normalizeReservation,
  validatePatchPayload,
  sortReservations,
  getReservationIdFromPath,
  findDuplicateReservation,
  isValidUUID
};