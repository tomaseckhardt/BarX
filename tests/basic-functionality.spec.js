const { test, expect } = require('@playwright/test');

const STEP_DELAY_MS = Number(process.env.E2E_STEP_DELAY_MS || 900);

async function pause(page) {
  if (STEP_DELAY_MS > 0) {
    await page.waitForTimeout(STEP_DELAY_MS);
  }
}

test('zakladni funkcnost bez potvrzeni rezervace', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('/');
  await pause(page);

  await expect(page.getByRole('heading', { name: 'BarX', level: 1 })).toBeVisible();
  await pause(page);

  await page.getByRole('button', { name: 'Shoty' }).click();
  await pause(page);
  await expect(page.locator('.drink-card:has-text("Crimson Storm")')).toBeVisible();
  await expect(page.locator('.drink-card:has-text("MonstRum")')).toBeHidden();
  await pause(page);

  await page.goto('/#reservation');
  await pause(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  await page.locator('#reservationDate').fill(tomorrowIso);
  await page.locator('#reservationDate').dispatchEvent('change');
  await pause(page);
  await page.selectOption('#guestCount', '3');
  await pause(page);

  const slotCount = await page.locator('#slotGrid .slot-btn').count();
  expect(slotCount).toBeGreaterThan(0);

  const firstAvailableSlot = page.locator('#slotGrid .slot-btn:not(.is-disabled)').first();
  await firstAvailableSlot.click();
  await pause(page);

  const firstAvailableTable = page.locator('#tableGrid .table-option:not(.is-disabled)').first();
  await firstAvailableTable.click();
  await pause(page);

  await page.locator('#plannedVibe').evaluate((el) => {
    el.value = '9';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pause(page);

  await expect(page.locator('#vibeWarning')).toBeVisible();
  await expect(page.locator('#summaryDate')).not.toHaveText('Vyber datum');
  await expect(page.locator('#summaryTime')).not.toHaveText('Vyber čas');
  await expect(page.locator('#summaryTable')).not.toHaveText('Vyber místo');
  await expect(page.locator('#summaryGuests')).toContainText('3');
  await expect(page.locator('#summaryVibe')).toHaveText('9/10');
  await pause(page);

  await page.goto('/admin.html');
  await pause(page);
  await expect(page.getByRole('heading', { name: 'BarX Admin' })).toBeVisible();
  await pause(page);

  await page.getByRole('button', { name: 'Karty' }).click();
  await pause(page);
  await expect(page.locator('#cardsView')).toHaveClass(/is-active/);
});
