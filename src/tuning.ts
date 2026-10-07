/**
 * GeoSnap — parametri di tuning centralizzati.
 *
 * Tutti i valori calibrabili dell'applicazione vivono qui, in un unico punto,
 * così che nessun "magic number" compaia nei componenti o nella logica di gioco.
 *
 * Riferimento: §10 dei Requisiti Tecnici MVP1.
 */

export const tuning = Object.freeze({
  /** Parametri per la valutazione dello snap (§6, RF-19). */
  snap: Object.freeze({
    MIN_OVERLAP_RATIO: 0.55, // soglia di aggancio
    SNAP_RASTER_SIZE: 128, // risoluzione rasterizzazione (px)
  }),

  /** Scala punti per tentativi falliti (§8.2, RF-23). */
  scoring: Object.freeze({
    ATTEMPT_SCORES: Object.freeze([100, 50, 25, 0] as const), // index = tentativi falliti
  }),

  /** Parametri del vassoio (§5.2, RF-11). */
  tray: Object.freeze({
    MIN_HIT_SIZE_PX: 44, // standard touch Apple/Google
    SCALE_MIN: 0.35, // scala min sagoma nel vassoio
    SCALE_MAX: 1.0, // scala max sagoma nel vassoio
    SCALE_CURVE: 0.6, // esponente della compressione proporzionale
  }),

  /** Parametri della mappa (§5.1). */
  map: Object.freeze({
    ZOOM_MIN: 1.0,
    ZOOM_MAX: 6.0,
    LABEL_FONT_MIN: 8, // unità viewBox
    LABEL_FONT_MAX: 20, // unità viewBox
  }),

  /** Durate animazioni (§9.4). */
  anim: Object.freeze({
    PICKUP_MS: 150,
    SNAP_MS: 250,
    RETURN_MS: 300,
  }),
} as const);

export type Tuning = typeof tuning;
