
# GeoSnap — Piano di Implementazione MVP1

**Versione:** 1.1 (Completo e Consolidato)

**Input:** Requisiti Funzionali v1.0 + Requisiti Tecnici v1.0

**Destinazione d'uso:** Guida operativa per AI coding agent — fase per fase, task per task

---

## 0. Principi guida per l'agente (vincolanti per TUTTI i task)

1. **Separazione logica/DOM:** Ogni decisione di gioco (punteggio, shuffle, snap, fine partita) vive in `src/game/` come funzioni pure tipizzate; i componenti React si occupano esclusivamente di rendering e traduzione degli eventi DOM.


2. **Drag imperativo con commit al rilascio:** Durante il movimento del dito si manipola direttamente l'attributo `transform` via ref; **zero `setState` nel loop di drag**. Lo stato React si aggiorna una sola volta al `pointerup`.


3. **Nessun numero magico:** Ogni costante calibrabile risiede in `src/tuning.ts`.


4. **Dati generati immutabili:** `europe-shapes.json` non si modifica mai a mano; si rigenera mediante `node scripts/generate-map.mjs`.


5. **Stato immutabile stile reducer:** Nessuna variabile di modulo mutabile in `src/game/`.


6. **Vincolo di import:** `src/game/**` importa solo da `src/game/**`, `src/data/**` e `src/tuning.ts`. Vietato React/DOM in `src/game/**` (unica eccezione: `rasterize.ts`).


7. **Regola di completamento task:** Un task è completato solo quando `tsc --noEmit`, `eslint` e `vitest` (o `playwright` dove indicato) passano tutti senza errori. Un commit atomico per task.
8. **Lingue e accessibilità:** UI in italiano; identificatori di codice in inglese; nessun `any`. Mantenere sempre un canale visuale non cromatico per gli elementi di stato (accessibilità daltonici).



---

## Fase 0 — Setup del progetto e infrastruttura

> **Obiettivo:** Scheletro compilabile con toolchain completa e ambienti di test operativi.

### Task 0.1 — Scaffold e toolchain

* Creare il progetto Vite + React 18+ + TypeScript **strict mode**.


* Installare Tailwind CSS (v4) con CSS variables per il tema (nessuna component library esterna).


* Configurare ESLint (`typescript-eslint`, strict) + Prettier con configurazione nel repo.


* Creare l'albero delle directory:


```
src/
├── data/           # europe-shapes.json, nations.ts
├── game/           # tipi, shuffle, scoring, gameState, evaluation/
├── components/     # App, GameScreen, MapView, Tray, TrayItem, DragLayer, HUD, SummaryScreen
├── hooks/          # useMapZoom, usePieceDrag
├── styles/         # theme.css
└── tuning.ts
scripts/            # generate-map.mjs
tests/              # unit/, e2e/

```


* Script npm: `dev`, `build`, `lint`, `test`, `test:e2e`, `typecheck`, `gen:map`.
* Dipendenze runtime consentite: `react`, `react-dom`, `d3-zoom` (+ `@types/d3-zoom`).



### Task 0.2 — Infrastruttura di test

* Configurare **Vitest** per i test unitari della logica pura (`src/game/`).


* Configurare **Playwright** con viewport mobile (es. 390×844, emulazione touch `hasTouch: true`).


* Creare uno smoke test e2e per verificare il caricamento dell'applicazione.



---

## Fase 1 — Dati geografici e perimetro nazioni

> **Obiettivo:** Elenco nazioni consolidato e pipeline di generazione `europe-shapes.json`.

### Task 1.1 — Congelamento elenco nazioni (`nations.ts`)

* Mantenere una lista unica tipizzata classificata in tre gruppi coerenti:


1. `playable` (36 nazioni): paesi europei geograficamente e politicamente non ambigui.


2. `microstates` (7 nazioni): Andorra, San Marino, Città del Vaticano, Monaco, Liechtenstein, Malta, Lussemburgo (esclusi dal gioco, renderizzati in grigio).


3. `nonInteractive` (3 territori): Kosovo, Cipro, Groenlandia, Russia, Turchia (territori ambigui/speciali, renderizzati in grigio).




* Tabella di mappatura fissa ISO 3166-1 alpha-3 → `nameIt` (nomi ufficiali in italiano).



### Task 1.2 — Pipeline `scripts/generate-map.mjs`

* Implementare la pipeline build-time:


1. Input: `world-atlas/countries-110m.json`.


