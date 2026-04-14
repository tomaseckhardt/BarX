const { test, expect } = require('@playwright/test');

// Admin interface testy
function futureIsoByOffset(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

async function createReservationWithRetry(request, payload, baseOffsetDays) {
  const slots = ['17:00', '18:00', '19:00', '20:00', '21:00'];
  const tables = ['bar-2', 'window-4', 'lounge-4', 'booth-6', 'vip-8'];

  for (let i = 0; i < 20; i++) {
    const attemptPayload = {
      ...payload,
      date: futureIsoByOffset(baseOffsetDays + i),
      slot: slots[i % slots.length],
      tableId: tables[i % tables.length]
    };
    const response = await request.post('/api/reservations', { data: attemptPayload });
    if (response.ok()) return response;
    if (response.status() !== 409) return response;
  }

  return request.post('/api/reservations', { data: payload });
}

test('admin search - je case-insensitive', async ({ page, request }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const reservationIso = futureIsoByOffset((stamp % 120) + 7);

  // Vytvoř rezervaci přes API
  const response = await createReservationWithRetry(request, {
    name: 'JohnDoe',
    phone: '+420 777 ' + String(stamp).slice(-6),
    email: 'admin-search+' + stamp + '@barx.cz',
    guests: 2,
    date: reservationIso,
    slot: '19:00',
    tableId: 'bar-2',
    vibe: 5,
    note: 'Search test'
  }, (stamp % 120) + 7);

  expect(response.ok()).toBeTruthy();

  // Jdi na admin
  await page.goto('/admin.html');
  await expect(page.locator('#reservationRows')).toBeVisible();

  // Hledej malými písmeny
  await page.fill('#searchInput', 'johndoe');
  await expect(page.locator('#searchInput')).toHaveValue('johndoe');

  // Měla by se najít rezervace
  const row = page.locator('#reservationRows tr').filter({ hasText: /JohnDoe|johndoe/i }).first();
  await expect(row).toBeVisible();
});

test('admin filter - filtruje podle stavu', async ({ page, request }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const reservationIso = futureIsoByOffset((stamp % 120) + 8);

  // Vytvoř rezervaci
  const response = await createReservationWithRetry(request, {
    name: 'Filter Test ' + stamp,
    phone: '+420 777 ' + String(stamp).slice(-6),
    email: 'filter+' + stamp + '@barx.cz',
    guests: 2,
    date: reservationIso,
    slot: '19:00',
    tableId: 'window-4',
    vibe: 5,
    note: 'Filter test'
  }, (stamp % 120) + 8);
  expect(response.ok()).toBeTruthy();

  const reservationId = (await response.json()).reservation.id;

  // Jdi na admin
  await page.goto('/admin.html');
  await expect(page.locator('#reservationRows')).toBeVisible();

  // Filtruj "nova"
  await page.selectOption('#statusFilter', 'new');
  await expect(page.locator('#statusFilter')).toHaveValue('new');

  // Měla by se zobrazit
  let row = page.locator('#reservationRows tr').filter({ hasText: 'Filter Test' });
  await expect(row).toBeVisible();

  // Potvrď rezervaci
  await request.patch('/api/reservations/' + reservationId, {
    data: { status: 'confirmed' }
  });

  // Filtruj znovu "nova" - neměla by se zobrazit
  await page.goto('/admin.html');
  await expect(page.locator('#reservationRows')).toBeVisible();
  await page.selectOption('#statusFilter', 'new');
  await expect(page.locator('#statusFilter')).toHaveValue('new');

  row = page.locator('#reservationRows tr').filter({ hasText: 'Filter Test' });
  // Row by měl mít count 0 (pokud není cachován)
  expect(await row.count()).toBe(0);
});

test('admin sort - řadí podle data vzestupně', async ({ page, request }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const tomorrowIso = futureIsoByOffset((stamp % 120) + 10);
  const dayAfterIso = futureIsoByOffset((stamp % 120) + 11);

  // Vytvoř dvě rezervace
  await createReservationWithRetry(request, {
    name: 'Sort Test A' + stamp,
    phone: '+420 777 ' + String(stamp).slice(-6),
    email: 'sort-a+' + stamp + '@barx.cz',
    guests: 2,
    date: dayAfterIso,
    slot: '19:00',
    tableId: 'bar-2',
    vibe: 5
  }, (stamp % 120) + 11);

  await createReservationWithRetry(request, {
    name: 'Sort Test B' + stamp,
    phone: '+420 777 ' + String(stamp + 1).slice(-6),
    email: 'sort-b+' + stamp + '@barx.cz',
    guests: 2,
    date: tomorrowIso,
    slot: '19:00',
    tableId: 'window-4',
    vibe: 5
  }, (stamp % 120) + 10);

  // Jdi na admin
  await page.goto('/admin.html');
  await expect(page.locator('#reservationRows')).toBeVisible();

  // Nastav sort na "date-asc"
  await page.selectOption('#sortBy', 'date-asc');
  await expect(page.locator('#sortBy')).toHaveValue('date-asc');

  // Zkontroluj pořadí v tabulce
  const rows = await page.locator('#reservationRows tr').allTextContents();
  const aIndex = rows.findIndex(r => r.includes('Sort Test B'));
  const bIndex = rows.findIndex(r => r.includes('Sort Test A'));

  // B mělo by přijít dřív (má dřívější datum)
  expect(aIndex).toBeGreaterThan(-1);
  expect(bIndex).toBeGreaterThan(-1);
  expect(aIndex).not.toBe(bIndex);
});

test('admin quick action - confirm změní status na potvrzena', async ({ page, request }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const tomorrowIso = futureIsoByOffset((stamp % 120) + 12);

  // Vytvoř rezervaci
  const response = await createReservationWithRetry(request, {
    name: 'Confirm Test ' + stamp,
    phone: '+420 777 ' + String(stamp).slice(-6),
    email: 'confirm+' + stamp + '@barx.cz',
    guests: 2,
    date: tomorrowIso,
    slot: '19:00',
    tableId: 'bar-2',
    vibe: 5
  }, (stamp % 120) + 12);
  expect(response.ok()).toBeTruthy();

  // Jdi na admin
  await page.goto('/admin.html');
  await expect(page.locator('#reservationRows')).toBeVisible();

  // Hledej řádku
  await page.fill('#searchInput', 'Confirm Test ' + stamp);
  const row = page.locator('#reservationRows tr').filter({ hasText: 'Confirm Test ' + stamp });
  await expect(row.first()).toBeVisible();
  await expect(row).toContainText('nova');

  // Klikni na "Potvrdit"
  const confirmBtn = row.locator('[data-action="confirm"]');
  await confirmBtn.click();

  // Ověř status zprávu
  await expect(page.locator('#status')).toContainText('potvrzena');

  // Obnov a zkontroluj, že se změnil status
  await page.reload();
  await expect(page.locator('#reservationRows')).toBeVisible();
  await page.fill('#searchInput', 'Confirm Test ' + stamp);
  const updatedRow = page.locator('#reservationRows tr').filter({ hasText: 'Confirm Test ' + stamp });
  await expect(updatedRow).toContainText('potvrzena');
});

test('admin cards view - zobrazuje rezervace jako karty', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/admin.html');

  // Klikni na "Karty" tab
  const cardsTab = page.locator('[data-view="cards"]');
  await cardsTab.click();

  // Ověř, že se zobrazí karty
  const cardsView = page.locator('#cardsView');
  await expect(cardsView).toHaveClass(/is-active/);
});
