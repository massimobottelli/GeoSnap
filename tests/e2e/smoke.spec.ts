import { expect, test } from '@playwright/test';

/**
 * Smoke test E2E (Fase 0, Task 0.2).
 *
 * Verifica che l'applicazione si avvii correttamente in un contesto mobile con
 * emulazione touch. La copertura dei flussi di gioco (drag, snap, riepilogo)
 * appartiene alla Fase 6.
 */
test.describe('GeoSnap — avvio applicazione', () => {
  test('la shell di gioco viene visualizzata', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/GeoSnap/i);
    await expect(page.getByRole('heading', { name: 'GeoSnap' })).toBeVisible();
  });

  test('il contesto emula un dispositivo touch', async ({ page }) => {
    await page.goto('/');

    const supportsTouch = await page.evaluate(
      () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    );

    expect(supportsTouch).toBe(true);
  });
});
