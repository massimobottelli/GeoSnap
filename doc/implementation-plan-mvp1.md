
# GeoSnap — Piano di Implementazione MVP1

**Versione:** 1.3 (Fase 2 completata)

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

## Fase 0 — Setup del progetto e infrastruttura ✅ COMPLETATA

> **Obiettivo:** Scheletro compilabile con toolchain completa e ambienti di test operativi.
>
> **Stato:** **completata** il 2026-10-07 — vedi *Esito Fase 0* in coda a questa sezione.

### Task 0.1 — Scaffold e toolchain ✅

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



### Task 0.2 — Infrastruttura di test ✅

* Configurare **Vitest** per i test unitari della logica pura (`src/game/`).


* Configurare **Playwright** con viewport mobile (es. 390×844, emulazione touch `hasTouch: true`).


* Creare uno smoke test e2e per verificare il caricamento dell'applicazione.



### ✅ Esito Fase 0

**Data:** 2026-10-07 · **Ambiente verificato:** macOS 27.0.1 (arm64), Node v26.7.0, npm 11.19.0.

**Toolchain adottata (versioni verificate):**

| Area | Versione |
| --- | --- |
| Vite | 8.3.x + `@vitejs/plugin-react` 6.x |
| React / React DOM | 19.3.x |
| TypeScript (strict) | 5.9.3 — **vincolato `<6.1.0`** dalla peer-range di `typescript-eslint` 8.x |
| Tailwind CSS | 4.3.x (plugin `@tailwindcss/vite`, tema via `@theme`/CSS variables; nessuna component library) |
| Vitest | 5.x (ambiente `node`) |
| Playwright | 1.63.x (progetto mobile Chromium `Pixel 7`, `hasTouch: true`) |
| ESLint | 10.x (flat config, `typescript-eslint` `strict-type-checked` ridotto) |
| Prettier | 3.9.x |

Dipendenze runtime limitate a `react`, `react-dom`, `d3-zoom` (+ `@types/d3-zoom`), come da vincolo di stack.

**Deliverable prodotti:**

- Albero directory completo: `src/{data,game,game/evaluation,components,hooks,styles}`, `scripts/`, `tests/{unit,e2e}`.
- Script npm: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`, `gen:map`, `setup:macos`, `setup:linux`.
- **`scripts/setup-macos.sh`** e **`scripts/setup-linux.sh`**: setup idempotenti (verifica/installazione Node ≥ 20, `npm ci`/`install`, download browser Playwright, ed esecuzione delle verifiche di qualità; opzioni `--skip-verify`, `--skip-browsers`).
- Shell applicativa minima (`src/components/App.tsx`), entry point (`src/main.tsx`), tema chiaro lime (`src/styles/theme.css`), scheletro `src/tuning.ts`.
- Stub `scripts/generate-map.mjs` (la pipeline reale è il Task 1.2 — Fase 1).
- Configurazioni: `vite.config.ts` (base `/` in dev, `/GeoSnap/` in build), `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `.prettierrc.json`, `tsconfig.json`, `index.html`, `public/favicon.svg`.

**Verifica — criterio di uscita M0 («Build verde, app vuota»):**

- ✅ `npm run typecheck` — nessun errore
- ✅ `npm run lint` (`--max-warnings=0`) — nessun errore (11 file analizzati)
- ✅ `npm run test` — 2/2 test unitari verdi (smoke di infrastruttura)
- ✅ `npm run build` — build verde (`dist/`, bundle ~68.8 KB gzip)
- ✅ `npm run test:e2e` — 2/2 smoke test verdi (mobile Chromium, emulazione touch)
- ✅ `bash scripts/setup-macos.sh` — eseguito end-to-end con successo

**Note e limiti:**

- Il **deploy** su GitHub Pages **non** è parte di questa fase: la pipeline è la Fase 7 (Task 7.1).
- Nessuna modifica allo schema DB: MVP1 non prevede database né backend; non esistono dati di test da cancellare.
- Nessuna logica di gioco implementata (Fasi 2+ intatte): i moduli `src/game/**` sono ancora vuoti per progetto.

