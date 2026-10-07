/**
 * GeoSnap — valutazione dello snap tramite overlap di area (Fase 3, Task 3.1).
 *
 * Algoritmo (eseguito solo al rilascio della sagoma):
 * 1. Rasterizzare il target e la sagoma rilasciata su due canvas offscreen
 *    di risoluzione fissa `SNAP_RASTER_SIZE` (default 128×128), mappando
 *    il bbox del paese target.
 * 2. Contare i pixel in cui entrambe le rasterizzazioni sono opache → overlapPx.
 * 3. Contare i pixel opachi del solo target → targetPx.
 * 4. Aggancio riuscito ⇔ overlapPx / targetPx ≥ MIN_OVERLAP_RATIO.
 *
 * Proprietà:
 * - Robusto a qualunque forma (concave, irregolari).
 * - Tolleranza implicitamente proporzionale alla nazione (raster normalizzato
 *   sul bbox del target).
 * - Aggancio solo alla propria posizione (RF-20): la valutazione confronta
 *   la sagoma solo col suo target.
 * - Funzione pura e testabile: il canvas è iniettato via CanvasFactory.
 *
 * Riferimento: §6 dei Requisiti Tecnici MVP1, RF-19, RF-20.
 */

import { tuning } from '../../tuning';
import {
  rasterizePath,
  type BBox,
  type CanvasFactory,
  type CanvasTransform,
} from './rasterize';

/**
 * Valuta se una sagoma rilasciata si aggancia alla posizione del target.
 *
 * @param nationPathD - Path SVG della nazione (usato sia per il target
 *                      sia per la sagoma trascinata: stessa geometria).
 * @param releaseTransform - Trasformazione applicata alla sagoma durante
 *                           il drag (mappa dalla posizione di riferimento
 *                           alla posizione di rilascio).
 * @param targetBBox - Bounding box della nazione target (unità viewBox).
 * @param canvasFactory - Factory per creare canvas (iniettabile per test).
 * @returns `true` se la sagoma si aggancia al target, `false` altrimenti.
 */
export function evaluateSnap(
  nationPathD: string,
  releaseTransform: CanvasTransform,
  targetBBox: BBox,
  canvasFactory: CanvasFactory,
): boolean {
  const { MIN_OVERLAP_RATIO, SNAP_RASTER_SIZE } = tuning.snap;
  const size = SNAP_RASTER_SIZE;

  // Rasterizza il target (senza trasformazione aggiuntiva)
  const targetPixels = rasterizePath(
    nationPathD,
    null,
    targetBBox,
    size,
    canvasFactory,
  );

  // Rasterizza la sagoma rilasciata (con releaseTransform)
  const piecePixels = rasterizePath(
    nationPathD,
    releaseTransform,
    targetBBox,
    size,
    canvasFactory,
  );

  // Conta pixel opachi: overlap (entrambi) e target (solo target)
  let overlapPx = 0;
  let targetPx = 0;

  for (let i = 3; i < targetPixels.length; i += 4) {
    // Alpha channel è ogni 4 byte (indice 3, 7, 11, ...)
    const targetAlpha = targetPixels[i] ?? 0;
    if (targetAlpha > 0) {
      targetPx++;
      const pieceAlpha = piecePixels[i] ?? 0;
      if (pieceAlpha > 0) {
        overlapPx++;
      }
    }
  }

  // Evita divisione per zero: se il target non ha pixel opachi, non c'è snap
  if (targetPx === 0) {
    return false;
  }

  return overlapPx / targetPx >= MIN_OVERLAP_RATIO;
}