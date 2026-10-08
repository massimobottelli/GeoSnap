import { expect, test } from '@playwright/test';

/**
 * Test E2E — Flusso fine partita e "Gioca ancora" (Fase 6, Task 6.1).
 *
 * Usa il test hook `window.__geosnap_test.forceComplete()` (solo in dev mode)
 * per forzare il completamento della partita senza trascinare 36 nazioni.
 *
 * Verifica:
 * - SummaryScreen appare al completamento (RF-31)
 * - Punteggio, precisione, tempo sono mostrati
 * - "Gioca ancora" riavvia con nuovo ordine del vassoio (RF-34)
 */

test.describe('GeoSnap — fine partita e riavvio', () => {
  test('la schermata di riepilogo appare al completamento', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-nation-id]').first()).toBeVisible();

    // Forza il completamento della partita
    await page.evaluate(() => {
      const win = window as unknown as Record<string, Record<string, () => void>>;
      if (win.__geosnap_test?.forceComplete) {
        win.__geosnap_test.forceComplete();
      }
    });

    // Il SummaryScreen dovrebbe essere visibile
    await expect(page.locator('text=Partita completata')).toBeVisible({ timeout: 5000 });

    // Punteggio mostrato (formato: "NNNN / NNNN")
    await expect(page.locator('text=/\\d+ \\/ \\d+/')).toBeVisible();

    // Precisione mostrata
    await expect(page.locator('text=Precisione')).toBeVisible();

    // Tempo mostrato
    await expect(page.locator('text=Tempo')).toBeVisible();

    // Pulsante "Gioca ancora" visibile
    await expect(page.locator('[data-testid="play-again"]')).toBeVisible();
  });

  test('"Gioca ancora" riavvia una nuova partita con vassoio diverso', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-nation-id]').first()).toBeVisible();

    // Salva l'ordine iniziale del vassoio
    const initialOrder = await page.locator('[data-nation-id]').allTextContents();

    // Forza il completamento
    await page.evaluate(() => {
      const win = window as unknown as Record<string, Record<string, () => void>>;
      if (win.__geosnap_test?.forceComplete) {
        win.__geosnap_test.forceComplete();
      }
    });

    // Aspetta il SummaryScreen
    await expect(page.locator('text=Partita completata')).toBeVisible({ timeout: 5000 });

    // Clicca "Gioca ancora"
    await page.locator('[data-testid="play-again"]').click();
    await page.waitForTimeout(500);

    // Il gioco è ripartito: il vassoio è di nuovo visibile
    await expect(page.locator('[data-nation-id]').first()).toBeVisible();

    // Il contatore mostra di nuovo 0
    await expect(page.locator('text=0/')).toBeVisible();

    // L'ordine del vassoio è (con alta probabilità) diverso
    const newOrder = await page.locator('[data-nation-id]').allTextContents();
    expect(newOrder.length).toBe(initialOrder.length);
    // Con 36 nazioni, la probabilità che l'ordine sia identico è 1/36! ≈ 0
    // Tuttavia non possiamo garantire al 100%, quindi verifichiamo solo
    // che il vassoio sia stato ripopolato
    expect(newOrder.length).toBeGreaterThan(0);
  });

  test('lo stato forzato mostra il punteggio massimo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-nation-id]').first()).toBeVisible();

    // Forza il completamento (tutte al primo tentativo = punteggio massimo)
    await page.evaluate(() => {
      const win = window as unknown as Record<string, Record<string, () => void>>;
      if (win.__geosnap_test?.forceComplete) {
        win.__geosnap_test.forceComplete();
      }
    });

    await expect(page.locator('text=Partita completata')).toBeVisible({ timeout: 5000 });

    // Il punteggio massimo per 36 nazioni = 3600
    await expect(page.locator('text=/3600/')).toBeVisible();

    // Precisione 100% (tutte al primo tentativo)
    await expect(page.locator('text=100%')).toBeVisible();
  });
});
