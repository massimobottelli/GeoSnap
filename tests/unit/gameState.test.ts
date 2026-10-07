import { describe, expect, it } from 'vitest';

import { startGame, registerFail, registerPlace } from '../../src/game/gameState';
import type { RandomFn } from '../../src/game/shuffle';
import type { GameState, NationId, NationState } from '../../src/game/types';

/**
 * Test per `gameState.ts` — reducer di gioco (Fase 2, Task 2.3).
 *
 * Verifica: startGame, registerPlace, registerFail, partita completabile (RF-24),
 * fine partita all'ultimo place (RF-03.4).
 */

function seededRng(seed: number): RandomFn {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Accede in modo sicuro allo stato di una nazione. */
function nationOf(state: GameState, id: NationId): NationState {
  const ns = state.placed[id];
  if (ns === undefined) throw new Error(`nation ${id} not found`);
  return ns;
}

const NATION_IDS: NationId[] = ['ITA', 'FRA', 'DEU'];
const NOW = 1700000000000;

describe('gameState.ts — reducer di gioco (Fase 2, Task 2.3)', () => {
  // ── startGame ───────────────────────────────────────────────────────────

  describe('startGame', () => {
    it('crea uno stato con tutti i campi inizializzati', () => {
      const state = startGame(NATION_IDS, seededRng(42), NOW);
      expect(state.trayOrder).toHaveLength(3);
      expect(state.score).toBe(0);
      expect(state.startedAt).toBe(NOW);
      expect(state.finishedAt).toBeNull();
      expect(state.remaining).toBe(3);
    });

    it('ha tutte le nazioni in placed con attempts=0 e placed=false', () => {
      const state = startGame(NATION_IDS, seededRng(42), NOW);
      for (const id of NATION_IDS) {
        const ns = state.placed[id];
        if (ns === undefined) throw new Error(`missing ${id}`);
        expect(ns.attempts).toBe(0);
        expect(ns.placed).toBe(false);
      }
    });

    it('contiene tutti gli ID nell\'ordine del vassoio', () => {
      const state = startGame(NATION_IDS, seededRng(42), NOW);
      expect([...state.trayOrder].sort()).toEqual([...NATION_IDS].sort());
    });

    it('con RNG seeded, l\'ordine è deterministico', () => {
      const s1 = startGame(NATION_IDS, seededRng(42), NOW);
      const s2 = startGame(NATION_IDS, seededRng(42), NOW);
      expect(s1.trayOrder).toEqual(s2.trayOrder);
    });

    it('remaining è uguale al numero di nazioni', () => {
      const state = startGame(NATION_IDS, seededRng(42), NOW);
      expect(state.remaining).toBe(NATION_IDS.length);
    });
  });

  // ── registerPlace ───────────────────────────────────────────────────────

  describe('registerPlace', () => {
    it('marca la nazione come posizionata', () => {
      const state = startGame(NATION_IDS, seededRng(42), NOW);
      const ns = registerPlace(state, 'ITA', NOW + 1000);
      expect(nationOf(ns, 'ITA').placed).toBe(true);
      expect(nationOf(ns, 'ITA').attempts).toBe(1);
    });

    it('assegna 100 punti al primo tentativo (0 fallimenti)', () => {
      const state = startGame(NATION_IDS, seededRng(42), NOW);
      expect(registerPlace(state, 'ITA', NOW + 1000).score).toBe(100);
    });

    it('assegna 50 punti al secondo tentativo (1 fallimento)', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      s = registerFail(s, 'ITA');
      expect(registerPlace(s, 'ITA', NOW + 1000).score).toBe(50);
    });

    it('assegna 25 punti al terzo tentativo (2 fallimenti)', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      s = registerFail(s, 'ITA');
      s = registerFail(s, 'ITA');
      expect(registerPlace(s, 'ITA', NOW + 1000).score).toBe(25);
    });

    it('assegna 0 punti dal quarto tentativo in poi', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      for (let i = 0; i < 3; i++) s = registerFail(s, 'ITA');
      expect(registerPlace(s, 'ITA', NOW + 1000).score).toBe(0);
    });

    it('diminuisce remaining di 1', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      expect(registerPlace(s, 'ITA', NOW + 1000).remaining).toBe(2);
    });

    it('non modifica le altre nazioni', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      const ns = registerPlace(s, 'ITA', NOW + 1000);
      expect(nationOf(ns, 'FRA').placed).toBe(false);
      expect(nationOf(ns, 'DEU').attempts).toBe(0);
    });

    it('imposta finishedAt quando remaining raggiunge 0', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      const t = NOW + 60000;
      s = registerPlace(s, 'ITA', t - 2000);
      expect(s.finishedAt).toBeNull();
      s = registerPlace(s, 'FRA', t - 1000);
      expect(s.finishedAt).toBeNull();
      s = registerPlace(s, 'DEU', t);
      expect(s.finishedAt).toBe(t);
      expect(s.remaining).toBe(0);
    });

    it('ignora una nazione già posizionata', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      s = registerPlace(s, 'ITA', NOW + 1000);
      const dup = registerPlace(s, 'ITA', NOW + 2000);
      expect(dup.score).toBe(s.score);
      expect(dup.remaining).toBe(s.remaining);
    });

    it('ignora una nazione non presente nello stato', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      expect(registerPlace(s, 'XYZ', NOW + 1000).remaining).toBe(3);
    });
  });

  // ── registerFail ────────────────────────────────────────────────────────

  describe('registerFail', () => {
    it('incrementa il contatore attempts', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      expect(nationOf(registerFail(s, 'ITA'), 'ITA').attempts).toBe(1);
    });

    it('non modifica punteggio o remaining', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      const ns = registerFail(s, 'ITA');
      expect(ns.score).toBe(0);
      expect(ns.remaining).toBe(3);
    });

    it('non marca la nazione come posizionata', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      expect(nationOf(registerFail(s, 'ITA'), 'ITA').placed).toBe(false);
    });

    it('può essere chiamato più volte sulla stessa nazione', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      for (let i = 0; i < 3; i++) s = registerFail(s, 'ITA');
      expect(nationOf(s, 'ITA').attempts).toBe(3);
      expect(s.score).toBe(0);
    });

    it('non modifica le altre nazioni', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      const ns = registerFail(s, 'ITA');
      expect(nationOf(ns, 'FRA').attempts).toBe(0);
    });

    it('ignora una nazione già posizionata', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      s = registerPlace(s, 'ITA', NOW + 1000);
      const a = nationOf(s, 'ITA').attempts;
      expect(nationOf(registerFail(s, 'ITA'), 'ITA').attempts).toBe(a);
    });

    it('ignora una nazione non presente nello stato', () => {
      const s = startGame(NATION_IDS, seededRng(42), NOW);
      expect(registerFail(s, 'XYZ')).toBe(s);
    });
  });

  // ── Partita sempre completabile (RF-24) ─────────────────────────────────

  describe('partita sempre completabile (RF-24)', () => {
    it('posizionamento possibile dopo infiniti fallimenti', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      for (let i = 0; i < 100; i++) s = registerFail(s, 'ITA');
      s = registerPlace(s, 'ITA', NOW + 1000);
      expect(nationOf(s, 'ITA').placed).toBe(true);
      expect(s.score).toBe(0); // 4°+ tentativo = 0
    });

    it('partita termina correttamente dopo molti fallimenti', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      for (const id of NATION_IDS) {
        for (let i = 0; i < 5; i++) s = registerFail(s, id);
      }
      for (const id of NATION_IDS) s = registerPlace(s, id, NOW + 1000);
      expect(s.remaining).toBe(0);
      expect(s.finishedAt).toBe(NOW + 1000);
      expect(s.score).toBe(0);
    });
  });

  // ── Flusso completo ─────────────────────────────────────────────────────

  describe('flusso completo di partita', () => {
    it('mix di successi e fallimenti produce punteggio corretto', () => {
      let s = startGame(NATION_IDS, seededRng(42), NOW);
      // ITA: 1° tentativo → 100
      s = registerPlace(s, 'ITA', NOW + 1000);
      expect(s.score).toBe(100);
      // FRA: 1 fallimento + 1 place → 50
      s = registerFail(s, 'FRA');
      s = registerPlace(s, 'FRA', NOW + 2000);
      expect(s.score).toBe(150);
      // DEU: 2 fallimenti + 1 place → 25
      s = registerFail(s, 'DEU');
      s = registerFail(s, 'DEU');
      s = registerPlace(s, 'DEU', NOW + 3000);
      expect(s.score).toBe(175);
      expect(s.remaining).toBe(0);
      expect(s.finishedAt).toBe(NOW + 3000);
    });
  });
});