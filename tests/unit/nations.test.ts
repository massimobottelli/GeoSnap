import { describe, expect, it } from 'vitest';
import {
  NATIONS,
  getPlayableIds,
  getMicrostateIds,
  getNonInteractiveIds,
  getNationIdsByGroup,
  getNationNameIt,
  isPlayable,
} from '../../src/data/nations';

describe('nations.ts — elenco nazioni europee (Fase 1, Task 1.1)', () => {
  // ── Conteggi ───────────────────────────────────────────────────────────

  it('contiene esattamente 48 nazioni totali', () => {
    expect(Object.keys(NATIONS)).toHaveLength(48);
  });

  it('contiene 36 nazioni giocabili', () => {
    expect(getPlayableIds()).toHaveLength(36);
  });

  it('contiene 7 microstati', () => {
    expect(getMicrostateIds()).toHaveLength(7);
  });

  it('contiene 5 territori non interattivi', () => {
    expect(getNonInteractiveIds()).toHaveLength(5);
  });

  // ── Coerenza ───────────────────────────────────────────────────────────

  it('ogni ID appartiene a uno e un solo gruppo', () => {
    const playable = new Set(getPlayableIds());
    const micro = new Set(getMicrostateIds());
    const nonInt = new Set(getNonInteractiveIds());

    for (const id of playable) {
      expect(micro.has(id)).toBe(false);
      expect(nonInt.has(id)).toBe(false);
    }
    for (const id of micro) {
      expect(nonInt.has(id)).toBe(false);
    }
  });

  it('la somma dei gruppi è uguale al totale', () => {
    const total =
      getPlayableIds().length + getMicrostateIds().length + getNonInteractiveIds().length;
    expect(total).toBe(Object.keys(NATIONS).length);
  });

  // ── Nomi ───────────────────────────────────────────────────────────────

  it('ogni nazione ha un nome italiano non vuoto', () => {
    for (const [id, nation] of Object.entries(NATIONS)) {
      expect(nation.nameIt, `nome mancante per ${id}`).toBeTruthy();
      expect(nation.nameIt.length, `nome troppo corto per ${id}`).toBeGreaterThan(2);
    }
  });

  // ── Codici ISO ─────────────────────────────────────────────────────────

  it('ogni ID è un codice alpha-3 di 3 lettere maiuscole', () => {
    for (const id of Object.keys(NATIONS)) {
      expect(id, `ID non valido: ${id}`).toMatch(/^[A-Z]{3}$/);
    }
  });

  // ── Helper functions ───────────────────────────────────────────────────

  it('getNationNameIt restituisce il nome corretto', () => {
    expect(getNationNameIt('ITA')).toBe('Italia');
    expect(getNationNameIt('DEU')).toBe('Germania');
    expect(getNationNameIt('FRA')).toBe('Francia');
  });

  it('getNationNameIt restituisce undefined per ID sconosciuto', () => {
    expect(getNationNameIt('XYZ')).toBeUndefined();
  });

  it('isPlayable restituisce true per le giocabili', () => {
    expect(isPlayable('ITA')).toBe(true);
    expect(isPlayable('FRA')).toBe(true);
    expect(isPlayable('GBR')).toBe(true);
  });

  it('isPlayable restituisce false per microstati e non interattivi', () => {
    expect(isPlayable('LUX')).toBe(false);
    expect(isPlayable('RUS')).toBe(false);
    expect(isPlayable('KOS')).toBe(false);
  });

  it('getNationIdsByGroup restituisce gli stessi risultati degli helper specifici', () => {
    expect(getNationIdsByGroup('playable')).toEqual(getPlayableIds());
    expect(getNationIdsByGroup('microstate')).toEqual(getMicrostateIds());
    expect(getNationIdsByGroup('nonInteractive')).toEqual(getNonInteractiveIds());
  });

  // ── Contenuto atteso ───────────────────────────────────────────────────

  it("le giocabili includono le nazioni chiave dell'Appendice A", () => {
    const playable = getPlayableIds();
    const expected = ['ITA', 'FRA', 'DEU', 'ESP', 'GBR', 'POL', 'ROU', 'NOR', 'SWE', 'FIN'];
    for (const id of expected) {
      expect(playable).toContain(id);
    }
  });

  it("i microstati sono quelli dell'Appendice A", () => {
    const micro = getMicrostateIds();
    expect(micro).toContain('AND');
    expect(micro).toContain('VAT');
    expect(micro).toContain('LIE');
    expect(micro).toContain('LUX');
    expect(micro).toContain('MLT');
    expect(micro).toContain('MCO');
    expect(micro).toContain('SMR');
  });

  it("i non interattivi sono quelli dell'Appendice A", () => {
    const nonInt = getNonInteractiveIds();
    expect(nonInt).toContain('CYP');
    expect(nonInt).toContain('KOS');
    expect(nonInt).toContain('GRL');
    expect(nonInt).toContain('RUS');
    expect(nonInt).toContain('TUR');
  });
});
