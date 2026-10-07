import { describe, expect, it } from 'vitest';

import { tuning } from '../../src/tuning';

/**
 * Test per `tuning.ts` — parametri di tuning centralizzati (Fase 2, Task 2.1).
 *
 * Verifica che tutti i parametri calibrabili siano presenti, correttamente
 * tipizzati e conformi ai requisiti tecnici §10.
 */
describe('tuning', () => {
  // ── Immutabilità ────────────────────────────────────────────────────────

  it('è immutabile (frozen)', () => {
    expect(Object.isFrozen(tuning)).toBe(true);
  });

  it('le sotto-oggetto sono immutabili', () => {
    expect(Object.isFrozen(tuning.snap)).toBe(true);
    expect(Object.isFrozen(tuning.scoring)).toBe(true);
    expect(Object.isFrozen(tuning.tray)).toBe(true);
    expect(Object.isFrozen(tuning.map)).toBe(true);
    expect(Object.isFrozen(tuning.anim)).toBe(true);
  });

  // ── Snap (§6, RF-19) ───────────────────────────────────────────────────

  it('snap.MIN_OVERLAP_RATIO è 0.55', () => {
    expect(tuning.snap.MIN_OVERLAP_RATIO).toBe(0.55);
  });

  it('snap.SNAP_RASTER_SIZE è 128', () => {
    expect(tuning.snap.SNAP_RASTER_SIZE).toBe(128);
  });

  // ── Scoring (§8.2, RF-23) ──────────────────────────────────────────────

  it('scoring.ATTEMPT_SCORES è [100, 50, 25, 0]', () => {
    expect(tuning.scoring.ATTEMPT_SCORES).toEqual([100, 50, 25, 0]);
  });

  it('scoring.ATTEMPT_SCORES ha 4 elementi', () => {
    expect(tuning.scoring.ATTEMPT_SCORES).toHaveLength(4);
  });

  // ── Tray (§5.2, RF-11) ─────────────────────────────────────────────────

  it('tray.MIN_HIT_SIZE_PX è 44', () => {
    expect(tuning.tray.MIN_HIT_SIZE_PX).toBe(44);
  });

  it('tray.SCALE_MIN è 0.35', () => {
    expect(tuning.tray.SCALE_MIN).toBe(0.35);
  });

  it('tray.SCALE_MAX è 1.0', () => {
    expect(tuning.tray.SCALE_MAX).toBe(1.0);
  });

  it('tray.SCALE_CURVE è 0.6', () => {
    expect(tuning.tray.SCALE_CURVE).toBe(0.6);
  });

  // ── Map (§5.1) ─────────────────────────────────────────────────────────

  it('map.ZOOM_MIN è 1.0', () => {
    expect(tuning.map.ZOOM_MIN).toBe(1.0);
  });

  it('map.ZOOM_MAX è 6.0', () => {
    expect(tuning.map.ZOOM_MAX).toBe(6.0);
  });

  it('map.LABEL_FONT_MIN è 8', () => {
    expect(tuning.map.LABEL_FONT_MIN).toBe(8);
  });

  it('map.LABEL_FONT_MAX è 20', () => {
    expect(tuning.map.LABEL_FONT_MAX).toBe(20);
  });

  // ── Anim (§9.4) ────────────────────────────────────────────────────────

  it('anim.PICKUP_MS è 150', () => {
    expect(tuning.anim.PICKUP_MS).toBe(150);
  });

  it('anim.SNAP_MS è 250', () => {
    expect(tuning.anim.SNAP_MS).toBe(250);
  });

  it('anim.RETURN_MS è 300', () => {
    expect(tuning.anim.RETURN_MS).toBe(300);
  });

  // ── Coerenza ────────────────────────────────────────────────────────────

  it('ATTEMPT_SCORES è strettamente decrescente (tranne lo zero finale)', () => {
    const scores = tuning.scoring.ATTEMPT_SCORES;
    for (let i = 0; i < scores.length - 1; i++) {
      const current = scores.at(i);
      const next = scores.at(i + 1);
      if (current !== undefined && next !== undefined) {
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it('SCALE_MIN < SCALE_MAX', () => {
    expect(tuning.tray.SCALE_MIN).toBeLessThan(tuning.tray.SCALE_MAX);
  });

  it('ZOOM_MIN < ZOOM_MAX', () => {
    expect(tuning.map.ZOOM_MIN).toBeLessThan(tuning.map.ZOOM_MAX);
  });

  it('LABEL_FONT_MIN < LABEL_FONT_MAX', () => {
    expect(tuning.map.LABEL_FONT_MIN).toBeLessThan(tuning.map.LABEL_FONT_MAX);
  });

  it('le durate animazioni sono positive', () => {
    expect(tuning.anim.PICKUP_MS).toBeGreaterThan(0);
    expect(tuning.anim.SNAP_MS).toBeGreaterThan(0);
    expect(tuning.anim.RETURN_MS).toBeGreaterThan(0);
  });
});
