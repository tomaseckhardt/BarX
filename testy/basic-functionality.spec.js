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

test('zakladni funkcnost bez potvrzeni rezervace', async ({ page, request }) => {
  test.setTimeout(90_000);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'BarX', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Shoty' }).click();
  await expect(page.locator('.drink-card:has-text("Crimson Storm")')).toBeVisible();
  await expect(page.locator('.drink-card:has-text("MonstRum")')).toBeHidden();

  await openReservation(page);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = toLocalIso(tomorrow);

  await pickDateAndSlot(page, tomorrowIso);
  await goToStep2(page);
  const user = await getTestUser(request, { tag: 'Basic Flow' });
  await fillContact(page, {
    name: user.name,
    phone: user.phone,
    email: user.email
  });
  await goToStep3(page);

  await page.selectOption('#guestCount', '3');
  await pickFirstAvailableTable(page);

  await page.locator('#plannedVibe').evaluate((el) => {
    el.value = '9';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect(page.locator('#vibeDiscountBadge')).toContainText('SPLNĚNO');
  await expect(page.locator('#summaryDate')).not.toHaveText('Vyber datum');
  await expect(page.locator('#summaryTime')).not.toHaveText('Vyber čas');
  await expect(page.locator('#summaryTable')).not.toHaveText('Vyber místo');
  await expect(page.locator('#summaryGuests')).toContainText('3');
  await expect(page.locator('#summaryVibe')).toHaveText('9/10');

  await page.goto('/admin.html');
  await expect(page.getByRole('heading', { name: 'BarX Admin' })).toBeVisible();

  await page.getByRole('button', { name: 'Karty' }).click();
  await expect(page.locator('#cardsView')).toHaveClass(/is-active/);
});

test('drink modal je ovladatelny klavesnici i mysi', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('/');

  const monStrumCard = page.locator('.drink-card:has-text("MonstRum")').first();
  await expect(monStrumCard).toBeVisible();

  await monStrumCard.click();

  const modal = page.locator('#drinkModal');
  await expect(modal).toHaveClass(/is-open/);
  await expect(page.locator('#drinkModalTitle')).toHaveText('MonstRum');
  await expect(page.locator('#drinkModalPrice')).toContainText('Kč');
  await expect(page.locator('#drinkModalStrength')).toContainText('/5');

  await page.keyboard.press('Escape');
  await expect(modal).not.toHaveClass(/is-open/);

  await monStrumCard.focus();
  await page.keyboard.press('Enter');
  await expect(modal).toHaveClass(/is-open/);

  await page.locator('.drink-modal-backdrop').evaluate(el => el.click());
  await expect(modal).not.toHaveClass(/is-open/);

  await monStrumCard.focus();
  await page.keyboard.press('Space');
  await expect(modal).toHaveClass(/is-open/);

  await page.locator('#drinkModalClose').click();
  await expect(modal).not.toHaveClass(/is-open/);
});
