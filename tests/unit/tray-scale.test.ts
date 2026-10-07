/**
 * GeoSnap — test per la logica di scala del vassoio (Fase 4).
 *
 * Verifica che computeTrayScale produca valori corretti e coerenti
 * con i parametri di tuning (SCALE_MIN, SCALE_MAX, SCALE_CURVE).
 */

import { describe, it, expect } from 'vitest';
import { tuning } from '../../src/tuning';

const { SCALE_MIN, SCALE_MAX, SCALE_CURVE } = tuning.tray;

/**
 * Replica locale della funzione computeTrayScale (stessa logica di Tray.tsx).
 * Testata qui isolatamente per verificare la matematica senza DOM.
 */
function computeTrayScale(area: number, maxSqrtArea: number): number {
  if (maxSqrtArea <= 0) return SCALE_MIN;
  const ratio = Math.sqrt(area) / maxSqrtArea;
  return SCALE_MIN + Math.pow(ratio, SCALE_CURVE) * (SCALE_MAX - SCALE_MIN);
}

describe('computeTrayScale', () => {
  it('returns SCALE_MIN when area is 0', () => {
    expect(computeTrayScale(0, 100)).toBe(SCALE_MIN);
  });

  it('returns SCALE_MIN when maxSqrtArea is 0 (edge case)', () => {
    expect(computeTrayScale(100, 0)).toBe(SCALE_MIN);
  });

  it('returns SCALE_MIN when maxSqrtArea is negative (edge case)', () => {
    expect(computeTrayScale(100, -5)).toBe(SCALE_MIN);
  });

  it('returns approximately SCALE_MAX when area equals maxArea', () => {
    const maxArea = 10000;
    const maxSqrtArea = Math.sqrt(maxArea);
    const scale = computeTrayScale(maxArea, maxSqrtArea);
    expect(scale).toBeCloseTo(SCALE_MAX, 10);
  });

  it('returns a value between SCALE_MIN and SCALE_MAX for typical inputs', () => {
    const maxSqrtArea = Math.sqrt(15000);
    const scale = computeTrayScale(2000, maxSqrtArea);
    expect(scale).toBeGreaterThanOrEqual(SCALE_MIN);
    expect(scale).toBeLessThanOrEqual(SCALE_MAX);
  });

  it('produces monotonically increasing scales for increasing areas', () => {
    const maxSqrtArea = Math.sqrt(15000);
    const areas = [100, 500, 1000, 3000, 5000, 10000, 15000];
    const scales = areas.map((a) => computeTrayScale(a, maxSqrtArea));
    for (let i = 1; i < scales.length; i++) {
      const prev = scales[i - 1];
      const curr = scales[i];
      if (prev !== undefined && curr !== undefined) {
        expect(curr).toBeGreaterThan(prev);
      }
    }
  });

  it('uses SCALE_CURVE for exponential compression', () => {
    const maxSqrtArea = Math.sqrt(10000);
    // With ratio = 0.5 (area = 2500), scale = SCALE_MIN + 0.5^CURVE * RANGE
    const ratio = 0.5;
    const area = (ratio * maxSqrtArea) ** 2;
    const expected = SCALE_MIN + Math.pow(ratio, SCALE_CURVE) * (SCALE_MAX - SCALE_MIN);
    expect(computeTrayScale(area, maxSqrtArea)).toBeCloseTo(expected, 10);
  });

  it('never returns a value below SCALE_MIN', () => {
    const maxSqrtArea = Math.sqrt(15000);
    // Very small area
    expect(computeTrayScale(0.01, maxSqrtArea)).toBeGreaterThanOrEqual(SCALE_MIN);
  });

  it('may exceed SCALE_MAX for area > maxArea (unclamped)', () => {
    const maxSqrtArea = Math.sqrt(100);
    // Area larger than maxArea: ratio > 1, scale may exceed SCALE_MAX
    const scale = computeTrayScale(200, maxSqrtArea);
    // ratio = sqrt(200)/sqrt(100) ≈ 1.41, pow ≈ 1.41^0.6 ≈ 1.23, scale > SCALE_MAX
    // This is acceptable: in the game, no piece exceeds maxArea by definition.
    expect(scale).toBeGreaterThan(SCALE_MAX);
  });
});
