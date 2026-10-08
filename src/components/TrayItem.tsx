/**
 * GeoSnap — singola sagoma nel vassoio (Fase 4, Task 4.3).
 *
 * Rendering: sagoma SVG scalata + nome nazione + hit area trasparente.
 * Interazione: pickup via Pointer Events per il drag.
 * Animazione di ritorno al vassoio dopo un fallimento (RF-18).
 *
 * Riferimento: §5.2 dei Requisiti Tecnici MVP1.
 */

import type { Nation } from '../game/types';

interface TrayItemProps {
  nation: Nation;
  scale: number;
  onPointerDown: (nationId: string, e: React.PointerEvent) => void;
  isAnimatingReturn: boolean;
  /** La sagoma è stata staccata dal vassoio ed è nel DragLayer (RF-15). */
  isDragging: boolean;
  onAnimationEnd: () => void;
}

export function TrayItem({
  nation,
  scale,
  onPointerDown,
  isAnimatingReturn,
  isDragging,
  onAnimationEnd,
}: TrayItemProps) {
  const { id, name, pathD, centroid, bbox } = nation;

  // Dimensioni della viewBox centrata sul centroide
  const maxDim = Math.max(bbox[2], bbox[3]);
  const vbSize = maxDim / scale;
  const halfVb = vbSize / 2;
  const viewBoxStr = `${centroid[0] - halfVb} ${centroid[1] - halfVb} ${vbSize} ${vbSize}`;

  // Dimensione SVG in px (scala * dimensione naturale della viewBox)
  const svgSize = maxDim;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1 px-2">
      <svg
        data-nation-id={id}
        data-dragging={isDragging}
        width={svgSize}
        height={svgSize}
        viewBox={viewBoxStr}
        className="touch-none select-none"
        style={{
          // La sagoma si stacca dal vassoio: resta invisibile (ma occupa lo
          // stesso spazio) finché è nel DragLayer (RF-15).
          visibility: isDragging ? 'hidden' : undefined,
          transform: isAnimatingReturn ? 'translate(0, 0)' : undefined,
          transition: isAnimatingReturn
            ? 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : undefined,
        }}
        onTransitionEnd={isAnimatingReturn ? onAnimationEnd : undefined}
        onPointerDown={(e) => {
          onPointerDown(id, e);
        }}
      >
        {/* Hit area trasparente: rettangolo >= 44px centrato (RF-11) */}
        <rect
          x={centroid[0] - halfVb}
          y={centroid[1] - halfVb}
          width={vbSize}
          height={vbSize}
          fill="transparent"
        />
        {/* Sagoma della nazione */}
        <path
          d={pathD}
          fill="var(--color-accent)"
          opacity={0.85}
          style={{ pointerEvents: 'none' }}
        />
      </svg>
      <span
        className="w-full truncate text-center text-xs font-medium text-gray-700"
        style={{ maxWidth: `${svgSize}px` }}
      >
        {name}
      </span>
    </div>
  );
}
