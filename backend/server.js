// ===== BarX Reservation Server =====
// REST API pro správu rezervací s perzistencí do JSON
// Endpoints: GET/POST /api/reservations, PATCH/DELETE /api/reservations/:id

const http = require('http');
const { randomUUID } = require('crypto');

const { handleApi } = require('./api');
const { PORT, VALIDATION } = require('./config');
const { logError, logRequest, sendJson } = require('./http');
const { autoCompleteExpiredReservations } = require('./reservations');
const { ensureDataFile, readReservations, writeReservations } = require('./storage');
const { handleStatic } = require('./static');

const server = http.createServer(async (req, res) => {
  const startedAt = Date.now();
  const requestId = randomUUID();
  let requestPath = String(req.url || '/');

  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    logRequest(req, requestPath, res.statusCode, Date.now() - startedAt, requestId);
  });

  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    requestPath = pathname;
    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
      return;
    }
    await handleStatic(req, res, pathname);
  } catch (error) {
    logError(error, `HTTP Request Handler [${requestId}]`);
    sendJson(req, res, 500, { error: 'Interní chyba serveru.' });
  }
});

// Guard příznak brání souběžnému spuštění jobu, pokud předchozí běh ještě neskončil
let autoCompleteRunning = false;
setInterval(async () => {
  if (autoCompleteRunning) return;
  autoCompleteRunning = true;
  try {
    const reservations = await readReservations();
    const { next, changed } = autoCompleteExpiredReservations(reservations);
    if (changed) {
      await writeReservations(next);
      console.log(`[Auto-Complete] ${new Date().toISOString()} - Automaticky aktualizovány expirované rezervace`);
    }
  } catch (error) {
    logError(error, 'Background Auto-Complete Job');
  } finally {
    autoCompleteRunning = false;
  }
}, VALIDATION.AUTO_COMPLETE_INTERVAL_MS);

ensureDataFile().then(() => {
  server.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] BarX server running at http://localhost:${PORT}`);
    console.log(`Background auto-complete running every ${VALIDATION.AUTO_COMPLETE_INTERVAL_MS / 1000}s`);
  });
}).catch(error => {
  logError(error, 'Server Startup');
  process.exit(1);
});
