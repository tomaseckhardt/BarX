const { test, expect } = require('@playwright/test');

test('API PATCH meni status rezervace', async ({ request }) => {
  test.setTimeout(60_000);

  const stamp = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  const createResponse = await request.post('/api/reservations', {
    data: {
      name: 'API Status ' + stamp,
      phone: '+420 777 ' + String(stamp).slice(-6),
      email: 'api-status+' + stamp + '@barx.cz',
      guests: 3,
      date: tomorrowIso,
      slot: '18:00',
      tableId: 'window-4',
      vibe: 6,
      note: 'API patch test',
      drink: 'MonstRum'
    }
  });

  expect(createResponse.ok()).toBeTruthy();
  const createdPayload = await createResponse.json();
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
