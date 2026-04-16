const { test, expect } = require('@playwright/test');
const {
  openReservation,
  pickDateAndSlot,
  goToStep2,
  fillContact,
  goToStep3,
  pickFirstAvailableTable
} = require('./helpers/reservation-flow');

// Edge cases a business logic testy

test('happy hour - pondělí 17:00-18:59 má značku', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  // Naplánuj si Pondělí
  const monday = new Date();
  const daysUntilMonday = (1 - monday.getDay() + 7) % 7 || 7;
  monday.setDate(monday.getDate() + daysUntilMonday);
  const mondayIso = monday.toISOString().split('T')[0];

  await page.fill('#reservationDate', mondayIso);
  await page.dispatchEvent('#reservationDate', 'change');

  // Hledej HH značku v 17:00 slotu
  const slot17 = page.getByRole('button', { name: /^17:00/ }).first();
  await expect(slot17).toBeVisible({ timeout: 15_000 });
  await expect(slot17).toContainText('Happy Hour');
});

test('happy hour - neděle NEMÁ happy hour', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  // Naplánuj si Neděli
  const sunday = new Date();
  const daysUntilSunday = (0 - sunday.getDay() + 7) % 7 || 7;
  sunday.setDate(sunday.getDate() + daysUntilSunday);
  const sundayIso = sunday.toISOString().split('T')[0];

  await page.fill('#reservationDate', sundayIso);
  await page.dispatchEvent('#reservationDate', 'change');

  // Neděle se otevírá v 18:00, takže hledáme první dostupný slot (bude 18:00)
  // a ověřujeme, že NEMÁ Happy Hour značku (na neděli HH nikdy není)
  const firstSlot = page.locator('#slotGrid .slot-btn').first();
  await expect(firstSlot).toBeVisible({ timeout: 15_000 });
  await expect(firstSlot).not.toContainText('Happy Hour');
});

test('vibe system - vibe 9+ aktivuje 10% slevu', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  await fillContact(page, {
    name: 'Vibe Test',
    phone: '+420 777 555111',
    email: 'vibe9@example.cz'
  });
  await goToStep3(page);

  // Nastav vibe na 9
  await page.locator('#plannedVibe').evaluate((el) => {
    el.value = '9';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // Ověř, že se zobrazí varování o slevě
  await expect(page.locator('#vibeDiscountBadge')).toContainText('SPLNĚNO');
});

test('vibe system - vibe 11 = 100% sleva (legendary)', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  await fillContact(page, {
    name: 'Vibe Legendary',
    phone: '+420 777 555112',
    email: 'vibe11@example.cz'
  });
  await goToStep3(page);

  // Nastav vibe na 11
  await page.locator('#plannedVibe').evaluate((el) => {
    el.value = '11';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // Ověř, že se zobrazí LEGENDARY varování
  await expect(page.locator('#vibeDiscountBadge')).toContainText('LEGENDARY');
  await expect(page.locator('#vibeDiscountBadge')).toContainText('100%');
  await expect(page.locator('#summaryEstimateTotal')).toContainText('ZDARMA');
});

test('table validation - nelze vybrat stůl s málo místy', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  // Nastav 6 hostů
  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  await fillContact(page, {
    name: 'Table Validation',
    phone: '+420 777 555113',
    email: 'table-valid@example.cz'
  });
  await goToStep3(page);
  await page.selectOption('#guestCount', '6');

  // Bar 02 má jen 2 místa - měl by být disabled
  const bar02 = page.locator('#tableMap .map-table.table-bar-2');
  await expect(bar02).toHaveClass(/is-disabled/);
});

test('date picker - neumožní zvolit dnešní den', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  // Pokus se setovat dnešní datum
  const inputElement = page.locator('#reservationDate');
  
  // Zkontroluj, že min attribute je nastaven na zítřek
  const min = await inputElement.getAttribute('min');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];
  
  expect(min).toBe(tomorrowIso);
});

test('po uložení se formulář vrátí do výchozího stavu', async ({ page }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  // Vytvoř rezervaci
  await openReservation(page);
  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  await fillContact(page, {
    name: 'Saved Test ' + stamp,
    phone: '+420 777 ' + String(stamp).slice(-6),
    email: 'saved+' + stamp + '@barx.cz'
  });
  await goToStep3(page);
  await page.selectOption('#guestCount', '3');
  await pickFirstAvailableTable(page);

  await page.locator('#plannedVibe').evaluate((el) => {
    el.value = '7';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click();
  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla poslána do baru');

  // Ověř, že po odeslání je formulář resetovaný
  await expect(page.locator('#guestName')).toHaveValue('');
  await expect(page.locator('#guestCount')).toHaveValue('4');
  await expect(page.locator('#reservationDrink')).toHaveValue('MonstRum');
  await expect(page.locator('#plannedVibe')).toHaveValue('5');
  await expect(page.locator('#summaryTime')).toContainText('Vyber čas');
});
