import { describe, expect, it } from 'vitest';

import { scoreForAttempt, maxScore, precision } from '../../src/game/scoring';
import type { NationState } from '../../src/game/types';

/**
 * Test per `scoring.ts` — sistema di punteggio (Fase 2, Task 2.2).
 *
 * Verifica:
 * - Scala punti 100/50/25/0 per 1°/2°/3°/4°+ tentativo (RF-23)
 * - Punteggio massimo teorico
 * - Precisione (primo tentativo)
 */

describe('scoring.ts — punteggio (Fase 2, Task 2.2)', () => {
  // ── scoreForAttempt (RF-23) ─────────────────────────────────────────────

  describe('scoreForAttempt', () => {
    it('restituisce 100 per 0 fallimenti (1° tentativo)', () => {
      expect(scoreForAttempt(0)).toBe(100);
    });

    it('restituisce 50 per 1 fallimento (2° tentativo)', () => {
      expect(scoreForAttempt(1)).toBe(50);
    });

    it('restituisce 25 per 2 fallimenti (3° tentativo)', () => {
      expect(scoreForAttempt(2)).toBe(25);
    });

    it('restituisce 0 per 3+ fallimenti (4°+ tentativo)', () => {
      expect(scoreForAttempt(3)).toBe(0);
      expect(scoreForAttempt(4)).toBe(0);
      expect(scoreForAttempt(10)).toBe(0);
      expect(scoreForAttempt(100)).toBe(0);
    });
  });

  // ── maxScore ────────────────────────────────────────────────────────────

  describe('maxScore', () => {
    it('restituisce nationCount × 100', () => {
      expect(maxScore(36)).toBe(3600);
      expect(maxScore(1)).toBe(100);
      expect(maxScore(0)).toBe(0);
    });

    it('il punteggio massimo per 36 nazioni è coerente con RF-31', () => {
      // RF-31 menziona "2.150 / 4.400" come esempio, ma con 36 nazioni
      // il massimo è 3.600. Il valore dipende dal numero effettivo di nazioni.
      expect(maxScore(36)).toBe(3600);
    });
  });

  // ── precision ───────────────────────────────────────────────────────────

  describe('precision', () => {
    it('restituisce 0 se nessuna nazione è posizionata', () => {
      expect(precision({})).toBe(0);
    });

    it('restituisce 1.0 se tutte le nazioni sono posizionate al primo tentativo', () => {
      const placed: Record<string, NationState> = {
        ITA: { attempts: 1, placed: true },
        FRA: { attempts: 1, placed: true },
        DEU: { attempts: 1, placed: true },
      };
      expect(precision(placed)).toBe(1.0);
    });

    it('restituisce 0.0 se nessuna nazione è posizionata al primo tentativo', () => {
      const placed: Record<string, NationState> = {
        ITA: { attempts: 2, placed: true },
        FRA: { attempts: 3, placed: true },
      };
      expect(precision(placed)).toBe(0.0);
    });

    it('calcola correttamente la precisione parziale', () => {
      const placed: Record<string, NationState> = {
        ITA: { attempts: 1, placed: true }, // 1° tentativo
        FRA: { attempts: 2, placed: true }, // 2° tentativo
        DEU: { attempts: 1, placed: true }, // 1° tentativo
        ESP: { attempts: 3, placed: true }, // 3° tentativo
      };
      // 2 su 4 al primo tentativo = 0.5
      expect(precision(placed)).toBe(0.5);
    });

    it('ignora le nazioni non posizionate', () => {
      const placed: Record<string, NationState> = {
        ITA: { attempts: 1, placed: true },
        FRA: { attempts: 0, placed: false }, // non posizionata, attempts=0
      };
      // Solo 1 nazione posizionata, al primo tentativo → precisione = 1.0
      expect(precision(placed)).toBe(1.0);
    });
  });
});