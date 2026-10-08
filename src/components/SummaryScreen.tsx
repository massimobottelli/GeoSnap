/**
 * GeoSnap — schermata di riepilogo fine partita (Fase 5, Task 4.5/5.1).
 *
 * Mostra:
 * - Punteggio totale / punteggio massimo teorico
 * - Percentuale di precisione (primo tentativo)
 * - Tempo totale di partita (mm:ss)
 * - Elenco delle nazioni con errori commessi
 * - Pulsante "Gioca ancora" (RF-34)
 *
 * Riferimento: RF-31, RF-32, RF-34 dei Requisiti Funzionali.
 */

import { maxScore, precision } from '../game/scoring';
import type { GameState, Nation } from '../game/types';

interface SummaryScreenProps {
  state: GameState;
  nations: Readonly<Record<string, Nation>>;
  onPlayAgain: () => void;
}

function formatDuration(startedAt: number, finishedAt: number): string {
  const seconds = Math.floor((finishedAt - startedAt) / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function SummaryScreen({ state, nations, onPlayAgain }: SummaryScreenProps) {
  const total = state.trayOrder.length;
  const max = maxScore(total);
  const prec = precision(state.placed);
  const duration =
    state.finishedAt !== null ? formatDuration(state.startedAt, state.finishedAt) : '--:--';

  // Nazioni con errori (attempts > 1, cioè almeno 1 fallimento)
  const errorNations = state.trayOrder
    .filter((id) => {
      const ns = state.placed[id];
      return ns !== undefined && ns.placed && ns.attempts > 1;
    })
    .map((id) => ({
      id,
      name: nations[id]?.name ?? id,
      errors: (state.placed[id]?.attempts ?? 1) - 1,
    }))
    .sort((a, b) => b.errors - a.errors);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-map-bg p-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-accent">Partita completata!</h1>

      <div className="flex flex-col items-center gap-2">
        <p className="text-5xl font-bold text-gray-800">
          {state.score} <span className="text-2xl font-normal text-gray-500">/ {max}</span>
        </p>
        <p className="text-lg text-gray-600">
          Precisione: <span className="font-semibold">{(prec * 100).toFixed(0)}%</span>
        </p>
        <p className="text-lg text-gray-600">
          Tempo: <span className="font-semibold">{duration}</span>
        </p>
      </div>

      {errorNations.length > 0 && (
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">Nazioni con errori</h2>
          <ul className="space-y-1">
            {errorNations.map((n) => (
              <li key={n.id} className="flex justify-between text-sm text-gray-700">
                <span>{n.name}</span>
                <span className="font-medium text-red-500">
                  {n.errors} {n.errors === 1 ? 'errore' : 'errori'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        data-testid="play-again"
        onClick={onPlayAgain}
        className="mt-4 rounded-xl bg-accent px-8 py-3 text-lg font-bold text-gray-900
          shadow-md transition-transform hover:scale-105 active:scale-95"
      >
        Gioca ancora
      </button>
    </div>
  );
}
