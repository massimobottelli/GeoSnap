/**
 * GeoSnap — elenco nazioni europee per MVP1 (Fase 1, Task 1.1).
 *
 * Sorgente di verità per la classificazione delle nazioni e i nomi italiani.
 * I dati geometrici (path SVG, bbox, centroid, area) vivono in
 * `europe-shapes.json`, generato da `scripts/generate-map.mjs`.
 *
 * Classificazione (coerente con RF-05/06/07 e Appendice A dei requisiti tecnici):
 * - playable (36): nazioni europee giocabili
 * - microstate (7): esclusi dal gioco, renderizzati grigi non interattivi
 * - nonInteractive (5): territori ambigui/speciali, renderizzati grigi
 *
 * NOTA: 6 microstati (Andorra, Città del Vaticano, Liechtenstein, Malta,
 * Monaco, San Marino) sono troppo piccoli per la risoluzione 110m di
 * Natural Earth e NON hanno geometrie nel JSON generato. Questo è
 * accettabile: a quella scala non sono visibili sulla mappa (RF-06).
 */

// ── Tipi ────────────────────────────────────────────────────────────────────

export type NationGroup = 'playable' | 'microstate' | 'nonInteractive';

export interface NationMeta {
  readonly id: string; // ISO 3166-1 alpha-3
  readonly nameIt: string; // nome italiano ufficiale
  readonly group: NationGroup;
}

// ── Dati ────────────────────────────────────────────────────────────────────

/**
 * Registro completo delle nazioni europee per MVP1.
 * La chiave è il codice ISO 3166-1 alpha-3.
 */
export const NATIONS: Readonly<Record<string, NationMeta>> = Object.freeze({
  // ── Giocabili (36) ─────────────────────────────────────────────────────
  ALB: { id: 'ALB', nameIt: 'Albania', group: 'playable' },
  AUT: { id: 'AUT', nameIt: 'Austria', group: 'playable' },
  BEL: { id: 'BEL', nameIt: 'Belgio', group: 'playable' },
  BLR: { id: 'BLR', nameIt: 'Bielorussia', group: 'playable' },
  BIH: { id: 'BIH', nameIt: 'Bosnia-Erzegovina', group: 'playable' },
  BGR: { id: 'BGR', nameIt: 'Bulgaria', group: 'playable' },
  HRV: { id: 'HRV', nameIt: 'Croazia', group: 'playable' },
  DNK: { id: 'DNK', nameIt: 'Danimarca', group: 'playable' },
  EST: { id: 'EST', nameIt: 'Estonia', group: 'playable' },
  FIN: { id: 'FIN', nameIt: 'Finlandia', group: 'playable' },
  FRA: { id: 'FRA', nameIt: 'Francia', group: 'playable' },
  DEU: { id: 'DEU', nameIt: 'Germania', group: 'playable' },
  GRC: { id: 'GRC', nameIt: 'Grecia', group: 'playable' },
  IRL: { id: 'IRL', nameIt: 'Irlanda', group: 'playable' },
  ISL: { id: 'ISL', nameIt: 'Islanda', group: 'playable' },
  ITA: { id: 'ITA', nameIt: 'Italia', group: 'playable' },
  LVA: { id: 'LVA', nameIt: 'Lettonia', group: 'playable' },
  LTU: { id: 'LTU', nameIt: 'Lituania', group: 'playable' },
  MKD: { id: 'MKD', nameIt: 'Macedonia del Nord', group: 'playable' },
  MDA: { id: 'MDA', nameIt: 'Moldavia', group: 'playable' },
  MNE: { id: 'MNE', nameIt: 'Montenegro', group: 'playable' },
  NOR: { id: 'NOR', nameIt: 'Norvegia', group: 'playable' },
  NLD: { id: 'NLD', nameIt: 'Paesi Bassi', group: 'playable' },
  POL: { id: 'POL', nameIt: 'Polonia', group: 'playable' },
  PRT: { id: 'PRT', nameIt: 'Portogallo', group: 'playable' },
  GBR: { id: 'GBR', nameIt: 'Regno Unito', group: 'playable' },
  CZE: { id: 'CZE', nameIt: 'Repubblica Ceca', group: 'playable' },
  ROU: { id: 'ROU', nameIt: 'Romania', group: 'playable' },
  SRB: { id: 'SRB', nameIt: 'Serbia', group: 'playable' },
  SVK: { id: 'SVK', nameIt: 'Slovacchia', group: 'playable' },
  SVN: { id: 'SVN', nameIt: 'Slovenia', group: 'playable' },
  ESP: { id: 'ESP', nameIt: 'Spagna', group: 'playable' },
  SWE: { id: 'SWE', nameIt: 'Svezia', group: 'playable' },
  CHE: { id: 'CHE', nameIt: 'Svizzera', group: 'playable' },
  UKR: { id: 'UKR', nameIt: 'Ucraina', group: 'playable' },
  HUN: { id: 'HUN', nameIt: 'Ungheria', group: 'playable' },

  // ── Microstati (7) — non giocabili, grigi non interattivi ──────────────
  AND: { id: 'AND', nameIt: 'Andorra', group: 'microstate' },
  VAT: { id: 'VAT', nameIt: 'Città del Vaticano', group: 'microstate' },
  LIE: { id: 'LIE', nameIt: 'Liechtenstein', group: 'microstate' },
  LUX: { id: 'LUX', nameIt: 'Lussemburgo', group: 'microstate' },
  MLT: { id: 'MLT', nameIt: 'Malta', group: 'microstate' },
  MCO: { id: 'MCO', nameIt: 'Monaco', group: 'microstate' },
  SMR: { id: 'SMR', nameIt: 'San Marino', group: 'microstate' },

  // ── Territori ambigui/speciali (5) — non giocabili, grigi ──────────────
  CYP: { id: 'CYP', nameIt: 'Cipro', group: 'nonInteractive' },
  KOS: { id: 'KOS', nameIt: 'Kosovo', group: 'nonInteractive' },
  GRL: { id: 'GRL', nameIt: 'Groenlandia', group: 'nonInteractive' },
  RUS: { id: 'RUS', nameIt: 'Russia', group: 'nonInteractive' },
  TUR: { id: 'TUR', nameIt: 'Turchia', group: 'nonInteractive' },
} as const);

// ── Helper functions ────────────────────────────────────────────────────────

/** Restituisce gli ID delle nazioni di un dato gruppo. */
export function getNationIdsByGroup(group: NationGroup): readonly string[] {
  return Object.values(NATIONS)
    .filter((n) => n.group === group)
    .map((n) => n.id);
}

/** Restituisce gli ID delle nazioni giocabili (36). */
export function getPlayableIds(): readonly string[] {
  return getNationIdsByGroup('playable');
}

/** Restituisce gli ID dei microstati (7). */
export function getMicrostateIds(): readonly string[] {
  return getNationIdsByGroup('microstate');
}

/** Restituisce gli ID dei territori non interattivi (5). */
export function getNonInteractiveIds(): readonly string[] {
  return getNationIdsByGroup('nonInteractive');
}

/** Restituisce il nome italiano di una nazione, o undefined se non trovata. */
export function getNationNameIt(id: string): string | undefined {
  return NATIONS[id]?.nameIt;
}

/** Verifica se una nazione è giocabile. */
export function isPlayable(id: string): boolean {
  return NATIONS[id]?.group === 'playable';
}
