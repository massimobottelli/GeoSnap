/**
 * GeoSnap — Heads-Up Display (Fase 5, Task 4.5/5.1).
 *
 * Mostra il contatore di avanzamento ("12/36 posizionate") e il
 * punteggio corrente in tempo reale durante la partita.
 *
 * Riferimento: RF-12, RF-25 dei Requisiti Funzionali.
 */

interface HUDProps {
  /** Numero di nazioni posizionate. */
  placed: number;
  /** Numero totale di nazioni giocabili. */
  total: number;
  /** Punteggio corrente. */
  score: number;
}

export function HUD({ placed, total, score }: HUDProps) {
  return (
    <div
      className="pointer-events-none absolute top-2 left-1/2 z-10 flex -translate-x-1/2 gap-4
        rounded-full bg-white/80 px-4 py-1.5 shadow-md backdrop-blur-sm"
    >
      <span className="text-sm font-semibold text-gray-700">
        {placed}/{total} posizionate
      </span>
      <span className="text-sm font-bold text-accent">{score} pt</span>
    </div>
  );
}
