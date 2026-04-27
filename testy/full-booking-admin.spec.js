const { test, expect } = require('@playwright/test');
const {
  openReservation,
  pickDateAndSlot,
  goToStep2,
  fillContact,
  goToStep3,
  pickFirstAvailableTable
} = require('./helpers/reservation-flow');
const { getTestUser } = require('./helpers/random-user');

function toLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

test('kompletni booking flow se zobrazenim v adminu', async ({ page, request }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const user = await getTestUser(request, { tag: 'E2E Full', stamp });
  const guestName = user.name;
  const guestPhone = user.phone;
  const guestEmail = user.email;

  await openReservation(page);

  const date = new Date();
  date.setDate(date.getDate() + ((stamp % 120) + 14));
  const tomorrowIso = toLocalIso(date);

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

  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla poslána do baru + přidal jsem poznámku o 10% slevě (vibe 9+).');

  await page.goto('/admin.html');
  await page.click('[data-view="table"]');
  await page.fill('#searchInput', guestName);

  const row = page.locator('#reservationRows tr').first();
  await expect(row).toContainText(guestName);
  await expect(row).toContainText('nova');

  await row.getByRole('button', { name: 'Smazat' }).click();
  await expect(page.locator('#status')).toContainText('Rezervace byla smazána.');
});
