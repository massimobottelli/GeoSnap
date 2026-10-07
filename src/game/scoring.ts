/**
 * GeoSnap — sistema di punteggio (Fase 2, Task 2.2).
 *
 * Calcola i punti per ogni piazzamento in base ai tentativi falliti
 * precedenti, il punteggio massimo teorico e la precisione.
 *
 * La scala punti non è hardcoded: legge da `tuning.ts` (§10).
 *
 * Riferimento: §8.2, RF-23, RF-31 dei Requisiti Tecnici MVP1.
 */

import { tuning } from '../tuning';
import type { NationState } from './types';

const { ATTEMPT_SCORES } = tuning.scoring;

/**
 * Restituisce i punti assegnati per un piazzamento riuscito,
 * dato il numero di tentativi falliti precedenti su quella nazione.
 *
 * - 0 fallimenti → 100 punti (1° tentativo)
 * - 1 fallimento → 50 punti (2° tentativo)
 * - 2 fallimenti → 25 punti (3° tentativo)
 * - ≥3 fallimenti → 0 punti (4°+ tentativo)
 *
 * @param failedAttempts - Numero di rilasci falliti precedenti (RF-23).
 * @returns Punti assegnati.
 */
export function scoreForAttempt(failedAttempts: number): number {
  const index = Math.min(failedAttempts, ATTEMPT_SCORES.length - 1);
  const score = ATTEMPT_SCORES[index];
  return score ?? 0;
}

/**
 * Calcola il punteggio massimo teorico per un dato numero di nazioni.
 * (Ogni nazione posizionata al 1° tentativo = 100 punti.)
 *
 * Usato nella schermata di riepilogo (RF-31: "2.150 / 3.600").
 *
 * @param nationCount - Numero totale di nazioni giocabili.
 * @returns Punteggio massimo ottenibile.
 */
export function maxScore(nationCount: number): number {
  return nationCount * scoreForAttempt(0);
}

/**
 * Calcola la precisione: quota di nazioni posizionate al primo tentativo.
 *
 * @param placed - Record delle nazioni posizionate con il loro stato.
 * @returns Precisione come valore in [0, 1]. Se nessuna nazione è
 *          posizionata, restituisce 0.
 */
export function precision(placed: Readonly<Record<string, NationState>>): number {
  const entries = Object.values(placed);
  const placedEntries = entries.filter((s) => s.placed);
  if (placedEntries.length === 0) return 0;
  const firstTry = placedEntries.filter((s) => s.attempts === 1).length;
  return firstTry / placedEntries.length;
}
