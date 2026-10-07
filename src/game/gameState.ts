/**
 * GeoSnap — gestione dello stato di gioco (Fase 2, Task 2.3).
 *
 * Reducer puro per le azioni di gioco: avvio, piazzamento, fallimento.
 * Nessuna dipendenza da React o DOM.
 *
 * Riferimento: §8.3 dei Requisiti Tecnici MVP1.
 *
 * Regole fondamentali:
 * - Stato immutabile stile reducer (nessuna mutazione).
 * - La partita è sempre completabile: nessun game over, nessun limite
 *   ai tentativi, nessun malus assoluto (RF-24).
 * - startedAt viene registrato all'avvio; finishedAt all'ultimo place.
 *   Nessun timer attivo durante il gioco (RF-32).
 * - Il punteggio è l'unica conseguenza degli errori.
 */

import { shuffleNationIds, type RandomFn } from './shuffle';
import { scoreForAttempt } from './scoring';
import type { GameState, NationId, NationState } from './types';

/**
 * Crea lo stato iniziale di una nuova partita.
 *
 * Genera l'ordine casuale del vassoio e registra `startedAt`.
 *
 * @param nationIds - ID delle nazioni giocabili.
 * @param rng - RNG iniettabile (default: Math.random).
 * @param now - Timestamp epoch ms (default: Date.now()).
 * @returns Stato iniziale della partita.
 */
export function startGame(
  nationIds: readonly NationId[],
  rng: RandomFn = Math.random,
  now: number = Date.now(),
): GameState {
  const trayOrder = shuffleNationIds(nationIds, rng);
  const placed: Record<NationId, NationState> = {};
  for (const id of trayOrder) {
    placed[id] = { attempts: 0, placed: false };
  }
  return {
    trayOrder,
    placed,
    score: 0,
    startedAt: now,
    finishedAt: null,
    remaining: trayOrder.length,
  };
}

/**
 * Registra un rilascio fallito su una nazione.
 *
 * Incrementa il contatore `attempts` della nazione.
 * La nazione resta nel vassoio; nessun malus assoluto (RF-24).
 * Nessun limite ai tentativi: la partita è sempre completabile.
 *
 * @param state - Stato corrente della partita.
 * @param nationId - ID della nazione su cui è fallito il drag.
 * @returns Nuovo stato (immutabile).
 */
export function registerFail(state: GameState, nationId: NationId): GameState {
  const nationState = state.placed[nationId];
  if (!nationState || nationState.placed) {
    // Nazione non trovata o già posizionata: restituisce lo stato invariato.
    return state;
  }

  return {
    ...state,
    placed: {
      ...state.placed,
      [nationId]: {
        ...nationState,
        attempts: nationState.attempts + 1,
      },
    },
  };
}

/**
 * Registra un piazzamento riuscito di una nazione.
 *
 * La nazione viene marcata come posizionata; il pezzo viene rimosso
 * dal vassoio (diminuisce `remaining`). I punti vengono calcolati
 * in base ai tentativi falliti precedenti (scoreForAttempt).
 *
 * Quando `remaining` raggiunge 0, viene impostato `finishedAt`
 * (il timestamp di fine partita).
 *
 * @param state - Stato corrente della partita.
 * @param nationId - ID della nazione posizionata.
 * @param now - Timestamp epoch ms per finishedAt (default: Date.now()).
 * @returns Nuovo stato (immutabile).
 */
export function registerPlace(
  state: GameState,
  nationId: NationId,
  now: number = Date.now(),
): GameState {
  const nationState = state.placed[nationId];
  if (!nationState || nationState.placed) {
    // Nazione non trovata o già posizionata: restituisce lo stato invariato.
    return state;
  }

  const points = scoreForAttempt(nationState.attempts);
  const newRemaining = state.remaining - 1;

  return {
    ...state,
    placed: {
      ...state.placed,
      [nationId]: {
        ...nationState,
        attempts: nationState.attempts + 1, // il tentativo riuscito conta
        placed: true,
      },
    },
    score: state.score + points,
    remaining: newRemaining,
    finishedAt: newRemaining === 0 ? now : state.finishedAt,
  };
}