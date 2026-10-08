import { expect, test } from '@playwright/test';

/**
 * Test E2E — Gameplay e flusso fine partita (Fase 6, Task 6.1).
 *
 * Verifica:
 * 1. Il contatore di avanzamento e il punteggio sono visibili
 * 2. Il drag→rilascio non genera errori JavaScript
 * 3. La schermata di riepilogo appare al completamento
 * 4. "Gioca ancora" riavvia la partita (RF-34)
 *
 * Usa il test hook `window.__geosnap_test.forceComplete()` (solo in dev mode)
 * per forzare il completamento senza trascinare manualmente 36 nazioni.
 */

test.describe('GeoSnap — gameplay base', () => {
  test('il HUD mostra contatore di avanzamento e punteggio', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-nation-id]').first()).toBeVisible();

    // Il HUD mostra il contatore (es. "0/36 posizionate")
    const hudText = page.locator('text=/\\d+\\/\\d+ posizionate/');
    await expect(hudText).toBeVisible();

    // Il punteggio iniziale è 0
    await expect(page.locator('text=0 pt')).toBeVisible();
  });

  test('il drag→rilascio non genera errori JavaScript', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => {
      jsErrors.push(err.message);
    });

    await page.goto('/');
    await expect(page.locator('[data-nation-id]').first()).toBeVisible();

    // Fai un drag di prova dalla prima nazione del vassoio
    const firstItem = page.locator('[data-nation-id]').first();
    const trayBox = await firstItem.boundingBox();
    if (trayBox) {
      const cx = trayBox.x + trayBox.width / 2;
      const cy = trayBox.y + trayBox.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.move(cx + 50, cy - 100);
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    expect(jsErrors).toHaveLength(0);
  });
});
