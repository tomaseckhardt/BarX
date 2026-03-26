const { test, expect } = require('@playwright/test');

test('kompletni booking flow se zobrazenim v adminu', async ({ page }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const guestName = 'E2E Full ' + stamp;
  const guestPhone = '+420 777 ' + String(stamp).slice(-6);
  const guestEmail = 'e2e+' + stamp + '@barx.cz';

  await page.goto('/#reservation');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  await page.fill('#guestName', guestName);
  await page.fill('#guestPhone', guestPhone);
  await page.fill('#guestEmail', guestEmail);
  await page.selectOption('#guestCount', '3');
  await page.selectOption('#reservationDrink', 'MonstRum');
  await page.fill('#reservationDate', tomorrowIso);
  await page.dispatchEvent('#reservationDate', 'change');

  const firstAvailableSlot = page.locator('#slotGrid .slot-btn:not(.is-disabled)').first();
  await expect(firstAvailableSlot).toBeVisible();
  await firstAvailableSlot.click();

  const firstAvailableTable = page.locator('#tableGrid .table-option:not(.is-disabled)').first();
  await expect(firstAvailableTable).toBeVisible();
  await firstAvailableTable.click();

  await page.locator('#plannedVibe').evaluate((el) => {
    el.value = '9';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.fill('#reservationNote', 'E2E test rezervace');
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click();

  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla uložená');

  await page.goto('/admin.html');
  await page.fill('#searchInput', guestName);

  const row = page.locator('#reservationRows tr').first();
  await expect(row).toContainText(guestName);
  await expect(row).toContainText('nova');

  await row.getByRole('button', { name: 'Smazat' }).click();
  await expect(page.locator('#status')).toContainText('Rezervace byla smazána.');
});
