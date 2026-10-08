/**
 * GeoSnap — vassoio scorrevole delle nazioni (Fase 4, Task 4.3).
 *
 * Container orizzontale scrollabile nativamente (overflow-x: auto),
 * posizionato fuori dal contesto SVG zoomabile.
 *
 * Ogni pezzo è scalato proporzionalmente all'area della nazione,
 * con dimensione minima garantita (RF-11).
 *
 * Riferimento: §5.2 dei Requisiti Tecnici MVP1, RF-09, RF-10, RF-11, RF-13.
 */

import { useMemo, useRef, useCallback } from 'react';
import type { Nation, NationId } from '../game/types';
import { TrayItem } from './TrayItem';
import { tuning } from '../tuning';

const { SCALE_MIN, SCALE_MAX, SCALE_CURVE } = tuning.tray;

interface TrayProps {
  /** Dati delle nazioni (per path, area, centroid, ecc.). */
  nations: Readonly<Record<string, Nation>>;
  /** Ordine delle nazioni nel vassoio (solo quelle non posizionate). */
  trayOrder: readonly NationId[];
  /** Callback al puntatore giù su un pezzo (inizio drag). */
  onPiecePointerDown: (nationId: string, e: React.PointerEvent) => void;
  /** ID delle nazioni con animazione di ritorno in corso. */
  failedNationIds: ReadonlySet<string>;
  /** ID della nazione attualmente trascinata (la sagoma si stacca dal vassoio — RF-15). */
  draggingNationId: string | null;
  /** Callback alla fine dell'animazione di ritorno. */
  onReturnAnimationEnd: (nationId: string) => void;
}

/** Calcola la scala del pezzo nel vassoio (proporzionale all'area). */
function computeTrayScale(area: number, maxSqrtArea: number): number {
  if (maxSqrtArea <= 0) return SCALE_MIN;
  const ratio = Math.sqrt(area) / maxSqrtArea;
  return SCALE_MIN + Math.pow(ratio, SCALE_CURVE) * (SCALE_MAX - SCALE_MIN);
}

export function Tray({
  nations,
  trayOrder,
  onPiecePointerDown,
  failedNationIds,
  draggingNationId,
  onReturnAnimationEnd,
}: TrayProps) {
  /** Container scrollabile del vassoio. */
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Scroll congelato al pickup, così il rilascio nel vassoio resta sulla sagoma. */
  const scrollLeftAtPickupRef = useRef(0);

  const handlePiecePointerDown = useCallback(
    (nationId: string, e: React.PointerEvent) => {
      const container = containerRef.current;
      if (container !== null) {
        scrollLeftAtPickupRef.current = container.scrollLeft;
      }
      onPiecePointerDown(nationId, e);
      if (container !== null) {
        container.scrollLeft = scrollLeftAtPickupRef.current;
      }
    },
    [onPiecePointerDown],
  );

  // Massimo sqrt(area) per la normalizzazione della scala
  const maxSqrtArea = useMemo(() => {
    let max = 0;
    for (const id of trayOrder) {
      const n = nations[id];
      if (n !== undefined) {
        const sq = Math.sqrt(n.area);
        if (sq > max) max = sq;
      }
    }
    return max;
  }, [nations, trayOrder]);

  return (
    <div
      ref={containerRef}
      className="flex shrink-0 items-end overflow-x-auto bg-tray"
      style={{
        touchAction: 'pan-x',
        minHeight: '120px',
        maxHeight: '35vh',
      }}
    >
      <div className="flex items-end gap-1 px-2 py-2">
        {trayOrder.map((id) => {
          const nation = nations[id];
          if (nation === undefined) return null;
          const scale = computeTrayScale(nation.area, maxSqrtArea);
          return (
            <TrayItem
              key={id}
              nation={nation}
              scale={scale}
              onPointerDown={handlePiecePointerDown}
              isAnimatingReturn={failedNationIds.has(id)}
              isDragging={draggingNationId === id}
              onAnimationEnd={() => {
                onReturnAnimationEnd(id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
