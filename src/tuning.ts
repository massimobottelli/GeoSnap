/**
 * GeoSnap — parametri di tuning centralizzati (clinerules §9).
 *
 * Tutti i valori calibrabili dell'applicazione vivono qui, in un unico punto,
 * così che nessun "magic number" compaia nei componenti o nella logica di gioco.
 *
 * FASE 0: questo file esiste come parte dello scheletro. I valori concreti
 * (snap, scoring, tray, map, anim) vengono introdotti nella Fase 2 (Task 2.1).
 * Non aggiungere valori altrove: qualunque costante calibrabile appartiene qui.
 */
export const tuning = Object.freeze({});

export type Tuning = typeof tuning;
