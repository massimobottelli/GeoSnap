/**
 * GeoSnap — GameScreen: integrazione completa del flusso di gioco (Fase 5).
 *
 * Assembla mappa, vassoio, drag e HUD. Gestisce la transizione
 * dallo stato di gioco attivo alla schermata di riepilogo (SummaryScreen)
 * al completamento dell'ultima nazione.
 *
 * Riferimento: §9.4, §7.1 dei Requisiti Tecnici MVP1.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { useMapZoom } from '../hooks/useMapZoom';
import { MapView } from './MapView';
import { Tray } from './Tray';
import { DragLayer } from './DragLayer';
import { HUD } from './HUD';
import { SummaryScreen } from './SummaryScreen';
import { startGame, registerPlace, registerFail } from '../game/gameState';
import { evaluateSnap } from '../game/evaluation/snap';
import { getPlayableIds } from '../data/nations';
import type { GameState, Nation } from '../game/types';
import type { CanvasFactory, CanvasTransform } from '../game/evaluation/rasterize';
import shapes from '../data/europe-shapes.json';

const browserCanvasFactory: CanvasFactory = (w, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
};

function screenToSvgCoords(
  svg: SVGSVGElement,
  screenX: number,
  screenY: number,
): [number, number] | null {
  const ctm = svg.getScreenCTM();
  if (ctm === null) return null;
  const pt = svg.createSVGPoint();
  pt.x = screenX;
  pt.y = screenY;
  const svgPt = pt.matrixTransform(ctm.inverse());
  return [svgPt.x, svgPt.y];
}

function loadNations(): Record<string, Nation> {
  const result: Record<string, Nation> = {};
  for (const [id, c] of Object.entries(shapes.countries)) {
    const data = c as {
      name: string;
      playable: boolean;
      pathD: string;
      bbox: [number, number, number, number];
      centroid: [number, number];
      area: number;
    };
    result[id] = {
      id,
      name: data.name,
      playable: data.playable,
      pathD: data.pathD,
      bbox: data.bbox,
      centroid: data.centroid,
      area: data.area,
    };
  }
  return result;
}
export function GameScreen() {
  const nations = useMemo(() => loadNations(), []);
  const playableIds = useMemo(() => getPlayableIds(), []);

  const [gameState, setGameState] = useState<GameState>(() => startGame(playableIds));
  const [gameFinished, setGameFinished] = useState(false);
  const [activeNationId, setActiveNationId] = useState<string | null>(null);
  const [failedNationIds, setFailedNationIds] = useState<Set<string>>(new Set());
  const [justSnappedId, setJustSnappedId] = useState<string | undefined>(undefined);

  const pieceRef = useRef<SVGPathElement | null>(null);
  const isDraggingRef = useRef(false);

  const { svgRef, svgCallbackRef, mapRootRef, zoomTransformRef } = useMapZoom({
    isDragActive: isDraggingRef.current,
  });

  const activeNation = activeNationId !== null ? (nations[activeNationId] ?? null) : null;

  const nationsPlaced = useMemo(() => {
    return Object.entries(gameState.placed)
      .filter(([, ns]) => ns.placed)
      .map(([id]) => id);
  }, [gameState.placed]);
  const handlePiecePointerDown = useCallback(
    (nationId: string, e: React.PointerEvent) => {
      const target = e.currentTarget;
      if (!(target instanceof SVGElement)) return;
      const nation = nations[nationId];
      if (nation === undefined) return;
      target.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      setActiveNationId(nationId);
      requestAnimationFrame(() => {
        if (pieceRef.current !== null) {
          pieceRef.current.setAttribute(
            'transform',
            `translate(${String(nation.centroid[0])}, ${String(nation.centroid[1])})`,
          );
        }
      });
    },
    [nations],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || activeNationId === null) return;
      const svg = svgRef.current;
      if (svg === null) return;
      const coords = screenToSvgCoords(svg, e.clientX, e.clientY);
      if (coords === null) return;
      if (pieceRef.current !== null) {
        pieceRef.current.setAttribute(
          'transform',
          `translate(${String(coords[0])}, ${String(coords[1])})`,
        );
      }
    },
    [activeNationId, svgRef],
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || activeNationId === null) return;
      const svg = svgRef.current;
      if (svg === null) return;
      const coords = screenToSvgCoords(svg, e.clientX, e.clientY);
      const nation = nations[activeNationId];
      if (coords !== null && nation !== undefined) {
        const dx = coords[0] - nation.centroid[0];
        const dy = coords[1] - nation.centroid[1];
        const releaseTransform: CanvasTransform = { a: 1, b: 0, c: 0, d: 1, e: dx, f: dy };
        const snapped = evaluateSnap(
          nation.pathD,
          releaseTransform,
          nation.bbox,
          browserCanvasFactory,
        );
        if (snapped) {
          setJustSnappedId(activeNationId);
          setGameState((prev) => {
            const next = registerPlace(prev, activeNationId);
            if (next.remaining === 0) setGameFinished(true);
            return next;
          });
        } else {
          setFailedNationIds((prev) => new Set(prev).add(activeNationId));
          setGameState((prev) => registerFail(prev, activeNationId));
        }
      }
      isDraggingRef.current = false;
      setActiveNationId(null);
    },
    [activeNationId, nations, svgRef],
  );

  const handlePointerCancel = useCallback(() => {
    isDraggingRef.current = false;
    setActiveNationId(null);
  }, []);

  const handleReturnAnimationEnd = useCallback((nationId: string) => {
    setFailedNationIds((prev) => {
      const next = new Set(prev);
      next.delete(nationId);
      return next;
    });
  }, []);

  const handleSnapAnimationEnd = useCallback(() => {
    setJustSnappedId(undefined);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameState(startGame(playableIds));
    setGameFinished(false);
    setActiveNationId(null);
    setFailedNationIds(new Set());
    setJustSnappedId(undefined);
  }, [playableIds]);
  if (gameFinished) {
    return <SummaryScreen state={gameState} nations={nations} onPlayAgain={handlePlayAgain} />;
  }

  const totalPlaced = gameState.trayOrder.length - gameState.remaining;

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="relative min-h-0 flex-1">
        <MapView
          svgCallbackRef={svgCallbackRef}
          mapRootRef={mapRootRef}
          zoomTransformRef={zoomTransformRef}
          placedNationIds={nationsPlaced}
          justSnappedId={justSnappedId}
          onSnapAnimationEnd={handleSnapAnimationEnd}
        />
        <HUD placed={totalPlaced} total={gameState.trayOrder.length} score={gameState.score} />
        <DragLayer
          activeNation={activeNation}
          zoomTransformRef={zoomTransformRef}
          pieceRef={pieceRef}
        />
      </div>
      <Tray
        nations={nations}
        trayOrder={gameState.trayOrder.filter((id) => {
          const ns = gameState.placed[id];
          return ns !== undefined && !ns.placed;
        })}
        onPiecePointerDown={handlePiecePointerDown}
        failedNationIds={failedNationIds}
        onReturnAnimationEnd={handleReturnAnimationEnd}
      />
    </div>
  );
}
