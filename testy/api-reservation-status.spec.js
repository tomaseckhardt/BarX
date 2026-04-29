const { test, expect } = require('@playwright/test');

function toLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

async function createReservationWithRetry(request, stamp) {
  const slots = ['17:00', '18:00', '19:00', '20:00', '21:00'];
  const tables = ['window-4', 'lounge-4', 'booth-6', 'vip-8'];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const future = new Date();
    future.setDate(future.getDate() + 30 + attempt);
    const dateIso = toLocalIso(future);

    const createResponse = await request.post('/api/reservations', {
      data: {
        name: 'API Status ' + stamp + '-' + attempt,
        phone: '+420 777 ' + String(stamp + attempt).slice(-6),
        email: 'api-status+' + stamp + '-' + attempt + '@barx.cz',
        guests: 3,
        date: dateIso,
        slot: slots[attempt % slots.length],
        tableId: tables[attempt % tables.length],
        vibe: 6,
        note: 'API patch test',
        drink: 'MonstRum'
      }
    });

    if (createResponse.status() === 409) {
      continue;
    }

    return createResponse;
  }

  throw new Error('Nepodařilo se vytvořit unikátní rezervaci po 8 pokusech.');
}

test('API PATCH meni status rezervace', async ({ request }) => {
  test.setTimeout(60_000);

  const stamp = Date.now();
  const createResponse = await createReservationWithRetry(request, stamp);

  expect(createResponse.ok()).toBeTruthy();
  const createdPayload = await createResponse.json();
  expect(createdPayload?.reservation?.id).toBeTruthy();
  const id = createdPayload.reservation.id;

  const patchResponse = await request.patch('/api/reservations/' + id, {
    data: { status: 'confirmed' }
  });
  expect(patchResponse.ok()).toBeTruthy();

  const patchPayload = await patchResponse.json();
  expect(patchPayload.reservation.status).toBe('confirmed');

  const listResponse = await request.get('/api/reservations');
  expect(listResponse.ok()).toBeTruthy();
  const listPayload = await listResponse.json();
  const updated = listPayload.reservations.find(item => item.id === id);
  expect(updated).toBeTruthy();
  expect(updated.status).toBe('confirmed');

  const invalidPatchResponse = await request.patch('/api/reservations/' + id, {
    data: { status: 'invalid-status' }
  });
  expect(invalidPatchResponse.status()).toBe(400);

  const deleteResponse = await request.delete('/api/reservations/' + id);
  expect(deleteResponse.ok()).toBeTruthy();
});
