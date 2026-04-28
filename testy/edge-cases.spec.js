const { test, expect } = require('@playwright/test');
const {
  openReservation,
  pickDateAndSlot,
  goToStep2,
  fillContact,
  goToStep3,
  pickFirstAvailableTable,
  setPlannedVibe
} = require('./helpers/reservation-flow');
const { getTestUser } = require('./helpers/random-user');

// Edge cases a business logic testy
function toLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function futureIsoByOffset(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return toLocalIso(date);
}

test('happy hour - pondělí 17:00-18:59 má značku', async ({ page }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  // Naplánuj si Pondělí
  const monday = new Date();
  const daysUntilMonday = (1 - monday.getDay() + 7) % 7 || 7;
  monday.setDate(monday.getDate() + daysUntilMonday);
  const mondayIso = toLocalIso(monday);

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
  const sundayIso = toLocalIso(sunday);

  await page.fill('#reservationDate', sundayIso);
  await page.dispatchEvent('#reservationDate', 'change');

  // Neděle se otevírá v 18:00 a na žádném slotu nemá být HH badge.
  const slots = page.locator('#slotGrid .slot-btn');
  await expect(slots.first()).toBeVisible({ timeout: 20_000 });
  const slotTexts = await slots.allTextContents();
  expect(slotTexts.length).toBeGreaterThan(0);
  for (const text of slotTexts) {
    expect(text).not.toContain('Happy Hour');
  }
});

test('vibe system - vibe 9+ aktivuje 10% slevu', async ({ page, request }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const stamp = Date.now();
  const reservationIso = futureIsoByOffset((stamp % 120) + 15);

  await pickDateAndSlot(page, reservationIso);
  await goToStep2(page);
  const user = await getTestUser(request, { tag: 'Vibe Test' });
  await fillContact(page, {
    name: `${user.name} — Vibe 9+`,
    phone: user.phone,
    email: user.email
  });
  await goToStep3(page);

  // Nastav vibe na 9
  await setPlannedVibe(page, 9);

  // Ověř, že se zobrazí varování o slevě
  await expect(page.locator('#vibeDiscountBadge')).toContainText('SPLNĚNO');
});

test('vibe system - vibe 11 = 100% sleva (legendary)', async ({ page, request }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const stamp = Date.now();
  const reservationIso = futureIsoByOffset((stamp % 120) + 16);

  await pickDateAndSlot(page, reservationIso);
  await goToStep2(page);
  const user = await getTestUser(request, { tag: 'Vibe Legendary' });
  await fillContact(page, {
    name: `${user.name} — Vibe Legendary`,
    phone: user.phone,
    email: user.email
  });
  await goToStep3(page);

  // Nastav vibe na 11
  await setPlannedVibe(page, 11);

  // Ověř, že se zobrazí LEGENDARY varování
  await expect(page.locator('#vibeDiscountBadge')).toContainText('LEGENDARY');
  await expect(page.locator('#vibeDiscountBadge')).toContainText('100%');
  await expect(page.locator('#summaryEstimateTotal')).toContainText('ZDARMA');
});

test('table validation - nelze vybrat stůl s málo místy', async ({ page, request }) => {
  test.setTimeout(60_000);

  await openReservation(page);

  const stamp = Date.now();
  const reservationIso = futureIsoByOffset((stamp % 120) + 17);

  // Nastav 6 hostů
  await pickDateAndSlot(page, reservationIso);
  await goToStep2(page);
  const user = await getTestUser(request, { tag: 'Table Validation' });
  await fillContact(page, {
    name: user.name,
    phone: user.phone,
    email: user.email
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
  const tomorrowIso = toLocalIso(tomorrow);
  
  expect(min).toBe(tomorrowIso);
});

test('po uložení se formulář vrátí do výchozího stavu', async ({ page, request }) => {
  test.setTimeout(90_000);
  test.slow(); // tento test potřebuje více času při paralelním běhu

  const stamp = Date.now();
  const reservationIso = futureIsoByOffset((stamp % 120) + 18);

  // Vytvoř rezervaci
  await openReservation(page);
  await pickDateAndSlot(page, reservationIso);
  await goToStep2(page);
  const user = await getTestUser(request, { tag: 'Saved Test', stamp });
  await fillContact(page, {
    name: user.name,
    phone: user.phone,
    email: user.email
  });
  await goToStep3(page);
  await page.selectOption('#guestCount', '3');
  await pickFirstAvailableTable(page);

  await setPlannedVibe(page, 7);

  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click();
  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla poslána do baru');

  // Ověř, že po odeslání je formulář resetovaný
  await expect(page.locator('#guestName')).toHaveValue('');
  await expect(page.locator('#guestCount')).toHaveValue('4');
  await expect(page.locator('#reservationDrink')).toHaveValue('MonstRum');
  await expect(page.locator('#plannedVibe')).toHaveValue('0');
  await expect(page.locator('#summaryTime')).toContainText('Vyber čas');
});