2. Proiezione: `d3.geoEqualEarth()`.


3. Semplificazione geometrica via `mapshaper` per ottenere un file totale < 500 KB (path singolo < 10 KB).


4. Mappatura dei nomi italiani da `nations.ts`.


5. Emissione di `src/data/europe-shapes.json` contenente `viewBox`, `bbox`, `centroid`, `area` e `pathD`.





---

## Fase 2 — Core della logica pura (`src/game/`)

> **Obiettivo:** Moduli di gioco testabili con Vitest senza dipendenze dal DOM.
> 
> 

### Task 2.1 — Tipi di dominio (`types.ts`) e parametri (`tuning.ts`)

* Definire `types.ts`: `NationId`, `Nation`, `NationState`, `GameState`.


* Centralizzare tutti i parametri calibrabili in `tuning.ts`:


* `SNAP_RASTER_SIZE`: 128


* `MIN_OVERLAP_RATIO`: 0.55


* `ATTEMPT_SCORES`: `[100, 50, 25, 0]`

* `MIN_HIT_SIZE_PX`: 44


* `ZOOM_MIN`: 1.0, `ZOOM_MAX`: 6.0


* `ANIM_MS`: `{ PICKUP: 150, SNAP: 250, RETURN: 300 }`




### Task 2.2 — Shuffle (`shuffle.ts`) e Punteggio (`scoring.ts`)

* Implementare `shuffleNationIds(ids, seed?)` con algoritmo Fisher-Yates (supporto seed per i test).


* Implementare `scoreForAttempt(attempts)` in base a `ATTEMPT_SCORES`.


* Calcolo del punteggio massimo teorico e della percentuale di precisione (primo tentativo) per la schermata finale.



### Task 2.3 — Gestione dello stato di gioco (`gameState.ts`)

* Reducer puro per le azioni di gioco:


* `startGame`: genera l'ordine casuale del vassoio e imposta `startedAt` (epoch ms).


* `registerPlace`: marca la nazione come posizionata, calcola i punti e rimuove il pezzo dal vassoio.


* `registerFail`: incrementa il contatore `attempts` della nazione e lascia il pezzo nel vassoio.


* `finishGame`: imposta `finishedAt` quando `remaining === 0`.




* Garantire che la partita sia sempre completabile (nessun game over).



---

## Fase 3 — Valutazione dello Snap

> **Obiettivo:** Algoritmo di aggancio basato su overlap di area.
> 
> 

### Task 3.1 — `rasterize.ts` e `snap.ts`

* Implementare `evaluateSnap(pathD, releaseTransform, targetBBox, targetPathD)`:


1. Rasterizzare il target e la sagoma rilasciata su due canvas offscreen $128 \times 128$ px.


2. Calcolare la quota di sovrapposizione: $\text{overlap} = \frac{\text{pixel sovrapposti}}{\text{pixel target}}$.


3. Restituire `true` se $\text{overlap} \ge \text{MIN\_OVERLAP\_RATIO}$.




* Isolare l'API Canvas in `rasterize.ts` rendendola sostituibile nei test unitari.



---

## Fase 4 — Componenti UI e layout

> **Obiettivo:** Layout di gioco, rendering SVG e integrazione interazione touch.
> 
> 

### Task 4.1 — Tema ed stili globali (`theme.css`)

* Definire le variabili CSS per il tema chiaro e il colore di accento **verde lime** (`--color-accent`).


* Configurare i colori per lo stato "posizionata" con sufficiente contrasto e bordo distinto per gli utenti daltonici.



### Task 4.2 — Mappa interattiva (`MapView.tsx`) e Zoom/Pan (`useMapZoom.ts`)

* Renderizzare la mappa SVG con `viewBox` dinamico.


* Strato inferiore: territori non giocabili e microstati in grigio neutro (`pointer-events: none`).


* Strato superiore: nazioni posizionate con colore accent, nome centrato nel centroide (`<text>`).


* Integrare `d3-zoom` per pinch/pan in `useMapZoom.ts` (estensione zoom 1×–6×).


* **RF-22:** Disattivare gli eventi zoom/pan durante il trascinamento di una sagoma (`zoom.filter`).



### Task 4.3 — Vassoio scorrevole (`Tray.tsx`, `TrayItem.tsx`)

* Container orizzontale in basso con scroll nativo (`overflow-x: auto`, `touch-action: pan-x`) posizionato fuori dal contesto SVG zoomabile.


