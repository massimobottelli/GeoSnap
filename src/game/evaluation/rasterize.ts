/**
 * GeoSnap — rasterizzazione SVG path su canvas offscreen.
 *
 * Isola tutta l'accesso al Canvas 2D API dietro un'interfaccia iniettabile
 * (`CanvasFactory`), così che i test possano sostituire il canvas reale
 * con un mock che restituisce pixel preconfigurati.
 *
 * Riferimento: §6 dei Requisiti Tecnici MVP1.
 *
 * Principi:
 * - Funzione pura: dato lo stesso input produce lo stesso output.
 * - Nessuna dipendenza da React o DOM diretto: il canvas è iniettato.
 * - La risoluzione di rasterizzazione (`size`) è parametrica
 *   (default da `tuning.ts` tramite `snap.ts`).
 */

// ── Tipi esportati ─────────────────────────────────────────────────────────

/** Bounding box: [x, y, width, height] in unità viewBox SVG. */
export type BBox = readonly [number, number, number, number];

/**
 * Matrice di trasformazione affine 2D (compatibile con SVGMatrix / DOMMatrix).
 *
 * Rappresenta la trasformazione:
 *   x' = a·x + c·y + e
 *   y' = b·x + d·y + f
 */
export interface CanvasTransform {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}

/** Identità: nessuna trasformazione. */
export const IDENTITY_TRANSFORM: CanvasTransform = Object.freeze({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
});

/** Interfaccia minima per il contesto 2D di un canvas. */
export interface CanvasContext2DLike {
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  fill(fillRuleOrPath?: unknown): void;
  getImageData(
    sx: number,
    sy: number,
    sw: number,
    sh: number,
  ): { data: Uint8ClampedArray; width: number; height: number };
}

/** Interfaccia minima per un elemento canvas. */
export interface CanvasElementLike {
  readonly width: number;
  readonly height: number;
  getContext(id: '2d'): CanvasContext2DLike | null;
}

/**
 * Factory per creare canvas di dimensioni specifiche.
 *
 * In produzione: `document.createElement('canvas')` o `OffscreenCanvas`.
 * In test: mock che restituisce pixel preconfigurati.
 */
export type CanvasFactory = (width: number, height: number) => CanvasElementLike;

// ── Funzione principale ────────────────────────────────────────────────────

/**
 * Rasterizza un SVG path su un canvas offscreen di dimensioni `size × size`,
 * mappando il `targetBBox` nell'intero canvas.
 *
 * Se `transform` è fornito, viene composto con il viewport transform
 * (usato per la sagoma trascinata che è stata spostata dalla posizione
 * di riferimento).
 *
 * @param pathD - Stringa SVG path da rasterizzare.
 * @param transform - Trasformazione aggiuntiva (rilascio della sagoma), o `null`.
 * @param targetBBox - Bounding box della nazione target (spazio viewBox).
 * @param size - Risoluzione del canvas (default: usato da snap.ts).
 * @param canvasFactory - Factory per creare il canvas (iniettabile per test).
 * @returns Array di byte RGBA dei pixel del canvas (lunghezza: size × size × 4).
 */
export function rasterizePath(
  pathD: string,
  transform: CanvasTransform | null,
  targetBBox: BBox,
  size: number,
  canvasFactory: CanvasFactory,
): Uint8ClampedArray {
  const canvas = canvasFactory(size, size);
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error('Canvas 2D context not available');
  }

  // Viewport transform: mappa targetBBox → [0, 0, size, size]
  const [bx, by, bw, bh] = targetBBox;
  const maxDim = Math.max(bw, bh);
  if (maxDim === 0) {
    throw new Error('targetBBox has zero dimensions');
  }
  const scale = size / maxDim;
  const txVp = -bx * scale;
  const tyVp = -by * scale;

  // Pulisci il canvas
  ctx.clearRect(0, 0, size, size);

  // Applica la trasformazione composta: viewport × transform (se presente)
  if (transform !== null) {
    // Composizione: viewport(scale, translate) ∘ transform(a,b,c,d,e,f)
    // x' = scale · (a·x + c·y + e) + txVp = (a·scale)·x + (c·scale)·y + (e·scale + txVp)
    ctx.setTransform(
      transform.a * scale,
      transform.b * scale,
      transform.c * scale,
      transform.d * scale,
      transform.e * scale + txVp,
      transform.f * scale + tyVp,
    );
  } else {
    ctx.setTransform(scale, 0, 0, scale, txVp, tyVp);
  }

  // Disegna il path SVG
  // In ambiente browser: usa Path2D (disponibile globalmente).
  // In test con mock factory: fill() è un no-op e restituisce pixel preconfigurati.
  if (typeof Path2D !== 'undefined') {
    const path = new Path2D(pathD);
    ctx.fill(path);
  } else {
    // Ambiente di test/mock: il canvas factory gestisce il rendering.
    ctx.fill();
  }

  return ctx.getImageData(0, 0, size, size).data;
}
