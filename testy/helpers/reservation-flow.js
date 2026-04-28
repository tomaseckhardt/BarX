const { expect } = require('@playwright/test');

async function openReservation(page) {
  await page.goto('/#reservation');
  await expect(page.locator('#reservationForm')).toBeVisible();
}

async function pickDateAndSlot(page, dateIso) {
  await page.locator('#reservationDate').fill(dateIso);
  await page.locator('#reservationDate').dispatchEvent('change');
  const firstAvailableSlot = page.locator('#slotGrid .slot-btn:not(.is-disabled)').first();
  await expect(firstAvailableSlot).toBeVisible({ timeout: 15_000 });
  await firstAvailableSlot.click();
}

async function goToStep2(page) {
  await page.locator('.form-step.active .next-step[data-next="2"]').click();
  await expect(page.locator('.form-step[data-step="2"]')).toHaveClass(/active/);
}

async function fillContact(page, { name, phone, email }) {
  await page.fill('#guestName', name);
  await page.fill('#guestPhone', phone);
  await page.fill('#guestEmail', email);
}

async function goToStep3(page) {
  const nextButton = page.locator('.form-step.active .next-step[data-next="3"]');
  await expect(nextButton).toBeVisible({ timeout: 10_000 });
  await nextButton.evaluate(btn => btn.click());
  await expect(page.locator('.form-step[data-step="3"]')).toHaveClass(/active/, { timeout: 10_000 });
}

async function pickFirstAvailableTable(page) {
  const firstAvailableTable = page.locator('#tableMap .map-table:not(.is-disabled)').first();
  await expect(firstAvailableTable).toBeVisible({ timeout: 15_000 });
  await firstAvailableTable.click();
}

async function setPlannedVibe(page, value) {
  const normalized = String(Math.max(1, Number(value || 1)));
  await page.locator('#plannedVibe').evaluate((el, vibe) => {
    el.value = vibe;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, normalized);
}

async function dismissBlockingOverlays(page) {
  const gdprAccept = page.locator('#gdprAccept');
  if (await gdprAccept.count()) {
    try {
      if (await gdprAccept.isVisible()) await gdprAccept.click();
    } catch {
      // ignore when banner is not active
    }
  }

  const qrClose = page.locator('.qr-modal-close');
  if (await qrClose.count()) {
    try {
      if (await qrClose.isVisible()) await qrClose.click();
    } catch {
      // ignore when modal is closed
    }
  }
}

module.exports = {
  openReservation,
  pickDateAndSlot,
  goToStep2,
  fillContact,
  goToStep3,
  pickFirstAvailableTable,
  setPlannedVibe,
  dismissBlockingOverlays
};