---

## Fase 1 — Dati geografici e perimetro nazioni ✅

> **Obiettivo:** Elenco nazioni consolidato e pipeline di generazione `europe-shapes.json`.
>
> **Stato:** **completata** il 2026-10-10 — vedi *Esito Fase 1* in coda a questa sezione.

### Task 1.1 — Congelamento elenco nazioni (`nations.ts`) ✅

* Mantenere una lista unica tipizzata classificata in tre gruppi coerenti:


1. `playable` (36 nazioni): paesi europei geograficamente e politicamente non ambigui.


2. `microstates` (7 nazioni): Andorra, San Marino, Città del Vaticano, Monaco, Liechtenstein, Malta, Lussemburgo (esclusi dal gioco, renderizzati in grigio).


3. `nonInteractive` (3 territori): Kosovo, Cipro, Groenlandia, Russia, Turchia (territori ambigui/speciali, renderizzati in grigio).




* Tabella di mappatura fissa ISO 3166-1 alpha-3 → `nameIt` (nomi ufficiali in italiano).



### Task 1.2 — Pipeline `scripts/generate-map.mjs` ✅

* Implementare la pipeline build-time:


1. Input: `world-atlas/countries-110m.json`.


2. Proiezione: `d3.geoEqualEarth()`.


3. Semplificazione geometrica via `mapshaper` per ottenere un file totale < 500 KB (path singolo < 10 KB).


4. Mappatura dei nomi italiani da `nations.ts`.


5. Emissione di `src/data/europe-shapes.json` contenente `viewBox`, `bbox`, `centroid`, `area` e `pathD`.


### ✅ Esito Fase 1

**Data:** 2026-10-10 · **Ambiente verificato:** macOS 27.0.1 (arm64), Node v26.7.0, npm 11.19.0.

**Dipendenze aggiunte (devDependencies):**

| Pacchetto | Uso |
| --- | --- |
| `world-atlas` | Dati Natural Earth 110m (TopoJSON) |
| `topojson-client` | Conversione TopoJSON → GeoJSON |
| `d3-geo` | Proiezione `geoEqualEarth()` e generazione path SVG |
| `@types/topojson-client` | Tipi TypeScript per `topojson-client` |
| `@types/d3-geo` | Tipi TypeScript per `d3-geo` |

**Deliverable prodotti:**

- **`src/data/nations.ts`**: Elenco completo di 48 nazioni europee classificate in 3 gruppi:
  - `playable` (36): Albania, Austria, Belgio, Bielorussia, Bosnia-Erzegovina, Bulgaria, Croazia, Danimarca, Estonia, Finlandia, Francia, Germania, Grecia, Irlanda, Islanda, Italia, Lettonia, Lituania, Macedonia del Nord, Moldavia, Montenegro, Norvegia, Paesi Bassi, Polonia, Portogallo, Regno Unito, Repubblica Ceca, Romania, Serbia, Slovacchia, Slovenia, Spagna, Svezia, Svizzera, Ucraina, Ungheria.
  - `microstate` (7): Andorra, Città del Vaticano, Liechtenstein, Lussemburgo, Malta, Monaco, San Marino.
  - `nonInteractive` (5): Cipro, Kosovo, Groenlandia, Russia, Turchia.
  - Mappatura ISO 3166-1 alpha-3 → nome italiano ufficiale.
  - Helper functions: `getPlayableIds()`, `getMicrostateIds()`, `getNonInteractiveIds()`, `getNationNameIt()`, `isPlayable()`.

- **`scripts/generate-map.mjs`**: Pipeline build-time completa.
  - Input: `world-atlas/countries-110m.json` (Natural Earth 110m).
  - Proiezione: `d3.geoEqualEarth()` fitted su Europa core (Russia, Turchia, Groenlandia escluse dal fit per evitare distorsione).
  - Kosovo gestito separatamente (match per nome, assente dal dataset come ID numerico).
  - Output: `src/data/europe-shapes.json` (43.6 KB, ben sotto il target di 150 KB).

