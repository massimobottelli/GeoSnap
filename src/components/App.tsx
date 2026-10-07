/**
 * App — preview statica della mappa Europa (Fase 1).
 *
 * TEMPORANEO: renderizza i path SVG da `europe-shapes.json` per verificare
 * visivamente le sagome generate dalla pipeline. Questo componente verrà
 * sostituito dal flusso di gioco reale nelle fasi successive (GameScreen,
 * MapView, Tray, ecc.).
 */
import shapes from '../data/europe-shapes.json';

const { viewBox, countries } = shapes;
const entries = Object.entries(countries);
const playable = entries.filter(([, c]) => c.playable);
const nonPlayable = entries.filter(([, c]) => !c.playable);

export function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-4 bg-map-bg p-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-accent">
        GeoSnap
      </h1>
      <p className="text-sm text-slate-500">
        Preview mappa (Fase 1) · {playable.length} nazioni giocabili (verde) ·{' '}
        {nonPlayable.length} non interattive (grigio) · viewBox [
        {viewBox.join(', ')}]
      </p>
      <svg
        viewBox={viewBox.join(' ')}
        className="w-full max-w-4xl rounded-lg border border-slate-200 bg-white shadow-sm"
        style={{ aspectRatio: `${viewBox[2]} / ${viewBox[3]}` }}
      >
        {/* Strato inferiore: nazioni non giocabili (grigio, non interattive) */}
        {nonPlayable.map(([id, c]) => (
          <path
            key={id}
            d={c.pathD}
            fill="var(--color-disabled-geo)"
            stroke="#a0a0a0"
            strokeWidth={0.5}
            opacity={0.6}
          />
        ))}
        {/* Strato superiore: nazioni giocabili (verde accento) */}
        {playable.map(([id, c]) => (
          <path
            key={id}
            d={c.pathD}
            fill="var(--color-accent)"
            stroke="#3a5c00"
            strokeWidth={0.5}
            opacity={0.85}
          />
        ))}
        {/* Etichette al centroide per le nazioni giocabili */}
        {playable.map(([id, c]) => (
          <text
            key={`label-${id}`}
            x={c.centroid[0]}
            y={c.centroid[1]}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(
              3,
              Math.min(7, Math.sqrt(c.area) * 0.5),
            )}
            fill="#1a1a1a"
            fontWeight={600}
            style={{ pointerEvents: 'none' }}
          >
            {c.name}
          </text>
        ))}
      </svg>
    </main>
  );
}

export default App;
