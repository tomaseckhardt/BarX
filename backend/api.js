// ===== API router — obsluha /api/reservations endpointů =====
// Routuje HTTP požadavky na příslušné handlery a zajišťuje rate limiting.

const { getClientIp, getBody, getCorsHeaders, getSecurityHeaders, sendJson, logError } = require('./http');
const { isRateLimited } = require('./rate-limit');
const {
  validateReservation,
  normalizeReservation,
  validatePatchPayload,
  sortReservations,
  getReservationIdFromPath,
  findDuplicateReservation,
  isValidUUID
} = require('./reservations');
const { withFileLock, readReservations, writeReservations } = require('./storage');

async function handleReservationCreate(req, res, payload) {
  const error = validateReservation(payload);
  if (error) {
    sendJson(req, res, 400, { error });
    return;
  }

  try {
    const result = await withFileLock(async () => {
      const reservations = await readReservations();
      if (findDuplicateReservation(reservations, payload)) {
        return { error: 'Tenhle stůl je v daném čase už rezervovaný.', statusCode: 409 };
      }

      const reservation = normalizeReservation(payload);
      reservations.push(reservation);
      await writeReservations(reservations);
      return { reservation, statusCode: 201 };
    });

    if (result.error) {
      sendJson(req, res, result.statusCode, { error: result.error });
      return;
    }

    sendJson(req, res, result.statusCode, { reservation: result.reservation });
  } catch (error) {
    logError(error, 'POST /api/reservations');
    sendJson(req, res, 500, { error: 'Chyba při vytváření rezervace.' });
  }
}

async function handleReservationDelete(req, res, pathname) {
  const id = getReservationIdFromPath(pathname);
  if (!isValidUUID(id)) {
    sendJson(req, res, 400, { error: 'Neplatné ID.' });
    return;
  }

  const reservations = await readReservations();
  const nextReservations = reservations.filter(item => item.id !== id);
  if (nextReservations.length === reservations.length) {
    sendJson(req, res, 404, { error: 'Rezervace nebyla nalezena.' });
    return;
  }

  await writeReservations(nextReservations);
  sendJson(req, res, 200, { ok: true });
}

async function handleReservationPatch(req, res, pathname, payload) {
  const id = getReservationIdFromPath(pathname);
  if (!isValidUUID(id)) {
    sendJson(req, res, 400, { error: 'Neplatné ID.' });
    return;
  }

  const patchError = validatePatchPayload(payload);
  if (patchError) {
    sendJson(req, res, 400, { error: patchError });
    return;
  }

  const reservations = await readReservations();
  const index = reservations.findIndex(item => item.id === id);
  if (index === -1) {
    sendJson(req, res, 404, { error: 'Rezervace nebyla nalezena.' });
    return;
  }

  const current = reservations[index];
  const next = {
    ...current,
    ...(Object.prototype.hasOwnProperty.call(payload, 'status') ? { status: String(payload.status).trim() } : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'note') ? { note: String(payload.note || '').trim() } : {}),
    updatedAt: new Date().toISOString()
  };

  reservations[index] = next;
  await writeReservations(reservations);
  sendJson(req, res, 200, { reservation: next });
}

async function handleApi(req, res, pathname) {
  // Preflight CORS požadavek — prohlížeč ho posílá před každým cross-origin requestem
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...getSecurityHeaders(),
      ...getCorsHeaders(req)
    });
    res.end();
    return;
  }

  // Rate limiting pouze pro mutující metody — GET je bez omezení
  if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      sendJson(req, res, 429, { error: 'Příliš mnoho požadavků. Zkuste to za chvíli.' });
      return;
    }
  }

  if (pathname === '/api/reservations' && req.method === 'GET') {
    try {
      const reservations = await readReservations();
      sendJson(req, res, 200, { reservations: sortReservations(reservations) });
    } catch (error) {
      logError(error, 'GET /api/reservations');
      sendJson(req, res, 500, { error: 'Chyba při čtení dat.' });
    }
    return;
  }

  if (pathname === '/api/reservations' && req.method === 'POST') {
    let payload;
    try {
      payload = await getBody(req);
    } catch (error) {
      const message = error.message === 'Payload too large'
        ? 'Požadavek je příliš velký.'
        : 'Neplatný formát dat (očekáváno JSON).';
      sendJson(req, res, 400, { error: message });
      return;
    }
    await handleReservationCreate(req, res, payload);
    return;
  }

  if (pathname.startsWith('/api/reservations/') && req.method === 'DELETE') {
    await handleReservationDelete(req, res, pathname);
    return;
  }

  if (pathname.startsWith('/api/reservations/') && req.method === 'PATCH') {
    const payload = await getBody(req);
    await handleReservationPatch(req, res, pathname, payload);
    return;
  }

  sendJson(req, res, 404, { error: 'API endpoint nebyl nalezen.' });
}

module.exports = {
  handleApi
};