- **`src/data/europe-shapes.json`**: File generato contenente 42 nazioni:
  - 36 giocabili + 1 microstato (Lussemburgo, unico microstato abbastanza grande per il 110m) + 5 non interattivi (Cipro, Kosovo, Groenlandia, Russia, Turchia).
  - 6 microstati assenti dal dataset (troppo piccoli per la risoluzione 110m): Andorra, Città del Vaticano, Liechtenstein, Malta, Monaco, San Marino. Compatibile con RF-06 (nessun "buco" visibile a quella scala).
  - Ogni nazione include: `name` (italiano), `playable` (boolean), `pathD` (SVG path), `bbox` ([x, y, w, h]), `centroid` ([cx, cy]), `area` (unità viewBox²).
  - viewBox: `[111, 0, 738, 700]`.

- **`tests/unit/nations.test.ts`**: 16 test — conteggi, coerenza dei gruppi, nomi, codici ISO, helper functions.

- **`tests/unit/europe-shapes.test.ts`**: 14 test — struttura JSON, conteggi, viewBox, validità path SVG, bbox, area, nomi italiani, codici ISO, dimensione file (< 150 KB).

**Verifica — criterio di uscita M1 («Mappa Europa statica renderizzata correttamente»):**

- ✅ `npm run gen:map` — generazione completata (42 nazioni, 43.6 KB)
- ✅ `npm run typecheck` — nessun errore
- ✅ `npm run lint` (`--max-warnings=0`) — nessun errore
- ✅ `npm run test` — 32/32 test verdi (3 file: tuning 2 + nations 16 + europe-shapes 14)
- ✅ `npm run build` — build verde (68.82 KB gzip)

**Note e limiti:**

- La semplificazione geometrica aggiuntiva (`topojson-simplify`, `mapshaper`) non è stata necessaria: i dati 110m di Natural Earth sono già sufficientemente semplificati (43.6 KB totale vs target 150 KB).
- Il viewBox è calcolato automaticamente dalle nazioni del "fit" (Europa core). Russia, Turchia e Groenlandia si estendono parzialmente oltre i bordi, il che è geograficamente corretto.
- Kosovo non ha codice ISO 3166-1 numerico nel dataset `world-atlas`; gestito tramite match per nome ("Kosovo").
- North Macedonia è registrata come "Macedonia" nel dataset (id `807`); mappata correttamente a `MKD`.

**Fix territori d'oltremare (2026-10-10):**

Natural Earth include i territori d'oltremare nelle geometrie dei paesi sovrani (es. Guyana francese in Francia, isole siberiane in Russia). Aggiunto filtro geografico `clipToEurope()` in `generate-map.mjs` che mantiene solo i poligoni il cui primo punto cade entro l'estensione geografica dell'Europa (lon [-75°, 60°], lat [33°, 84°]). Risultato:

- Francia: rimossa la Guyana francese (MultiPolygon da 3 a 2 poligoni). bbox da `[131, 195, 499, 485]` a `[288, 377, 197, 173]`.
- Russia: rimossi 8 poligoni d'oltremare (Siberia, isole artiche). Area da 116.186 a 3.849 unità².
- Totale: 9 poligoni d'oltremare rimossi. File JSON da 43.6 KB a 35 KB.
- Aggiunti 2 test anti-regressione (France bbox, Russia area).
- `npm run test`: 34/34 verdi.

---

## Fase 2 — Core della logica pura (`src/game/`) ✅

> **Obiettivo:** Moduli di gioco testabili con Vitest senza dipendenze dal DOM.
>
> **Stato:** **completata** il 2026-10-10 — vedi *Esito Fase 2* in coda a questa sezione.

### Task 2.1 — Tipi di dominio (`types.ts`) e parametri (`tuning.ts`) ✅

* Definire `types.ts`: `NationId`, `Nation`, `NationState`, `GameState`.


* Centralizzare tutti i parametri calibrabili in `tuning.ts`:


* `SNAP_RASTER_SIZE`: 128


* `MIN_OVERLAP_RATIO`: 0.55


