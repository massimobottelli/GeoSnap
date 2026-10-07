/**
 * GeoSnap — hook per zoom/pan sulla mappa SVG (Fase 4, Task 4.2).
 *
 * Incapsula d3-zoom con:
 * - Pinch (2 dita) e pan (1 dito) touch.
 * - Limiti di zoom 1×–6× (parametrici da tuning.ts).
 * - Filtro per disattivare zoom durante il drag (RF-22).
 * - Aggiornamento imperativo del transform via requestAnimationFrame.
 *
 * Riferimento: §7.2 dei Requisiti Tecnici MVP1.
 */

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3-zoom';
import { select, type Selection } from 'd3-selection';
import { tuning } from '../tuning';

const { ZOOM_MIN, ZOOM_MAX } = tuning.map;

/** Identità d3-zoom. */
const identity = d3.zoomIdentity;

/**
 * Hook che applica d3-zoom a un elemento SVG.
 *
 * @param options.isDragActive - Se `true`, disattiva zoom/pan (RF-22).
 * @returns Oggetti ref da passare ai componenti figli.
 */
export function useMapZoom(options?: { isDragActive?: boolean }) {
  const isDragActive = options?.isDragActive ?? false;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapRootRef = useRef<SVGGElement | null>(null);
  const zoomTransformRef = useRef<string>(identity.toString());

  // Refs stabili per d3-zoom (evitano re-creazione comportamento)
  const behaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const selectionRef = useRef<Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const isDragActiveRef = useRef(isDragActive);
  isDragActiveRef.current = isDragActive;

  // Crea il comportamento zoom una sola volta
  behaviorRef.current ??= d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([ZOOM_MIN, ZOOM_MAX])
    .filter((event: unknown) => {
      // Durante il drag, ignora tutti gli eventi di zoom (RF-22)
      if (isDragActiveRef.current) return false;
      // Filtro default: ignora click destro, ctrl+click
      const e = event as { button?: number; ctrlKey?: boolean };
      return !e.ctrlKey && (!e.button || e.button === 2);
    })
    .on('zoom', (event: { transform: d3.ZoomTransform }) => {
      const t = event.transform;
      const root = mapRootRef.current;
      if (root === null) return;
      // Aggiornamento imperativo via rAF — zero setState
      requestAnimationFrame(() => {
        if (mapRootRef.current !== null) {
          mapRootRef.current.setAttribute('transform', t.toString());
        }
      });
      zoomTransformRef.current = t.toString();
    });

  // Callback ref: inizializza d3-zoom quando il monta l'SVG
  const svgCallbackRef = useCallback((node: SVGSVGElement | null) => {
    // Cleanup del nodo precedente
    if (selectionRef.current !== null) {
      selectionRef.current.on('.zoom', null);
    }

    svgRef.current = node;

    if (node !== null && behaviorRef.current !== null) {
      const selection = select(node);
      selectionRef.current = selection;
      selection.call(behaviorRef.current);
      // Imposta il transform iniziale (identità)
      const currentTransform = d3.zoomTransform(node);
      zoomTransformRef.current = currentTransform.toString();
      if (mapRootRef.current !== null) {
        mapRootRef.current.setAttribute('transform', currentTransform.toString());
      }
    }
  }, []);

  // Sincronizza il filtro di drag quando cambia isDragActive
  useEffect(() => {
    const sel = selectionRef.current;
    const behavior = behaviorRef.current;
    if (sel !== null && behavior !== null) {
      sel.call(behavior);
    }
  }, [isDragActive]);

  // Cleanup finale
  useEffect(() => {
    return () => {
      if (selectionRef.current !== null) {
        selectionRef.current.on('.zoom', null);
      }
    };
  }, []);

  return {
    svgRef,
    svgCallbackRef,
    mapRootRef,
    zoomTransformRef,
  };
}
