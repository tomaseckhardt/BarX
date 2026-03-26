const { test, expect } = require('@playwright/test');

test('admin quick actions meni stav rezervace', async ({ page }) => {
  test.setTimeout(90_000);

  const stamp = Date.now();
  const guestName = 'E2E Actions ' + stamp;
  const guestPhone = '+420 777 ' + String(stamp).slice(-6);
  const guestEmail = 'e2e-actions+' + stamp + '@barx.cz';

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

  await page.fill('#reservationNote', 'E2E admin actions');
  await page.getByRole('button', { name: 'Potvrdit rezervaci' }).click();
  await expect(page.locator('#reservationStatus')).toContainText('Rezervace byla uložená');

  await page.goto('/admin.html');
  await page.fill('#searchInput', guestName);

  const row = () => page.locator('#reservationRows tr', { hasText: guestName }).first();

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
