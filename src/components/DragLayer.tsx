/**
 * GeoSnap — layer di trascinamento (Fase 4, Task 4.4).
 *
 * SVG overlay full-screen che renderizza la sagoma in corso di drag.
 * Posizionato assolutamente sopra la mappa, sotto il vassoio.
 * `pointer-events: none` per non interferire con gli eventi.
 *
 * La sagoma viene renderizzata alla scala della mappa (non del vassoio)
 * e segue il dito in modo imperativo (nessun re-render React durante il drag).
 *
 * Riferimento: §5.3 dei Requisiti Tecnici MVP1, RF-15, RF-16.
 */

import { useEffect } from 'react';
import type { Nation } from '../game/types';
import shapes from '../data/europe-shapes.json';

const { viewBox } = shapes;

interface DragLayerProps {
  /** La nazione attualmente trascinata, o null se nessun drag attivo. */
  activeNation: Nation | null;
  /** Ref al transform d3-zoom corrente (imperativo). */
  zoomTransformRef: React.RefObject<string>;
  /** Ref esposto sull'elemento path del pezzo trascinato (per aggiornamenti imperativi). */
  pieceRef: React.RefObject<SVGPathElement | null>;
}

export function DragLayer({ activeNation, zoomTransformRef, pieceRef }: DragLayerProps) {
  // Sincronizza il transform d3-zoom sul <g> wrapper
  // (il transform viene aggiornato imperativamente da d3-zoom)
  useEffect(() => {
    const group = pieceRef.current?.parentElement;
    if (group instanceof SVGGElement) {
      group.setAttribute('transform', zoomTransformRef.current);
    }
  }, [activeNation, zoomTransformRef, pieceRef]);

  return (
    <svg viewBox={viewBox.join(' ')} className="pointer-events-none absolute inset-0 h-full w-full">
      <g>
        {activeNation !== null && (
          <path
            ref={pieceRef}
            d={activeNation.pathD}
            fill="var(--color-accent)"
            opacity={0.85}
            strokeWidth={0.5}
            stroke="#3a5c00"
          />
        )}
      </g>
    </svg>
  );
}
