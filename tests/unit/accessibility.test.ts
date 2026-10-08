import { describe, expect, it } from 'vitest';

/**
 * Test per la calibrazione del tuning e l'accessibilità cromatica (Fase 6, Task 6.2).
 *
 * Verifica:
 * - MIN_OVERLAP_RATIO è calibrato correttamente (RF-19)
 * - Contrasto WCAG AA ≥ 4.5:1 per testo su sfondo (RF-47)
 * - Distinguibilità delle palette sotto simulazione daltonismo
 */

import { tuning } from '../../src/tuning';

// ── Utilità per il calcolo del contrasto WCAG ──────────────────────────────

/** Converte un colore hex (#RRGGBB) in componenti RGB [0-255]. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Converte un componente sRGB [0-255] in lineare [0-1]. */
function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Calcola la luminanza relativa di un colore hex (WCAG 2.x). */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Calcola il rapporto di contrasto WCAG tra due colori hex. */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Converte RGB a hex. */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (c: number) => Math.max(0, Math.min(255, Math.round(c)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// ── Colori del tema (da theme.css) ─────────────────────────────────────────

const ACCENT = '#8cd600';
const ACCENT_STRONG = '#5ba300';
const MAP_BG = '#fdfcf8';
const TRAY_BG = '#f4f7ee';
const TEXT_DARK = '#1f2933';
const TEXT_GRAY_700 = '#374151';
const TEXT_GRAY_500 = '#6b7280';
const DISABLED_GEO = '#c8ccc4';
const WHITE = '#ffffff';
const GRAY_900 = '#111827';
// ── Test tuning calibrazione ───────────────────────────────────────────────

describe('Fase 6 — Calibrazione tuning (RF-19)', () => {
  it('MIN_OVERLAP_RATIO è 0.55 (default da requisiti)', () => {
    expect(tuning.snap.MIN_OVERLAP_RATIO).toBe(0.55);
  });

  it('MIN_OVERLAP_RATIO è in range ragionevole [0.4, 0.7]', () => {
    expect(tuning.snap.MIN_OVERLAP_RATIO).toBeGreaterThanOrEqual(0.4);
    expect(tuning.snap.MIN_OVERLAP_RATIO).toBeLessThanOrEqual(0.7);
  });

  it('SNAP_RASTER_SIZE è potenza di 2 ≥ 64', () => {
    const size = tuning.snap.SNAP_RASTER_SIZE;
    expect(size).toBeGreaterThanOrEqual(64);
    expect(size & (size - 1)).toBe(0);
  });

  it('ATTEMPT_SCORES coerenti con RF-23', () => {
    const s = tuning.scoring.ATTEMPT_SCORES;
    expect(s[0]).toBe(100);
    expect(s[1]).toBe(50);
    expect(s[2]).toBe(25);
    expect(s[3]).toBe(0);
  });

  it('durate animazione in range UX', () => {
    expect(tuning.anim.PICKUP_MS).toBeGreaterThanOrEqual(100);
    expect(tuning.anim.PICKUP_MS).toBeLessThanOrEqual(300);
    expect(tuning.anim.SNAP_MS).toBeGreaterThanOrEqual(200);
    expect(tuning.anim.SNAP_MS).toBeLessThanOrEqual(500);
    expect(tuning.anim.RETURN_MS).toBeGreaterThanOrEqual(200);
    expect(tuning.anim.RETURN_MS).toBeLessThanOrEqual(500);
  });
  // ── Test contrasto WCAG AA (RF-47) ─────────────────────────────────────────

  describe('Fase 6 — Contrasto WCAG AA (RF-47)', () => {
    it('testo scuro su sfondo mappa ≥ 4.5:1', () => {
      expect(contrastRatio(TEXT_DARK, MAP_BG)).toBeGreaterThanOrEqual(4.5);
    });

    it('testo scuro su sfondo vassoio ≥ 4.5:1', () => {
      expect(contrastRatio(TEXT_DARK, TRAY_BG)).toBeGreaterThanOrEqual(4.5);
    });

    it('gray-700 su bianco ≥ 4.5:1 (etichette vassoio)', () => {
      expect(contrastRatio(TEXT_GRAY_700, WHITE)).toBeGreaterThanOrEqual(4.5);
    });

    it('gray-900 su accent lime ≥ 4.5:1 (pulsante Gioca ancora)', () => {
      expect(contrastRatio(GRAY_900, ACCENT)).toBeGreaterThanOrEqual(4.5);
    });

    it('accent-strong su mappa ≥ 3:1 (nazioni posizionate)', () => {
      expect(contrastRatio(ACCENT_STRONG, MAP_BG)).toBeGreaterThanOrEqual(3.0);
    });

    it('gray-500 su bianco ≥ 3:1 (testo secondario)', () => {
      expect(contrastRatio(TEXT_GRAY_500, WHITE)).toBeGreaterThanOrEqual(3.0);
    });

    it('disabled-geo su mappa distinguibile', () => {
      expect(contrastRatio(DISABLED_GEO, MAP_BG)).toBeGreaterThanOrEqual(1.2);
    });

    it('accent vs accent-strong distinguibili', () => {
      expect(contrastRatio(ACCENT, ACCENT_STRONG)).toBeGreaterThanOrEqual(1.1);
    });
  });

  // ── Test simulazione daltonismo ─────────────────────────────────────────────

  describe('Fase 6 — Daltonismo: distinguibilità palette', () => {
    function simDeuteranopia(r: number, g: number, b: number): [number, number, number] {
      return [0.625 * r + 0.375 * g, 0.7 * r + 0.3 * g, 0.3 * g + 0.7 * b];
    }

    function simProtanopia(r: number, g: number, b: number): [number, number, number] {
      return [0.567 * r + 0.433 * g, 0.558 * r + 0.442 * g, 0.242 * g + 0.758 * b];
    }

    function sim(hex: string, type: 'deuter' | 'protan'): string {
      const [r, g, b] = hexToRgb(hex);
      const [sr, sg, sb] = type === 'deuter' ? simDeuteranopia(r, g, b) : simProtanopia(r, g, b);
      return rgbToHex(sr, sg, sb);
    }

    it('accent vs accent-strong distinguibili sotto deuteranopia', () => {
      const ratio = contrastRatio(sim(ACCENT, 'deuter'), sim(ACCENT_STRONG, 'deuter'));
      expect(ratio).toBeGreaterThan(1.0);
    });

    it('accent vs accent-strong distinguibili sotto protanopia', () => {
      const ratio = contrastRatio(sim(ACCENT, 'protan'), sim(ACCENT_STRONG, 'protan'));
      expect(ratio).toBeGreaterThan(1.0);
    });

    it('testo su lime leggibile sotto deuteranopia (≥ 3:1)', () => {
      expect(contrastRatio(GRAY_900, sim(ACCENT, 'deuter'))).toBeGreaterThanOrEqual(3.0);
    });

    it('testo su lime leggibile sotto protanopia (≥ 3:1)', () => {
      expect(contrastRatio(GRAY_900, sim(ACCENT, 'protan'))).toBeGreaterThanOrEqual(3.0);
    });

    it('posizionate vs mappa distinguibili sotto deuteranopia', () => {
      expect(contrastRatio(sim(ACCENT_STRONG, 'deuter'), MAP_BG)).toBeGreaterThanOrEqual(2.0);
    });

    it('posizionate vs mappa distinguibili sotto protanopia', () => {
      expect(contrastRatio(sim(ACCENT_STRONG, 'protan'), MAP_BG)).toBeGreaterThanOrEqual(2.0);
    });

    it('territori disabilitati vs mappa sotto deuteranopia', () => {
      expect(contrastRatio(sim(DISABLED_GEO, 'deuter'), MAP_BG)).toBeGreaterThanOrEqual(1.1);
    });

    it('territori disabilitati vs mappa sotto protanopia', () => {
      expect(contrastRatio(sim(DISABLED_GEO, 'protan'), MAP_BG)).toBeGreaterThanOrEqual(1.1);
    });
  });
});
