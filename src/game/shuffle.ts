/**
 * GeoSnap — mescolamento del vassoio (Fase 2, Task 2.2).
 *
 * Implementa l'algoritmo Fisher-Yates per il rimescolamento casuale
 * delle nazioni nel vassoio. Supporta un RNG iniettabile per
 * verifiche deterministiche nei test (RF-04).
 *
 * Riferimento: §8.4 dei Requisiti Tecnici MVP1.
 */

import type { NationId } from './types';

/** Funzione generatore di numeri casuali in [0, 1). */
export type RandomFn = () => number;

/**
 * Mescola un array di ID nazione usando Fisher-Yates.
 *
 * @param ids - Array di ID da mescolare (non viene mutato).
 * @param rng - Funzione RNG iniettabile (default: Math.random).
 * @returns Nuovo array con gli stessi ID in ordine casuale.
 */
export function shuffleNationIds(
  ids: readonly NationId[],
  rng: RandomFn = Math.random,
): NationId[] {
  const result = [...ids];
  // Fisher-Yates (Knuth shuffle)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const vi = result[i];
    const vj = result[j];
    if (vi !== undefined && vj !== undefined) {
      result[i] = vj;
      result[j] = vi;
    }
  }
  return result;
}