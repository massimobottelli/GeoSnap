import { describe, expect, it } from 'vitest';

import { tuning } from '../../src/tuning';

/**
 * Smoke test di infrastruttura (Fase 0, Task 0.2).
 *
 * Verifica che Vitest sia configurato e operativo sul codice sorgente di
 * `src/**` e che il contratto di base di `tuning.ts` (oggetto immutabile
 * esportato) sia rispettato. La logica di gioco verrà testata nelle fasi
 * successive.
 */
describe('tuning (scheletro)', () => {
  it('esporta un oggetto', () => {
    expect(typeof tuning).toBe('object');
    expect(tuning).not.toBeNull();
  });

  it('è immutabile (frozen)', () => {
    expect(Object.isFrozen(tuning)).toBe(true);
  });
});
