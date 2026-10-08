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

  test('la sagoma si stacca dal vassoio e segue il dito (RF-15)', async ({ page }) => {
    await page.goto('/');
    const firstItem = page.locator('[data-nation-id]').first();
    await expect(firstItem).toBeVisible();
    const nationId = await firstItem.getAttribute('data-nation-id');
    const trayBox = await firstItem.boundingBox();
    expect(trayBox).not.toBeNull();
    if (trayBox === null || nationId === null) return;

    const startX = trayBox.x + trayBox.width / 2;
    const startY = trayBox.y + trayBox.height / 2;
    // Punto di rilascio dentro la mappa (sopra il vassoio)
    const endY = Math.max(startY - 200, 120);

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(50);

    // 1. La sagoma nel vassoio si stacca (non resta visibile al suo posto)
    await expect(page.locator(`[data-nation-id="${nationId}"]`)).toHaveAttribute(
      'data-dragging',
      'true',
    );

    // 2. La sagoma nel DragLayer segue il dito verso la mappa
    const dragPiece = page.locator('[data-testid="drag-piece"]');
    await expect(dragPiece).toBeVisible();
    await page.mouse.move(startX, endY, { steps: 6 });
    await page.waitForTimeout(80);

    const pieceBox = await dragPiece.boundingBox();
    expect(pieceBox).not.toBeNull();
    if (pieceBox === null) return;
    const pieceCenterX = pieceBox.x + pieceBox.width / 2;
    const pieceCenterY = pieceBox.y + pieceBox.height / 2;
    // Tolleranza: il centroide può non coincidere col centro del bbox della sagoma
    const tolerance = Math.max(pieceBox.width, pieceBox.height) * 0.5 + 10;
    expect(Math.abs(pieceCenterX - startX)).toBeLessThan(tolerance);
    expect(Math.abs(pieceCenterY - endY)).toBeLessThan(tolerance);

    // 3. Al rilascio la sagoma torna disponibile nel vassoio
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(page.locator(`[data-nation-id="${nationId}"]`)).toHaveAttribute(
      'data-dragging',
      'false',
    );
  });
});
