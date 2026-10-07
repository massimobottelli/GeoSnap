/**
 * GeoSnap — mappa SVG interattiva (Fase 4, Task 4.2).
 *
 * Rendering della mappa dell'Europa:
 * - Strato inferiore: territori non giocabili in grigio (RF-06/07).
 * - Strato nazioni posizionate: colore accent + nome al centroide (RF-14).
 * - Strato feedback: animazioni di snap (RF-17).
 * - Zoom/pan via d3-zoom applicato al `<g>` interno.
 *
 * Riferimento: §5.1 dei Requisiti Tecnici MVP1.
 */

import { useEffect } from 'react';
import shapes from '../data/europe-shapes.json';
import { tuning } from '../tuning';

const { viewBox, countries } = shapes;
const entries = Object.entries(countries);
const nonPlayable = entries.filter(([, c]) => !c.playable);
const playable = entries.filter(([, c]) => c.playable);

interface MapViewProps {
  /** Callback ref per l'elemento `<svg>` (inizializza d3-zoom). */
  svgCallbackRef: (node: SVGSVGElement | null) => void;
  /** Ref per il `<g>` su cui applicare il transform d3-zoom. */
  mapRootRef: React.RefObject<SVGGElement | null>;
  /** Ref stringa del transform d3-zoom corrente (per DragLayer). */
  zoomTransformRef: React.RefObject<string>;
  /** ID delle nazioni posizionate (per lo strato "posizionate"). */
  placedNationIds: readonly string[];
  /** ID della nazione appena agganciata (per animazione snap, RF-17). */
  justSnappedId: string | undefined;
  /** Callback alla fine dell'animazione di snap. */
  onSnapAnimationEnd: () => void;
}

export function MapView({
  svgCallbackRef,
  mapRootRef,
  zoomTransformRef,
  placedNationIds,
  justSnappedId,
  onSnapAnimationEnd,
}: MapViewProps) {
  const { LABEL_FONT_MIN, LABEL_FONT_MAX } = tuning.map;

  // Sincronizza il transform iniziale sul group
  useEffect(() => {
    const root = mapRootRef.current;
    if (root !== null) {
      root.setAttribute('transform', zoomTransformRef.current);
    }
  }, [mapRootRef, zoomTransformRef]);

  const placedSet = new Set(placedNationIds);

  return (
    <svg
      ref={svgCallbackRef}
      viewBox={viewBox.join(' ')}
      className="h-full w-full touch-none"
      style={{ background: 'var(--color-map-bg)' }}
    >
      <g ref={mapRootRef}>
        {/* Strato 1: territori non giocabili (grigio, non interattivi — RF-06/07) */}
        <g className="non-interactive" style={{ pointerEvents: 'none' }}>
          {nonPlayable.map(([id, c]) => (
            <path key={id} d={c.pathD} fill="var(--color-disabled-geo)" opacity={0.6} />
          ))}
        </g>

        {/* Strato 2: nazioni posizionate (colore accent + nome — RF-14) */}
        <g className="placed-nations" style={{ pointerEvents: 'none' }}>
          {playable.map(([id, c]) => {
            if (!placedSet.has(id)) return null;
            const isJustSnapped = id === justSnappedId;
            return (
              <g key={id}>
                <path
                  d={c.pathD}
                  fill="var(--color-accent-strong)"
                  className={isJustSnapped ? 'animate-snap-success' : undefined}
                  onAnimationEnd={
                    isJustSnapped
                      ? (e) => {
                          if ((e.target as Element).tagName === 'path') {
                            onSnapAnimationEnd();
                          }
                        }
                      : undefined
                  }
                />
                <text
                  x={c.centroid[0]}
                  y={c.centroid[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.max(
                    LABEL_FONT_MIN,
                    Math.min(LABEL_FONT_MAX, Math.sqrt(c.area) * 0.5),
                  )}
                  fill="#1a1a1a"
                  fontWeight={600}
                >
                  {c.name}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}
