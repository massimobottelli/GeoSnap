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
  /** Ref al transform corrente della sagoma (posizione di presa al pickup). */
  pieceTransformRef: React.RefObject<string>;
}

export function DragLayer({
  activeNation,
  zoomTransformRef,
  pieceRef,
  pieceTransformRef,
}: DragLayerProps) {
  // Al pickup: sincronizza il transform d3-zoom sul <g> wrapper e posiziona la
  // sagoma nel punto di presa (la sagoma "cresce" alla scala della mappa — §5.3).
  useEffect(() => {
    const piece = pieceRef.current;
    const group = piece?.parentElement;
    if (group instanceof SVGGElement) {
      group.setAttribute('transform', zoomTransformRef.current);
    }
    if (piece !== null && pieceTransformRef.current !== '') {
      piece.setAttribute('transform', pieceTransformRef.current);
    }
  }, [activeNation, zoomTransformRef, pieceRef, pieceTransformRef]);

  return (
    <svg
      viewBox={viewBox.join(' ')}
      className="pointer-events-none absolute inset-0 h-full w-full"
      // overflow visibile: la sagoma è trascinata dal vassoio verso la mappa,
      // quindi deve essere visibile anche fuori dal viewport della mappa (§5.3).
      style={{ overflow: 'visible' }}
    >
      <g>
        {activeNation !== null && (
          <path
            ref={pieceRef}
            data-testid="drag-piece"
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
