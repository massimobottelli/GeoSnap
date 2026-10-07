import { describe, expect, it, beforeEach } from 'vitest';

import { evaluateSnap } from '../../src/game/evaluation/snap';
import {
  IDENTITY_TRANSFORM,
  type BBox,
  type CanvasFactory,
  type CanvasContext2DLike,
  type CanvasElementLike,
  type CanvasTransform,
} from '../../src/game/evaluation/rasterize';
import { tuning } from '../../src/tuning';

/**
 * Test per `snap.ts` — valutazione overlap di area (Fase 3, Task 3.1).
 *
 * Verifica:
 * - overlap ≥ soglia → snap (true)
 * - overlap < soglia → no snap (false)
 * - sagome totalmente fuori → mai snap (RF-20)
 * - trasformazioni ai bordi (threshold behavior)
 * - edge cases (target vuoto, path vuoto)
 *
 * Il canvas è mockato: il factory restituisce pixel preconfigurati,
 * isolando la logica di snap dalla dipendenza Canvas.
 */

// ── Setup globale per i test ────────────────────────────────────────────────

class MockPath2D {
  constructor(public readonly d: string) {}
}

beforeEach(() => {
  if (typeof globalThis.Path2D === 'undefined') {
    (globalThis as Record<string, unknown>).Path2D = MockPath2D;
  }
});

// ── Helpers per il mock canvas ──────────────────────────────────────────────

/** Crea pixel RGBA con rettangoli opachi nelle posizioni indicate. */
function createPixelData(
  size: number,
  rects: readonly { x: number; y: number; w: number; h: number }[],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(size * size * 4);
  for (const rect of rects) {
    for (let py = rect.y; py < rect.y + rect.h && py < size; py++) {
      for (let px = rect.x; px < rect.x + rect.w && px < size; px++) {
        if (px >= 0 && py >= 0) {
          const idx = (py * size + px) * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        }
      }
    }
  }
  return data;
}

/** No-op function per i metodi mock del canvas. */
const noop = (): void => {
  /* mock no-op */
};

/** Crea un CanvasFactory mock che restituisce pixel in sequenza. */
function createMockCanvasFactory(
  pixelSequence: readonly Uint8ClampedArray[],
): CanvasFactory {
  let callIndex = 0;
  return (width: number, height: number): CanvasElementLike => ({
    width,
    height,
    getContext(): CanvasContext2DLike {
      return {
        setTransform: noop,
        clearRect: noop,
        fill: noop,
        getImageData: () => {
          const pixels = pixelSequence[callIndex] ?? new Uint8ClampedArray(0);
          callIndex++;
          return { data: pixels, width, height };
        },
      };
    },
  });
}

// ── Costanti di test ────────────────────────────────────────────────────────

const SIZE = tuning.snap.SNAP_RASTER_SIZE;
const MIN_RATIO = tuning.snap.MIN_OVERLAP_RATIO;
const TEST_BBOX: BBox = [0, 0, 100, 100];
const DUMMY_PATH = 'M0,0 L100,0 L100,100 L0,100 Z';

// ── Test ────────────────────────────────────────────────────────────────────

