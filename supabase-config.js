(function () {
  'use strict';

  // GitHub Pages-ready public config.
  // Keep only publishable key here, never service role key.
  var config = {
    url: 'https://ommufckzknmmxziaejle.supabase.co',
    publishableKey: 'sb_publishable_vmQ6wpGkw0KteUFMlXPgYg_D_vZ886c',
    table: 'reservations'
  };

  function assertConfig() {
    if (!config.url || !config.publishableKey || config.publishableKey.indexOf('REPLACE_WITH_') === 0) {
      throw new Error('Supabase neni nakonfigurovane. Nastav url a publishableKey v supabase-config.js.');
    }
  }

  function errorMessageFromPayload(payload, fallbackMessage) {
    if (!payload) return fallbackMessage;
    if (typeof payload === 'string') return payload;
    if (payload.message) return String(payload.message);
    if (payload.error_description) return String(payload.error_description);
    if (payload.error) return String(payload.error);
    return fallbackMessage;
  }

  function buildQuery(params) {
    var query = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
      query.set(key, params[key]);
    });
    return query.toString();
  }

  async function supabaseRequest(pathWithQuery, options) {
    assertConfig();
    var opts = options || {};

    var response = await fetch(config.url + '/rest/v1/' + pathWithQuery, {
      method: opts.method || 'GET',
      headers: {
        apikey: config.publishableKey,
        Authorization: 'Bearer ' + config.publishableKey,
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });

    var contentType = String(response.headers.get('content-type') || '');
    var payload = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      throw new Error(errorMessageFromPayload(payload, 'Supabase request failed (' + response.status + ').'));
    }

    return payload;
  }

  function parseReservationPath(url) {
    var value = String(url || '').trim();
    var base = '/api/reservations';

    if (value === base) {
      return { isCollection: true, id: '' };
    }

    if (!value.startsWith(base + '/')) {
      return { isCollection: false, id: '' };
    }

    var id = value.slice((base + '/').length).trim();
    return { isCollection: false, id: id };
  }

  async function listReservations() {
    var query = buildQuery({
      select: '*',
      order: 'date.asc,slot.asc'
    });
    var payload = await supabaseRequest(config.table + '?' + query);
    return Array.isArray(payload) ? payload : [];
  }

  async function createReservation(rawData) {
    var data = {
      name: String(rawData.name || '').trim(),
      phone: String(rawData.phone || '').trim(),
      email: String(rawData.email || '').trim(),
      guests: Number(rawData.guests),
      date: String(rawData.date || '').trim(),
      slot: String(rawData.slot || '').trim(),
      tableId: String(rawData.tableId || '').trim(),
      vibe: Number(rawData.vibe),
      note: rawData.note ? String(rawData.note).trim() : '',
      drink: rawData.drink ? String(rawData.drink).trim() : '',
      status: 'new',
      createdAt: new Date().toISOString()
    };

    var duplicateQuery = buildQuery({
      select: 'id',
      date: 'eq.' + data.date,
      slot: 'eq.' + data.slot,
      tableId: 'eq.' + data.tableId,
      limit: '1'
    });
    var duplicates = await supabaseRequest(config.table + '?' + duplicateQuery);
    if (Array.isArray(duplicates) && duplicates.length > 0) {
      throw new Error('Tenhle stul je v danem case uz rezervovany.');
    }

    var payload = await supabaseRequest(config.table, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: data
    });

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error('Nepodarilo se ulozit rezervaci.');
    }

    return payload[0];
  }

  async function patchReservation(id, patch) {
    var query = buildQuery({
      select: '*',
      id: 'eq.' + id
    });

    var payload = await supabaseRequest(config.table + '?' + query, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: patch
    });

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error('Rezervace nebyla nalezena.');
    }

    return payload[0];
  }

  async function deleteReservation(id) {
    var query = buildQuery({
      select: 'id',
      id: 'eq.' + id
    });

    var payload = await supabaseRequest(config.table + '?' + query, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' }
    });

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error('Rezervace nebyla nalezena.');
    }

    return true;
  }

  async function apiRequest(url, options) {
    var opts = options || {};
    var method = String(opts.method || 'GET').toUpperCase();
    var route = parseReservationPath(url);

    if (route.isCollection && method === 'GET') {
      return { reservations: await listReservations() };
    }

    if (route.isCollection && method === 'POST') {
      var createPayload = opts.body ? JSON.parse(opts.body) : {};
      return { reservation: await createReservation(createPayload) };
    }

    if (!route.isCollection && route.id && method === 'PATCH') {
      var patchPayload = opts.body ? JSON.parse(opts.body) : {};
      var normalizedPatch = {};
      if (Object.prototype.hasOwnProperty.call(patchPayload, 'status')) {
        normalizedPatch.status = String(patchPayload.status || '').trim();
      }
      if (Object.prototype.hasOwnProperty.call(patchPayload, 'note')) {
        normalizedPatch.note = String(patchPayload.note || '').trim();
      }
      return { reservation: await patchReservation(route.id, normalizedPatch) };
    }

    if (!route.isCollection && route.id && method === 'DELETE') {
      await deleteReservation(route.id);
      return { ok: true };
    }

    throw new Error('Nepodporovana API operace: ' + method + ' ' + String(url || ''));
  }

  window.BARX_SUPABASE = config;
  window.BARX_DATA_API = {
    request: apiRequest,
    listReservations: listReservations,
    createReservation: createReservation,
    patchReservation: patchReservation,
    deleteReservation: deleteReservation
  };
})();
