const { test, expect } = require('@playwright/test');
const {
  openReservation,
  pickDateAndSlot,
  goToStep2,
  fillContact,
  goToStep3,
  pickFirstAvailableTable
} = require('./helpers/reservation-flow');

// Test XSS prevention a input validation

test('XSS prevention - name field se escapuje v adminu', async ({ page }) => {
  test.setTimeout(90_000);

  const xssPayload = '<img src=x onerror="alert(1)">';
  const stamp = Date.now();
  
  await openReservation(page);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  await fillContact(page, {
    name: xssPayload,
    phone: '+420 777 ' + String(stamp).slice(-6),
    email: 'xss+' + stamp + '@barx.cz'
  });
  await goToStep3(page);
  await page.selectOption('#guestCount', '2');
  await pickFirstAvailableTable(page);

  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click();
  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla uložená');

  // Ověř, že v adminu se XSS payload nespustil (měl by být escapován)
  await page.goto('/admin.html');
  await page.click('[data-view="table"]');
  await page.fill('#searchInput', 'xss+' + stamp + '@barx.cz');
  const row = page.locator('#reservationRows tr').filter({ hasText: 'xss+' + stamp + '@barx.cz' }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText('<img src=x onerror="alert(1)">');
});

test('validace telefonu - chybný formát se odmítne', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];
  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);

  await page.fill('#guestName', 'Test User');
  await page.fill('#guestPhone', 'invalid-phone');
  await page.fill('#guestEmail', 'test@email.com');

  await page.locator('.form-step.active .next-step[data-next="3"]').click();
  
  // Mělo by se zobrazit chybové hlášení
  await expect(page.locator('.field-error').filter({ hasText: 'telefon' })).toBeVisible();
});

test('validace emailu - prázdný se odmítne', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];
  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);

  await page.fill('#guestName', 'Test User');
  await page.fill('#guestPhone', '+420 777 123456');
  await page.fill('#guestEmail', '');

  await page.locator('.form-step.active .next-step[data-next="3"]').click();
  
  // Mělo by se zobrazit chybové hlášení
  await expect(page.locator('.field-error').filter({ hasText: 'e-mail' })).toBeVisible();
});

test('host count - nula hostů se odmítne', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  // guestCount defaultně má 4 - pokus se ho setovat na 0
  await expect(page.locator('#guestCount')).toHaveValue('4');

  // Snaha zkusit setovat nižší hodnotu není možná v select (min value default)
  // Oveř, že select má pouze platné hodnoty
  const options = await page.locator('#guestCount option').allTextContents();
  expect(options).not.toContain('0');
});

test('API - concurrent booking same table chybí detekci', async ({ request }) => {
  // Tento test ukazuje, že server neochraňuje proti race conditions
  test.setTimeout(60_000);

  const stamp = Date.now();
  const tomorrowIso = new Date();
  tomorrowIso.setDate(tomorrowIso.getDate() + 1);
  const dateStr = tomorrowIso.toISOString().split('T')[0];

  const payload1 = {
    name: 'Concurrent ' + stamp,
    phone: '+420 777 ' + String(stamp).slice(-6),
    email: 'concurrent+' + stamp + '@barx.cz',
    guests: 2,
    date: dateStr,
    slot: '19:00',
    tableId: 'bar-2',
    vibe: 5,
    note: 'First booking'
  };

  const payload2 = {
    ...payload1,
    email: 'concurrent2+' + stamp + '@barx.cz',
    note: 'Second booking (should fail)'
  };

  // Pošli obě rezervace paralelně
  const [res1, res2] = await Promise.all([
    request.post('/api/reservations', { data: payload1 }),
    request.post('/api/reservations', { data: payload2 })
  ]);

  // Alespoň jeden by měl vrátit 409 (konflikt) kvůli race condition ochraně
  const statuses = [res1.status(), res2.status()];
  expect(statuses).toEqual(expect.arrayContaining([409]));
});
