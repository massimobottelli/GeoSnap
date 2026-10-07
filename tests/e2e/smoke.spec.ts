import { expect, test } from '@playwright/test';

/**
 * Smoke test E2E (aggiornato per Fase 4).
 *
 * Verifica che l'applicazione si avvii correttamente in un contesto mobile con
 * emulazione touch e che gli elementi principali del gioco siano visibili.
 */
test.describe('GeoSnap — avvio applicazione', () => {
  test('la mappa e il vassoio vengono visualizzati', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/GeoSnap/i);
    // La mappa SVG è visibile
    await expect(page.locator('svg').first()).toBeVisible();
    // Il vassoio è visibile (contiene nazioni)
    await expect(page.locator('[data-nation-id]').first()).toBeVisible();
  });

  test('il contesto emula un dispositivo touch', async ({ page }) => {
    await page.goto('/');

    const supportsTouch = await page.evaluate(
      () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    );

    expect(supportsTouch).toBe(true);
  });
});
