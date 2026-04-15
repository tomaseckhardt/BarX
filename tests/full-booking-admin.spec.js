const { test, expect } = require('@playwright/test');
const {
  openReservation,
  pickDateAndSlot,
  goToStep2,
  fillContact,
  goToStep3,
  pickFirstAvailableTable
} = require('./helpers/reservation-flow');

test('kompletni booking flow se zobrazenim v adminu', async ({ page }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const guestName = 'E2E Full ' + stamp;
  const guestPhone = '+420 777 ' + String(stamp).slice(-6);
  const guestEmail = 'e2e+' + stamp + '@barx.cz';

  await openReservation(page);

  const date = new Date();
  date.setDate(date.getDate() + ((stamp % 120) + 14));
  const tomorrowIso = date.toISOString().split('T')[0];

  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  await fillContact(page, { name: guestName, phone: guestPhone, email: guestEmail });
  await goToStep3(page);

  await page.selectOption('#guestCount', '3');
  await page.selectOption('#reservationDrink', 'MonstRum');
  await pickFirstAvailableTable(page);

  await page.locator('#plannedVibe').evaluate((el) => {
    el.value = '9';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.fill('#reservationNote', 'E2E test rezervace');
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click();

  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla uložená');

  await page.goto('/admin.html');
  await page.click('[data-view="table"]');
  await page.fill('#searchInput', guestName);

  const row = page.locator('#reservationRows tr').first();
  await expect(row).toContainText(guestName);
  await expect(row).toContainText('nova');

  await row.getByRole('button', { name: 'Smazat' }).click();
  await expect(page.locator('#status')).toContainText('Rezervace byla smazána.');
});
