const { test, expect } = require('@playwright/test');
const {
  openReservation,
  pickDateAndSlot,
  goToStep2,
  fillContact,
  goToStep3,
  pickFirstAvailableTable
} = require('./helpers/reservation-flow');

test('admin quick actions meni stav rezervace', async ({ page }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const guestName = 'E2E Actions ' + stamp;
  const guestPhone = '+420 777 ' + String(stamp).slice(-6);
  const guestEmail = 'e2e-actions+' + stamp + '@barx.cz';

  await openReservation(page);

  const date = new Date();
  date.setDate(date.getDate() + ((stamp % 120) + 13));
  const tomorrowIso = date.toISOString().split('T')[0];

  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  await fillContact(page, { name: guestName, phone: guestPhone, email: guestEmail });
  await goToStep3(page);

  await page.selectOption('#guestCount', '3');
  await page.selectOption('#reservationDrink', 'MonstRum');
  await pickFirstAvailableTable(page);

  await page.fill('#reservationNote', 'E2E admin actions');
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click();
  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla poslána do baru');

  await page.goto('/admin.html');
  await page.click('[data-view="table"]');
  await page.fill('#searchInput', guestName);

  const row = () => page.locator('#reservationRows tr').filter({ hasText: guestName }).first();

  await expect(row()).toContainText('nova');

  await row().locator('[data-action="confirm"]').click();
  await expect(page.locator('#status')).toContainText('Rezervace byla potvrzena.');
  await page.fill('#searchInput', guestName);
  await expect(row()).toContainText('potvrzena');

  await row().locator('[data-action="done"]').click();
  await expect(page.locator('#status')).toContainText('Rezervace označena jako v pořádku.');
  await page.fill('#searchInput', guestName);
  await expect(row()).toContainText('v poradku');

  await row().locator('[data-action="delete"]').click();
  await expect(page.locator('#status')).toContainText('Rezervace byla smazána.');
});
