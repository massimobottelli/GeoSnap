import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Test sul file generato `europe-shapes.json` (Fase 1, Task 1.2).
 *
 * Verifica la struttura del JSON, i conteggi delle nazioni e la validità
 * dei dati geometrici (viewBox, bbox, centroid, area, pathD).
 */

const shapesPath = resolve(__dirname, '../../src/data/europe-shapes.json');
const shapes = JSON.parse(readFileSync(shapesPath, 'utf-8')) as {
  projection: string;
  viewBox: number[];
  countries: Record<
    string,
    {
      name: string;
      playable: boolean;
      pathD: string;
      bbox: [number, number, number, number];
      centroid: [number, number];
      area: number;
    }
  >;
};

const countryEntries = Object.entries(shapes.countries);
const playableEntries = countryEntries.filter(([, c]) => c.playable);
const nonPlayableEntries = countryEntries.filter(([, c]) => !c.playable);

describe('europe-shapes.json — dati geografici generati (Fase 1, Task 1.2)', () => {
  // ── Struttura generale ─────────────────────────────────────────────────

  it('ha projection, viewBox e countries', () => {
    expect(shapes.projection).toBe('EqualEarth');
    expect(shapes.viewBox).toHaveLength(4);
    expect(shapes.countries).toBeDefined();
    expect(typeof shapes.countries).toBe('object');
  });

  // ── Conteggi ───────────────────────────────────────────────────────────

  it('contiene almeno 40 nazioni totali (target ~42)', () => {
    expect(countryEntries.length).toBeGreaterThanOrEqual(40);
  });

  it('contiene esattamente 36 nazioni giocabili', () => {
    expect(playableEntries).toHaveLength(36);
  });

  it('contiene almeno 5 nazioni non giocabili', () => {
    expect(nonPlayableEntries.length).toBeGreaterThanOrEqual(5);
  });

  // ── viewBox ────────────────────────────────────────────────────────────

  it('viewBox ha dimensioni positive', () => {
    const [, , w, h] = shapes.viewBox;
    expect(w).toBeGreaterThan(100);
    expect(h).toBeGreaterThan(100);
  });

  // ── Dati per nazione ───────────────────────────────────────────────────

  it('ogni nazione ha name, playable, pathD, bbox, centroid, area', () => {
    for (const [id, c] of countryEntries) {
      expect(c.name, `${id}: name mancante`).toBeTruthy();
      expect(typeof c.playable, `${id}: playable non boolean`).toBe('boolean');
      expect(c.pathD, `${id}: pathD mancante`).toBeTruthy();
      expect(c.pathD.startsWith('M'), `${id}: pathD non inizia con M`).toBe(true);
      expect(c.bbox, `${id}: bbox mancante`).toHaveLength(4);
      expect(c.centroid, `${id}: centroid mancante`).toHaveLength(2);
      expect(typeof c.area, `${id}: area non number`).toBe('number');
    }
  });

  it('ogni pathD è una stringa SVG valida (inizia con M, termina con Z)', () => {
    for (const [id, c] of countryEntries) {
      expect(c.pathD, `${id}: pathD vuoto`).toBeTruthy();
      // I path SVG validi iniziano con M e contengono almeno una Z
      expect(c.pathD).toMatch(/^M/);
      expect(c.pathD).toContain('Z');
    }
  });

  it('bbox ha larghezza e altezza positive', () => {
    for (const [id, c] of countryEntries) {
      const [, , w, h] = c.bbox;
      expect(w, `${id}: bbox width <= 0`).toBeGreaterThan(0);
      expect(h, `${id}: bbox height <= 0`).toBeGreaterThan(0);
    }
  });

  it('area è positiva per ogni nazione', () => {
    for (const [id, c] of countryEntries) {
      expect(c.area, `${id}: area <= 0`).toBeGreaterThan(0);
    }
  });

  // ── Nomi italiani ──────────────────────────────────────────────────────

  it('i nomi delle giocabili corrispondono ai nomi italiani attesi', () => {
    const { countries } = shapes;
    expect(countries.ITA?.name).toBe('Italia');
    expect(countries.FRA?.name).toBe('Francia');
    expect(countries.DEU?.name).toBe('Germania');
    expect(countries.ESP?.name).toBe('Spagna');
    expect(countries.GBR?.name).toBe('Regno Unito');
    expect(countries.CZE?.name).toBe('Repubblica Ceca');
  });

  // ── Contenuto non giocabile ────────────────────────────────────────────

  it('Russia, Turchia, Groenlandia sono non giocabili', () => {
    const { countries } = shapes;
    expect(countries.RUS?.playable).toBe(false);
    expect(countries.TUR?.playable).toBe(false);
    expect(countries.GRL?.playable).toBe(false);
  });

  it('Kosovo e Cipro sono non giocabili', () => {
    const { countries } = shapes;
    expect(countries.KOS?.playable).toBe(false);
    expect(countries.CYP?.playable).toBe(false);
  });

  // ── Dimensione file ────────────────────────────────────────────────────

  it('il file JSON è inferiore a 150 KB (target tecnico)', () => {
    const json = readFileSync(shapesPath, 'utf-8');
    const sizeKB = Buffer.byteLength(json) / 1024;
    expect(sizeKB).toBeLessThan(150);
  });

  // ── Anti-regressione territori d'oltremare ─────────────────────────────

  it("Francia non include territori d'oltremare (Guyana, bbox x > 250)", () => {
    const fra = shapes.countries.FRA;
    expect(fra).toBeDefined();
    if (!fra) return; // type narrowing
    // La Francia metropolitana è ad est della Spagna (x≈500+).
    // La Guyana francese era a x≈131 prima del fix.
    expect(fra.bbox[0]).toBeGreaterThan(250);
  });

  it('Russia non include territori siberiani (area < 10.000 unità²)', () => {
    const rus = shapes.countries.RUS;
    expect(rus).toBeDefined();
    if (!rus) return; // type narrowing
    // La Russia europea ha area ~3800; la Russia intera era ~116000.
    expect(rus.area).toBeLessThan(10_000);
    expect(rus.area).toBeGreaterThan(1000);
  });

  // ── Codici ISO ─────────────────────────────────────────────────────────

  it('ogni chiave è un codice alpha-3 di 3 lettere maiuscole', () => {
    for (const id of Object.keys(shapes.countries)) {
      expect(id, `chiave non valida: ${id}`).toMatch(/^[A-Z]{3}$/);
    }
  });
});