* Renderizzare ogni sagoma con scala proporzionale all'area e nome visibile sotto di essa.


* Garantire un'area di tocco trasparente (hit area) minima di $44 \times 44$ px centrata sulla sagoma (`MIN_HIT_SIZE_PX`).



### Task 4.4 — Layer di trascinamento (`DragLayer.tsx`) e Drag Hook (`usePieceDrag.ts`)

* Implementare `usePieceDrag.ts` basato su Pointer Events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`).


* All'inizio del drag, trasferire la sagoma nel `DragLayer` (SVG overlay a tutto schermo con `pointer-events: none`).


* Durante il movimento: aggiornare direttamente la matrice `transform` dell'elemento SVG tramite ref (nessun re-render React).


* Al rilascio (`pointerup`): eseguire `evaluateSnap`.
* Se corretto: eseguire l'animazione di aggancio e registrare il piazzamento.


* Se errato: eseguire l'animazione di ritorno al vassoio (~300 ms) e registrare l'errore.





### Task 4.5 — HUD (`HUD.tsx`) e Schermata di Riepilogo (`SummaryScreen.tsx`)

* `HUD.tsx`: visualizzare il contatore di avanzamento (es. "12/36 posizionate") e il punteggio corrente in tempo reale.


* `SummaryScreen.tsx`: mostrare a fine partita:


* Punteggio totale / Punteggio massimo teorico.


* Percentuale di precisione al primo tentativo.


* Tempo totale impiegato (formattato `mm:ss`, calcolato solo a partita conclusa).


* Elenco delle nazioni che hanno registrato errori.


* Pulsante "Gioca ancora" per riavviare con un nuovo rimescolamento casuale.





---

## Fase 5 — Integrazione e PWA

> **Obiettivo:** Assemblaggio dell'applicazione, offline PWA e ottimizzazione del bundle.

### Task 5.1 — Assemblaggio flusso principale (`App.tsx`, `GameScreen.tsx`)

* Unificare il flusso di gioco: avvio diretto senza onboarding.


* Transizione dallo stato di gioco attivo (`GameScreen`) alla schermata finale (`SummaryScreen`) al completamento dell'ultima nazione.



### Task 5.2 — Configurazione PWA e meta tag

* Creare `manifest.webmanifest` con nome "GeoSnap", colore di tema verde lime, orientation portrait e modalità standalone.


* Impostare il tag `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` per prevenire lo zoom indesiderato della pagina web su dispositivi mobili.



---

## Fase 6 — Testing e Calibrazione

> **Obiettivo:** Verifica della copertura dei test, accessibilità e calibrazione su dispositivi reali.
> 
> 

### Task 6.1 — Test unitari ed E2E completi

* Verificare la copertura dei test unitari su `src/game/**` ($\ge 90\%$).


* Eseguire i test E2E in Playwright:


1. Completamento di un piazzamento valido.


2. Gestione del tentativo errato e ripristino nel vassoio.


3. Flusso di fine partita e riavvio tramite "Gioca ancora".





### Task 6.2 — Calibrazione tuning ed accessibilità

* Validare il valore `MIN_OVERLAP_RATIO` (default 0.55) per garantire una sensazione di aggancio fluida ed equa.


* Verificare il contrasto dei colori (WCAG AA $\ge 4.5:1$) e la distinguibilità visiva sotto simulazione di daltonismo (protanopia/deuteranopia).



---

## Fase 7 — Build e Deploy

> **Obiettivo:** Pubblicazione su GitHub Pages.
> 
> 

### Task 7.1 — Build e GitHub Actions

* Configurare il workflow `.github/workflows/deploy.yml` per eseguire `npm run build` e distribuire la cartella staticamente generata (`dist/`) su GitHub Pages.


* Verificare che la dimensione totale del bundle compresso gzippato sia inferiore a 200 KB.



---

## Definizione di "Done" per MVP1

* [ ] Tutte le Fasi (0–7) completate ed eseguite con successo.


* [ ] Copertura test Vitest $\ge 90\%$ sui moduli in `src/game/**`.


* [ ] Test Playwright E2E superati in ambiente mobile emulato.


* [ ] Verifica del funzionamento offline e installabilità PWA su dispositivi mobili.


* [ ] Deploy automatico e funzionante su GitHub Pages.


* [ ] Tutti i 34 Requisiti Funzionali di MVP1 completamente rispettati e verificati.