describe('snap.ts — valutazione overlap di area (Fase 3, Task 3.1)', () => {
  // ── Overlap perfetto (≥ soglia) ────────────────────────────────────────

  describe('aggancio riuscito (overlap ≥ soglia)', () => {
    it('restituisce true quando target e sagoma coincidono (overlap = 1.0)', () => {
      const pixels = createPixelData(SIZE, [{ x: 20, y: 20, w: 80, h: 80 }]);
      const factory = createMockCanvasFactory([pixels, pixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(true);
    });

    it('restituisce true quando overlap è esattamente uguale alla soglia (≥)', () => {
      // Target: 100 px. Sagoma: 55 px sovrapposti (55% = soglia)
      const targetPixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 10 },
      ]);
      const piecePixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 5 },
        { x: 0, y: 5, w: 5, h: 1 },
      ]); // 50 + 5 = 55 px
      const factory = createMockCanvasFactory([targetPixels, piecePixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(true);
    });

    it('restituisce true quando overlap è ben sopra la soglia', () => {
      // Target: 100 px. Sagoma: 80 px sovrapposti (80%)
      const targetPixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 10 },
      ]);
      const piecePixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 8 },
      ]);
      const factory = createMockCanvasFactory([targetPixels, piecePixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(true);
    });
  });

  // ── Overlap insufficiente (< soglia) ──────────────────────────────────

  describe('aggancio fallito (overlap < soglia)', () => {
    it('restituisce false quando overlap è appena sotto la soglia', () => {
      // Target: 100 px. Sagoma: 54 px (54% < 55%)
      const targetPixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 10 },
      ]);
      const piecePixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 5 },
        { x: 0, y: 5, w: 4, h: 1 },
      ]); // 50 + 4 = 54 px
      const factory = createMockCanvasFactory([targetPixels, piecePixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(false);
    });

    it('restituisce false quando overlap è significativamente sotto la soglia', () => {
      // Target: 100 px. Sagoma: 30 px (30%)
      const targetPixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 10 },
      ]);
      const piecePixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 3 },
      ]);
      const factory = createMockCanvasFactory([targetPixels, piecePixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(false);
    });
  });

  // ── Sagome totalmente fuori (RF-20) ───────────────────────────────────

  describe('sagome totalmente fuori (RF-20)', () => {
    it('restituisce false quando la sagoma non ha alcun pixel sovrapposto', () => {
      // Target in alto a sinistra, sagoma in basso a destra
      const targetPixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 30, h: 30 },
      ]);
      const piecePixels = createPixelData(SIZE, [
        { x: 90, y: 90, w: 30, h: 30 },
      ]);
      const factory = createMockCanvasFactory([targetPixels, piecePixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(false);
    });

    it('restituisce false quando la sagoma è completamente fuori dal canvas', () => {
      // Target al centro, sagoma vuota (nessun pixel)
      const targetPixels = createPixelData(SIZE, [
        { x: 40, y: 40, w: 40, h: 40 },
      ]);
      const emptyPixels = new Uint8ClampedArray(SIZE * SIZE * 4);
      const factory = createMockCanvasFactory([targetPixels, emptyPixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(false);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('restituisce false quando il target non ha pixel opachi', () => {
      const emptyPixels = new Uint8ClampedArray(SIZE * SIZE * 4);
      const piecePixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 50, h: 50 },
      ]);
      const factory = createMockCanvasFactory([emptyPixels, piecePixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(false);
    });

    it('restituisce false quando entrambi sono vuoti', () => {
      const emptyPixels = new Uint8ClampedArray(SIZE * SIZE * 4);
      const factory = createMockCanvasFactory([emptyPixels, emptyPixels]);
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(false);
    });

    it('funziona con transform non identità', () => {
      const pixels = createPixelData(SIZE, [{ x: 10, y: 10, w: 50, h: 50 }]);
      const factory = createMockCanvasFactory([pixels, pixels]);
      const releaseTransform: CanvasTransform = {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 15.5,
        f: -3.2,
      };
      expect(
        evaluateSnap(DUMMY_PATH, releaseTransform, TEST_BBOX, factory),
      ).toBe(true);
    });

    it('la sagoma più grande del target non influenza il risultato', () => {
      // Target: 100 px. Sagoma: 200 px totali, 100 dentro target
      const targetPixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 10, h: 10 },
      ]);
      const piecePixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 20, h: 10 },
      ]);
      const factory = createMockCanvasFactory([targetPixels, piecePixels]);
      // overlap = 100/100 = 1.0 ≥ 0.55
      expect(
        evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, factory),
      ).toBe(true);
    });
  });

  // ── Coerenza con tuning.ts ────────────────────────────────────────────

  describe('coerenza con parametri di tuning', () => {
    it('usa MIN_OVERLAP_RATIO da tuning.ts', () => {
      expect(MIN_RATIO).toBe(0.55);
    });

    it('usa SNAP_RASTER_SIZE da tuning.ts', () => {
      expect(SIZE).toBe(128);
    });
  });

  // ── CanvasFactory iniettato ───────────────────────────────────────────

  describe('canvas factory iniettabile', () => {
    it('il factory viene chiamato due volte (target + sagoma)', () => {
      let callCount = 0;
      const pixels = createPixelData(SIZE, [
        { x: 0, y: 0, w: 50, h: 50 },
      ]);
      const countingFactory: CanvasFactory = (
        width: number,
        height: number,
      ): CanvasElementLike => {
        callCount++;
        return {
          width,
          height,
          getContext(): CanvasContext2DLike {
            return {
              setTransform: noop,
              clearRect: noop,
              fill: noop,
              getImageData: () => ({ data: pixels, width, height }),
            };
          },
        };
      };
      evaluateSnap(DUMMY_PATH, IDENTITY_TRANSFORM, TEST_BBOX, countingFactory);
      expect(callCount).toBe(2);
    });
  });
});