* `ATTEMPT_SCORES`: `[100, 50, 25, 0]`

* `MIN_HIT_SIZE_PX`: 44


* `ZOOM_MIN`: 1.0, `ZOOM_MAX`: 6.0


* `ANIM_MS`: `{ PICKUP: 150, SNAP: 250, RETURN: 300 }`




### Task 2.2 — Shuffle (`shuffle.ts`) e Punteggio (`scoring.ts`) ✅

* Implementare `shuffleNationIds(ids, seed?)` con algoritmo Fisher-Yates (supporto seed per i test).


* Implementare `scoreForAttempt(attempts)` in base a `ATTEMPT_SCORES`.


* Calcolo del punteggio massimo teorico e della percentuale di precisione (primo tentativo) per la schermata finale.



### Task 2.3 — Gestione dello stato di gioco (`gameState.ts`) ✅

* Reducer puro per le azioni di gioco:


* `startGame`: genera l'ordine casuale del vassoio e imposta `startedAt` (epoch ms).


* `registerPlace`: marca la nazione come posizionata, calcola i punti e rimuove il pezzo dal vassoio.


* `registerFail`: incrementa il contatore `attempts` della nazione e lascia il pezzo nel vassoio.


* `finishGame`: imposta `finishedAt` quando `remaining === 0`.




* Garantire che la partita sia sempre completabile (nessun game over).


### ✅ Esito Fase 2

**Data:** 2026-10-10 · **Ambiente verificato:** macOS 27.0.1 (arm64), Node v26.7.0, npm 11.19.0.

**Moduli prodotti:**

| Modulo | Contenuto | Riferimento |
| --- | --- | --- |
| `src/game/types.ts` | Tipi di dominio: `NationId`, `Nation`, `NationState`, `GameState`, `PlacementResult` | §8.1 |
| `src/tuning.ts` | Parametri centralizzati: `snap`, `scoring`, `tray`, `map`, `anim` (tutti frozen) | §10 |
| `src/game/shuffle.ts` | `shuffleNationIds(ids, rng?)` — Fisher-Yates con RNG iniettabile | §8.4, RF-04 |
| `src/game/scoring.ts` | `scoreForAttempt()`, `maxScore()`, `precision()` — scala punti da tuning | §8.2, RF-23, RF-31 |
| `src/game/gameState.ts` | `startGame()`, `registerPlace()`, `registerFail()` — reducer puro immutabile | §8.3, RF-03, RF-24 |

**Test prodotti:**

| Test file | Test | Verifica |
| --- | --- | --- |
| `tests/unit/tuning.test.ts` | 22 | Immutabilità, valori snap/scoring/tray/map/anim, coerenza |
| `tests/unit/shuffle.test.ts` | 9 | Nessuna perdita, determinismo seeded, non-mutazione, casi limite |
| `tests/unit/scoring.test.ts` | 11 | Scala 100/50/25/0 (RF-23), maxScore, precisione |
| `tests/unit/gameState.test.ts` | 25 | startGame, registerPlace, registerFail, completabilità (RF-24), flusso completo |

**Verifica — criteri di uscita:**

- ✅ `npm run typecheck` — nessun errore
- ✅ `npm run lint` (`--max-warnings=0`) — nessun errore
- ✅ `npm run test` — 99/99 test verdi (6 file: tuning 22, shuffle 9, scoring 11, gameState 25, nations 16, europe-shapes 14)
- ✅ `npm run build` — build verde (82.12 KB gzip)

**Note e decisioni:**

- La funzione `precision()` conta `attempts === 1` come primo tentativo, perché `registerPlace` incrementa il contatore (il tentativo riuscito conta come attempt). Questo è coerente con il modello in cui `attempts` rappresenta il numero totale di rilasci (falliti + riuscito).
- `finishGame` è integrato direttamente in `registerPlace` (imposta `finishedAt` quando `remaining === 0`): non è stata creata una funzione separata per mantenere la coerenza con il modello reducer puro.
- Nessuna dipendenza da React o DOM nei moduli `src/game/**` — tutti testabili in ambiente `node`.

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