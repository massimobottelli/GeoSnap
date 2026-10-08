/**
 * GeoSnap — GameScreen: integrazione completa del flusso di gioco (Fase 5).
 *
 * Assembla mappa, vassoio, drag e HUD. Gestisce la transizione
 * dallo stato di gioco attivo alla schermata di riepilogo (SummaryScreen)
 * al completamento dell'ultima nazione.
 *
 * Riferimento: §9.4, §7.1 dei Requisiti Tecnici MVP1.
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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

/**
 * Converte coordinate schermo → coordinate viewBox della mappa (§5.3).
 *
 * Il riferimento è il `<g>` radice della mappa (non l'`<svg>`): il suo CTM
 * include il transform d3-zoom, quindi il risultato è espresso nelle stesse
 * coordinate in cui vivono i `pathD` delle nazioni, a qualunque livello di zoom.
 */
function screenToSvgCoords(
  target: SVGGraphicsElement,
  screenX: number,
  screenY: number,
): [number, number] | null {
  const ctm = target.getScreenCTM();
  if (ctm === null) return null;
  const svgPt = new DOMPoint(screenX, screenY).matrixTransform(ctm.inverse());
  return [svgPt.x, svgPt.y];
}

/**
 * Trasformazione (traslazione) che porta il centroide della sagoma sul punto
 * indicato, in coordinate viewBox della mappa (RF-15: la sagoma segue il dito).
 */
function pieceTransformAt(centroid: readonly [number, number], x: number, y: number): string {
  return `translate(${String(x - centroid[0])}, ${String(y - centroid[1])})`;
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
  /** Transform iniziale della sagoma al pickup (applicato da DragLayer al mount). */
  const pieceTransformRef = useRef<string>('');

  // Dev-only test hook for E2E: allows force-completing the game via
  // window.__geosnap_test.forceComplete(). No-op in production builds.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const win = window as unknown as Record<string, Record<string, (...args: unknown[]) => void>>;
    win.__geosnap_test = {
      forceComplete: () => {
        setGameState((prev) => {
          let state = prev;
          for (const id of state.trayOrder) {
            const ns = state.placed[id];
            if (ns !== undefined && !ns.placed) {
              state = registerPlace(state, id);
            }
          }
          return state;
        });
        setGameFinished(true);
      },
    };
    return () => {
      delete win.__geosnap_test;
    };
  }, [playableIds]);

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
      const mapRoot = mapRootRef.current ?? svgRef.current;
      if (mapRoot === null) return;
      // Posizione iniziale: la sagoma "cresce" alla scala della mappa e il suo
      // centroide finisce subito sotto il dito, nel punto di presa (RF-15).
      const coords = screenToSvgCoords(mapRoot, e.clientX, e.clientY);
      if (coords === null) return;
      target.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      pieceTransformRef.current = pieceTransformAt(nation.centroid, coords[0], coords[1]);
      setActiveNationId(nationId);
    },
    [mapRootRef, nations, svgRef],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || activeNationId === null) return;
      const nation = nations[activeNationId];
      if (nation === undefined) return;
      const mapRoot = mapRootRef.current ?? svgRef.current;
      if (mapRoot === null) return;
      const coords = screenToSvgCoords(mapRoot, e.clientX, e.clientY);
      if (coords === null) return;
      const transform = pieceTransformAt(nation.centroid, coords[0], coords[1]);
      pieceTransformRef.current = transform;
      // Aggiornamento imperativo: zero setState nel loop di drag (§3.2)
      pieceRef.current?.setAttribute('transform', transform);
    },
    [activeNationId, mapRootRef, nations, svgRef],
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || activeNationId === null) return;
      const mapRoot = mapRootRef.current ?? svgRef.current;
      if (mapRoot === null) return;
      const coords = screenToSvgCoords(mapRoot, e.clientX, e.clientY);
      const nation = nations[activeNationId];
      if (coords !== null && nation !== undefined) {
        // Stessa traslazione applicata alla sagoma durante il drag (RF-20)
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
    [activeNationId, mapRootRef, nations, svgRef],
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
      <div className="relative z-10 min-h-0 flex-1">
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
          pieceTransformRef={pieceTransformRef}
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
        draggingNationId={activeNationId}
        onReturnAnimationEnd={handleReturnAnimationEnd}
      />
    </div>
  );
}
