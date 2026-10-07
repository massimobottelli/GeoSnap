import { describe, expect, it } from 'vitest';

import { shuffleNationIds, type RandomFn } from '../../src/game/shuffle';

/**
 * Test per `shuffle.ts` — mescolamento Fisher-Yates (Fase 2, Task 2.2).
 *
 * Verifica:
 * - Nessun elemento perso o duplicato
 * - Con RNG seeded, l'ordine è deterministico
 * - L'array originale non viene mutato
 * - Il risultato è diverso dall'input con alta probabilità
 */

/** RNG deterministico (seeded) per test riproducibili. */
function seededRng(seed: number): RandomFn {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const TEST_IDS = ['ITA', 'FRA', 'DEU', 'ESP', 'GBR', 'POL', 'ROU', 'NOR'];

describe('shuffle.ts — Fisher-Yates (Fase 2, Task 2.2)', () => {
  it('restituisce un array della stessa lunghezza', () => {
    const result = shuffleNationIds(TEST_IDS);
    expect(result).toHaveLength(TEST_IDS.length);
  });

  it('contiene tutti gli elementi originali (nessuna perdita)', () => {
    const result = shuffleNationIds(TEST_IDS);
    expect(result.sort()).toEqual([...TEST_IDS].sort());
  });

  it('non ha duplicati', () => {
    const result = shuffleNationIds(TEST_IDS);
    expect(new Set(result).size).toBe(result.length);
  });

  it('non muta l\'array originale', () => {
    const original = [...TEST_IDS];
    shuffleNationIds(TEST_IDS);
    expect(TEST_IDS).toEqual(original);
  });

  it('con RNG seeded, l\'ordine è deterministico', () => {
    const rng1 = seededRng(42);
    const rng2 = seededRng(42);
    const result1 = shuffleNationIds(TEST_IDS, rng1);
    const result2 = shuffleNationIds(TEST_IDS, rng2);
    expect(result1).toEqual(result2);
  });

  it('con seed diversi, l\'ordine è diverso', () => {
    const result1 = shuffleNationIds(TEST_IDS, seededRng(1));
    const result2 = shuffleNationIds(TEST_IDS, seededRng(999));
    // Con alta probabilità gli ordini sono diversi.
    // Non è garantito al 100%, ma con 8 elementi è estremamente improbabile.
    expect(result1).not.toEqual(result2);
  });

  it('funziona con un array vuoto', () => {
    const result = shuffleNationIds([]);
    expect(result).toEqual([]);
  });

  it('funziona con un singolo elemento', () => {
    const result = shuffleNationIds(['ITA']);
    expect(result).toEqual(['ITA']);
  });

  it('funziona con due elementi', () => {
    // Con un RNG che restituisce sempre 0.99, gli elementi vengono scambiati
    const alwaysHigh: RandomFn = () => 0.99;
    const result = shuffleNationIds(['A', 'B'], alwaysHigh);
    expect(result).toHaveLength(2);
    expect(result.sort()).toEqual(['A', 'B']);
  });
});