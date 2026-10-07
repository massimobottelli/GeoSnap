/**
 * GeoSnap — tipi di dominio per la logica di gioco.
 *
 * Definisce lo stato di gioco e le entità di dominio.
 * Nessuna dipendenza da React o DOM: puro TypeScript per logica testabile.
 *
 * Riferimento: §8.1 dei Requisiti Tecnici MVP1.
 */

/** Identificatore nazione: ISO 3166-1 alpha-3 (es. "ITA"). */
export type NationId = string;

/** Interfaccia per i dati di una nazione (da europe-shapes.json). */
export interface Nation {
  readonly id: NationId;
  readonly name: string; // nome italiano
  readonly playable: boolean;
  readonly pathD: string;
  readonly bbox: readonly [number, number, number, number];
  readonly centroid: readonly [number, number];
  readonly area: number; // unità viewBox²
}

/** Risultato del piazzamento, indicizzato sui tentativi falliti precedenti. */
export type PlacementResult = 'first' | 'second' | 'third' | 'fourthPlus';

/** Stato di una singola nazione durante la partita. */
export interface NationState {
  readonly attempts: number; // rilasci falliti su questa nazione (RF-26)
  readonly placed: boolean;
}

/** Stato completo di una partita in corso o terminata. */
export interface GameState {
  readonly trayOrder: readonly NationId[]; // ordine casuale del vassoio (RF-04)
  readonly placed: Readonly<Record<NationId, NationState>>;
  readonly score: number; // punteggio corrente (RF-25)
  readonly startedAt: number; // epoch ms registrato a inizio partita (RF-32)
  readonly finishedAt: number | null; // epoch ms registrato all'ultimo place
  readonly remaining: number; // n = trayOrder.length - placed
}
