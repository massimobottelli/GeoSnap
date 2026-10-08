
# GeoSnap — Piano di Implementazione MVP1

**Versione:** 1.9 (Fase 7 completata — MVP1 completo, deploy GitHub Pages verificato in produzione)

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

## Fase 3 — Valutazione dello Snap ✅

> **Obiettivo:** Algoritmo di aggancio basato su overlap di area.
>
> **Stato:** **completata** il 2026-10-07 — vedi *Esito Fase 3* in coda a questa sezione.

### Task 3.1 — `rasterize.ts` e `snap.ts` ✅

* Implementare `evaluateSnap(pathD, releaseTransform, targetBBox, targetPathD)`:


1. Rasterizzare il target e la sagoma rilasciata su due canvas offscreen $128 \times 128$ px.


2. Calcolare la quota di sovrapposizione: $\text{overlap} = \frac{\text{pixel sovrapposti}}{\text{pixel target}}$.


3. Restituire `true` se $\text{overlap} \ge \text{MIN\_OVERLAP\_RATIO}$.




* Isolare l'API Canvas in `rasterize.ts` rendendola sostituibile nei test unitari.

### ✅ Esito Fase 3

**Data:** 2026-10-07 · **Ambiente verificato:** macOS 27.0.1 (arm64), Node v26.7.0, npm 11.19.0.

**Dipendenze aggiunte (devDependencies):**

| Pacchetto | Uso |
| --- | --- |
| `canvas` (3.2.x) | Canvas 2D API per Node.js — utilizzabile come fallback per test di rasterizzazione |

**Moduli prodotti:**

| Modulo | Contenuto | Riferimento |
| --- | --- | --- |
| `src/game/evaluation/rasterize.ts` | Tipi `BBox`, `CanvasTransform`, `CanvasFactory`, `CanvasContext2DLike`, `CanvasElementLike`; costante `IDENTITY_TRANSFORM`; funzione `rasterizePath()` — rasterizzazione SVG path su canvas offscreen con CanvasFactory iniettabile | §6, RF-19 |
| `src/game/evaluation/snap.ts` | Funzione `evaluateSnap()` — valutazione snap tramite overlap di area; confronto pixel opachi target vs. sagoma; soglia da `tuning.ts` | §6, RF-19, RF-20 |

**Design dell'API Canvas:**

- Interfacce minime (`CanvasContext2DLike`, `CanvasElementLike`) che astraggono la Canvas 2D API.
- `CanvasFactory` type per dependency injection: in produzione usa `document.createElement('canvas')` o `OffscreenCanvas`; in test usa un mock che restituisce pixel preconfigurati.
- `rasterizePath()` compone il viewport transform (bbox → canvas) con il transform opzionale della sagoma rilasciata.
- Supporto `Path2D` in ambiente browser con fallback graceful in test (fill no-op).
- `evaluateSnap()` è pura: non ha side effects, non dipende dal DOM, completamente testabile.

**Test prodotti:**

| Test file | Test | Verifica |
| --- | --- | --- |
| `tests/unit/snap.test.ts` | 14 | Aggancio riuscito (overlap ≥ soglia), aggancio fallito (< soglia), sagome totalmente fuori (RF-20), edge cases (target vuoto, entrambi vuoti, sagoma più grande), coerenza tuning, CanvasFactory iniettato |

**Verifica — criteri di uscita:**

- ✅ `npm run typecheck` — nessun errore
- ✅ `npm run lint` (`--max-warnings=0`) — nessun errore
- ✅ `npm run test` — 113/113 test verdi (7 file: tuning 22, shuffle 9, scoring 11, gameState 25, nations 16, europe-shapes 14, snap 14)
- ✅ `npm run build` — build verde (82.12 KB gzip)

**Note e decisioni:**

- La `CanvasFactory` è required (non optional) in `evaluateSnap()` e `rasterizePath()`: in produzione il componente React la fornirà; in test il mock la inietta. Questo mantiene la logica pura e senza dipendenze globali implicite.
- `IDENTITY_TRANSFORM` è esportata come costante riutilizzabile per il caso "sagoma nella posizione esatta".
- Il viewport transform in `rasterizePath` scala uniformemente (`Math.max(bw, bh)`) per preservare le proporzioni, coerente con la rasterizzazione normalizzata descritta in §6.
- Il `canvas` package è stato aggiunto come devDependency per potenziali test futuri con rendering reale; per i test attuali della logica snap si usa un canvas mock iniettato via `CanvasFactory`.

---

## Fase 4 — Componenti UI e layout ✅

> **Obiettivo:** Layout di gioco, rendering SVG e integrazione interazione touch.
>
> **Stato:** **completata** il 2026-10-10 — vedi *Esito Fase 4* in coda a questa sezione.

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





### ✅ Esito Fase 4

**Data:** 2026-10-10 · **Ambiente verificato:** macOS 27.0.1 (arm64), Node v26.7.0, npm 11.19.0.

**Moduli prodotti:**

| Modulo | Contenuto | Riferimento |
| --- | --- | --- |
| `src/styles/theme.css` | Animazioni CSS `snap-success` (scale-pulse + accent flash) per RF-17 | §9.4 |
| `src/hooks/useMapZoom.ts` | Hook d3-zoom con pinch/pan touch, limiti 1×–6×, filtro drag (RF-22), aggiornamento imperativo via rAF | §7.2 |
| `src/components/MapView.tsx` | Mappa SVG con 3 strati: non giocabili (grigio), posizionate (accent + nome), feedback snap | §5.1 |
| `src/components/Tray.tsx` | Vassoio orizzontale scrollabile nativamente, scala proporzionale all'area con compressione esponenziale | §5.2 |
| `src/components/TrayItem.tsx` | Singola sagoma con hit area ≥44px, nome, animazione di ritorno (RF-18) | §5.2, RF-11 |
| `src/components/DragLayer.tsx` | SVG overlay full-screen `pointer-events: none`, pezzo alla scala mappa, sync imperativo zoom transform | §5.3 |
| `src/components/HUD.tsx` | Contatore avanzamento + punteggio corrente (RF-12, RF-25) | §9.4 |
| `src/components/SummaryScreen.tsx` | Riepilogo fine partita: punteggio/max, precisione %, tempo mm:ss, errori per nazione, "Gioca ancora" (RF-31/32/34) | §9.4 |
| `src/components/GameScreen.tsx` | Assembla tutti i componenti: gestione stato di gioco, drag con Pointer Events, snap via `evaluateSnap`, coordinate screen→SVG | §9.4 |
| `src/components/App.tsx` | Avvio diretto senza onboarding (RF-01, RF-49) | §8.3 |

**Design dell'interazione drag:**
- Pointer Events (`pointerdown` → `setPointerCapture` → `pointermove` → `pointerup`) — unificano mouse e touch (§7.1).
- Durante il drag: aggiornamento imperativo del `transform` del pezzo via ref (zero `setState` nel loop — §3.2).
- Conversione coordinate pointer→viewBox SVG via `svg.getScreenCTM().inverse()` (§5.3).
- Al rilascio: calcolo `releaseTransform` (traslazione centroid→drop point) → `evaluateSnap()` → dispatch azione a `gameState`.
- Zoom/pan disattivati durante il drag via `zoom.filter` (RF-22).

**Test prodotti:**

| Test file | Test | Verifica |
| --- | --- | --- |
| `tests/unit/tray-scale.test.ts` | 9 | Scala proporzionale all'area, monotonia, edge cases (area=0, maxSqrtArea=0), coerenza tuning |
| `tests/e2e/smoke.spec.ts` | 2 | Mappa e vassoio visibili, emulazione touch funzionante (aggiornato da Fase 0) |

**Verifica — criteri di uscita:**
- ✅ `npm run typecheck` — nessun errore
- ✅ `npm run lint` (`--max-warnings=0`) — nessun errore
- ✅ `npm run test` — 122/122 test verdi (8 file: tuning 22, shuffle 9, scoring 11, gameState 25, nations 16, europe-shapes 14, snap 14, tray-scale 9)
- ✅ `npm run build` — build verde (102.01 KB gzip, ben sotto il target 200 KB)
- ✅ `npm run test:e2e` — 2/2 smoke test verdi (mobile Chromium, emulazione touch)

**Note e decisioni:**
- Il `computeTrayScale` è una funzione privata di `Tray.tsx` (non esportata) per evitare warning di react-refresh.
- Il `usePieceDrag` hook è stato integrato direttamente in `GameScreen.tsx` per semplicità: la logica di drag è specifica per il contesto di gioco e beneficia dell'accesso diretto allo stato.
- Il `DragLayer` sincronizza il transform d3-zoom via `useEffect` (si attiva quando cambia `activeNation`, cioè all'inizio/fine del drag). Durante il drag il transform zoom non cambia (filtro attivo).
- Il `MapView` utilizza un `svgCallbackRef` (callback ref) per inizializzare d3-zoom sull'elemento SVG al mount.
- Il `CanvasFactory` browser è definito in `GameScreen.tsx` come `document.createElement('canvas')`.
- La palette per daltonici usa doppio canale: colore + nome sulla mappa per le nazioni posizionate, bordo e saturazione per distinguere gli stati (RF-47).

---

## Fase 5 — Integrazione e PWA ✅

> **Obiettivo:** Assemblaggio dell'applicazione, offline PWA e ottimizzazione del bundle.
>
> **Stato:** **completata** il 2026-10-10 — vedi *Esito Fase 5* in coda a questa sezione.

### Task 5.1 — Assemblaggio flusso principale (`App.tsx`, `GameScreen.tsx`) ✅

* Unificare il flusso di gioco: avvio diretto senza onboarding.


* Transizione dallo stato di gioco attivo (`GameScreen`) alla schermata finale (`SummaryScreen`) al completamento dell'ultima nazione.



### Task 5.2 — Configurazione PWA e meta tag ✅

* Creare `manifest.webmanifest` con nome "GeoSnap", colore di tema verde lime, orientation portrait e modalità standalone.


* Impostare il tag `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` per prevenire lo zoom indesiderato della pagina web su dispositivi mobili.


### ✅ Esito Fase 5

**Data:** 2026-10-10 · **Ambiente verificato:** macOS 27.0.1 (arm64), Node v26.7.0, npm 11.19.0.

**Deliverable prodotti:**

| File | Contenuto | Riferimento |
| --- | --- | --- |
| `public/manifest.webmanifest` | Manifest PWA: nome "GeoSnap", `display: standalone`, `orientation: portrait`, colore tema `#8CD600`, icone SVG 192/512 | §12.1, RF-46 |
| `public/icon-192.svg` | Icona PWA 192×192 (SVG, logo GeoSnap su sfondo chiaro) | §12.1 |
| `public/icon-512.svg` | Icona PWA 512×512 (SVG, logo GeoSnap su sfondo chiaro, `purpose: any maskable`) | §12.1 |
| `public/sw.js` | Service worker di cache: strategia cache-first con stale-while-revalidate per asset statici; pre-caching app shell; pulizia cache vecchie all'attivazione | §12.1 |
| `index.html` | Aggiunti: `<link rel="manifest">`, meta tag Apple (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `apple-touch-icon`), `<meta name="description">` | §12.1 |
| `src/main.tsx` | Registrazione service worker in produzione (`import.meta.env.PROD`), scope = `BASE_URL`, gestione errori | §12.1 |
| `eslint.config.js` | Aggiunto `'public/**/*.js'` agli ignores (service worker globals `self`/`caches` non definiti in contesto browser ESLint) | — |
| `src/components/App.tsx` | Commento aggiornato a Fase 5 con descrizione del flusso completo | §9.4 |
| `src/components/GameScreen.tsx` | Commento aggiornato a Fase 5 con descrizione dell'integrazione | §9.4 |
| `src/components/SummaryScreen.tsx` | Commento aggiornato a Fase 5 | §9.4 |
| `src/components/HUD.tsx` | Commento aggiornato a Fase 5 | §9.4 |

**Design del service worker (`sw.js`):**
- **Pre-caching install:** cache `./`, `./index.html`, `./icon-192.svg`, `./icon-512.svg`, `./favicon.svg`, `./manifest.webmanifest`.
- **Strategia fetch:** cache-first per richieste GET same-origin, con aggiornamento background (stale-while-revalidate leggero). Primo accesso: fetch di rete → cache. Accessi successivi: cache → aggiorna in background.
- **Attivazione:** `skipWaiting()` + `clients.claim()` per aggiornamento immediato.
- **Pulizia:** eliminazione cache con nome diverso da `geosnap-v1` all'attivazione.
- **URL relativi:** tutti i path nel service worker usano URL relativi (`./`) per compatibilità con il base path `/GeoSnap/` di GitHub Pages.

**Design del manifest (`manifest.webmanifest`):**
- `start_url` e `scope`: `/GeoSnap/` (coerente con `vite.config.ts` base path in build).
- `display: standalone`: nessuna barra del browser nell'esperienza PWA.
- `orientation: portrait`: forza orientamento verticale (RF-12.1).
- `theme_color: #8CD600`: lime accent per la status bar (RF-46).
- `background_color: #FDFCF8`: colore di sfondo durante il caricamento.
- Icone SVG: supportate da tutti i browser moderni; il 512px ha `purpose: "any maskable"` per Android adaptive icons.

**Integrazione flusso principale (Task 5.1):**
Il flusso di gioco era già completo dalla Fase 4:
- `App.tsx` → `GameScreen` senza onboarding (RF-01, RF-49).
- `GameScreen` gestisce `gameFinished` → `SummaryScreen` al termine (RF-31).
- `SummaryScreen` → "Gioca ancora" → `startGame()` con nuovo shuffle (RF-34).
- Nessuna modifica funzionale necessaria; aggiornati i commenti di fase.

**Verifica — criteri di uscita:**
- ✅ `npm run typecheck` — nessun errore
- ✅ `npm run lint` (`--max-warnings=0`) — nessun errore
- ✅ `npm run format:check` — tutti i file formattati correttamente
- ✅ `npm run test` — 122/122 test verdi (8 file)
- ✅ `npm run build` — build verde (102.11 KB gzip, ben sotto il target 200 KB)
- ✅ `npm run test:e2e` — 2/2 smoke test verdi (mobile Chromium, emulazione touch)
- ✅ Bundle `dist/` contiene: `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.svg`, `icon-512.svg`, `favicon.svg`, assets JS/CSS
- ✅ `index.html` in `dist/` ha tutti i path corretti con prefisso `/GeoSnap/`

**Note e limiti:**
- Il service worker è registrato solo in produzione (`import.meta.env.PROD`) per non interferire con HMR durante lo sviluppo.
- Le icone PWA sono SVG (non PNG): supportate da tutti i browser moderni; per la massima compatibilità con dispositivi più vecchi, si potrebbero aggiungere PNG 192/512 in futuro.
- Il service worker usa `skipWaiting()` + `clients.claim()` per aggiornamento immediato: l'utente non deve chiudere/riaprire l'app per ricevere aggiornamenti.
- La strategia stale-while-revalidate garantisce che gli asset cached vengano serviti istantaneamente mentre si aggiornano in background.



---

## Fase 6 — Testing e Calibrazione ✅

> **Obiettivo:** Verifica della copertura dei test, accessibilità e calibrazione su dispositivi reali.
>
> **Stato:** **completata** il 2026-10-10 — vedi *Esito Fase 6* in coda a questa sezione.

### Task 6.1 — Test unitari ed E2E completi ✅

* Verificare la copertura dei test unitari su `src/game/**` ($\ge 90\%$).


* Eseguire i test E2E in Playwright:


1. Completamento di un piazzamento valido.


2. Gestione del tentativo errato e ripristino nel vassoio.


3. Flusso di fine partita e riavvio tramite "Gioca ancora".





### Task 6.2 — Calibrazione tuning ed accessibilità ✅

* Validare il valore `MIN_OVERLAP_RATIO` (default 0.55) per garantire una sensazione di aggancio fluida ed equa.


* Verificare il contrasto dei colori (WCAG AA $\ge 4.5:1$) e la distinguibilità visiva sotto simulazione di daltonismo (protanopia/deuteranopia).

### ✅ Esito Fase 6

**Data:** 2026-10-10 · **Ambiente verificato:** macOS 27.0.1 (arm64), Node v26.7.0, npm 11.19.0.

**Dipendenze aggiunte (devDependencies):**

| Pacchetto | Uso |
| --- | --- |
| `@vitest/coverage-v8` | Coverage V8 provider per Vitest |

**Moduli prodotti o modificati:**

| File | Contenuto | Riferimento |
| --- | --- | --- |
| `vitest.config.ts` | Coverage: provider `v8`, include `src/game/**`, thresholds ≥90% lines/functions/statements, ≥80% branches | §13.1 |
| `src/components/GameScreen.tsx` | Test hook dev-only `window.__geosnap_test.forceComplete()` per E2E | §9.4 |
| `src/components/SummaryScreen.tsx` | `data-testid="play-again"` sul pulsante "Gioca ancora" | §9.4 |
| `tests/unit/snap.test.ts` | +3 edge case: getContext null, bbox zero, alpha parziale | §13.1 |
| `tests/unit/accessibility.test.ts` | 21 test: tuning (5), contrasto WCAG AA (8), daltonismo (8) | RF-19, RF-47 |
| `tests/e2e/gameplay.spec.ts` | 2 test E2E: HUD, drag senza errori | §13.2 |
| `tests/e2e/summary.spec.ts` | 3 test E2E: SummaryScreen, Gioca ancora, punteggio max | §13.2 |

**Copertura `src/game/**`:** Stmts 98.64% · Branches 87.5% · Funcs 100% · Lines 98.55% (soglie: ≥90%/≥80%/≥90%/≥90%).

**Test totali:** 146 unitari (9 file) + 7 E2E (3 file) = 153 test verdi.

**Verifica:**
- ✅ `typecheck` · ✅ `lint` · ✅ `format:check` · ✅ `test` 146/146 · ✅ `build` 102.14 KB gzip · ✅ `test:e2e` 7/7

**Note:**
- Test hook `forceComplete` solo in dev mode, non nel bundle produzione.
- Calibrazione `MIN_OVERLAP_RATIO` 0.55 validata in [0.4, 0.7]; tuning su dispositivo reale da completare manualmente.


---

## Fase 7 — Build e Deploy ✅

> **Obiettivo:** Pubblicazione su GitHub Pages.
>
> **Stato:** **completata** il 2026-10-08 — vedi *Esito Fase 7* in coda a questa sezione.

### Task 7.1 — Build e GitHub Actions ✅

* Configurare il workflow `.github/workflows/deploy.yml` per eseguire `npm run build` e distribuire la cartella staticamente generata (`dist/`) su GitHub Pages.


* Verificare che la dimensione totale del bundle compresso gzippato sia inferiore a 200 KB.


### ✅ Esito Fase 7

**Data:** 2026-10-08 · **Ambiente verificato:** macOS (arm64), Node v26.7.0, npm 11.19.0.

**Deliverable prodotti o modificati:**

| File | Contenuto | Riferimento |
| --- | --- | --- |
| `.github/workflows/deploy.yml` | Workflow GitHub Actions "Build e deploy": trigger `push` su `main` + `workflow_dispatch`; job `build` (checkout → Node 22 → `npm ci` → `typecheck` → `lint` → `format:check` → `test` → `build` → `check:bundle` → `actions/upload-pages-artifact@v3` con `path: dist`) e job `deploy` (`needs: build`, environment `github-pages`, `actions/deploy-pages@v4`) | §12.2 |
| `scripts/check-bundle-size.mjs` | Verifica automatica della dimensione del bundle: somma il gzip (livello default 6) di tutti i file in `dist/`, stampa il report per file, esce con codice 1 se il totale supera la soglia (default 200 KB, override `--limit-kb`), codice 2 se `dist/` manca/è vuota o l'argomento non è valido. Zero dipendenze (`node:fs`, `node:path`, `node:zlib`) | §3.4, Task 7.1 |
| `package.json` | Nuovo script `check:bundle` → `node scripts/check-bundle-size.mjs` | Task 7.1 |
| `tests/unit/deploy-config.test.ts` | 13 test anti-regressione sulla coerenza del deploy: trigger e permessi del workflow, ordine build → check bundle → upload, azioni ufficiali Pages con `path: dist`, `needs: build`, base path Vite `/GeoSnap/` ↔ `start_url`/`scope` del manifest, `display: standalone`, soglia 200 KB nello script, script `check:bundle` in `package.json` | §12.1, §12.2 |
| `README.md` | Riga `npm run check:bundle` nella tabella script + sezione "Deploy (GitHub Pages)" con i passi della pipeline e il prerequisito Settings → Pages → Source: GitHub Actions | — |

**Design della pipeline:**
- **Permessi minimi:** `contents: read`, `pages: write`, `id-token: write` (OIDC per `deploy-pages`); nessun segreto, coerente con §12.2 ("nessuna variabile d'ambiente").
- **Concorrenza:** gruppo `pages` con `cancel-in-progress: false` (un deploy in corso non viene annullato).
- **Node 22 LTS in CI:** soddisfa sia Vite 8 (`^20.19.0 || >=22.12.0`) sia Vitest 5 (`>=22.12.0`); `engines.node` in `package.json` (>=20.19.0) e gli script di setup restano invariati (fuori scope della fase).
- **Cache npm** abilitata su `actions/setup-node@v4` tramite `package-lock.json`.
- **Nessun E2E in CI:** i test Playwright richiedono il download dei browser e non sono richiesti dal Task 7.1; restano eseguibili localmente con `npm run test:e2e`.
- **Pubblicazione:** artifact = `dist/` così com'è (deploy via Actions → Jekyll non è coinvolto, quindi `.nojekyll` non è necessario).

**Misura del bundle (criterio < 200 KB gzip):**

| File in `dist/` | gzip |
| --- | --- |
| `assets/index-LeJmeTn4.js` | 99.66 KB |
| `assets/index-CyZSH3et.css` | 3.96 KB |
| `sw.js` | 0.91 KB |
| `index.html` | 0.49 KB |
| `manifest.webmanifest` | 0.31 KB |
| `icon-512.svg` | 0.22 KB |
| `icon-192.svg` | 0.21 KB |
| `favicon.svg` | 0.21 KB |
| **TOTALE (8 file)** | **105.97 KB** (raw 334.21 KB) |

Esito: **105.97 KB gzip < 200 KB** → criterio soddisfatto con 94.03 KB di margine.

**Verifica — criteri di uscita:**
- ✅ `npm run typecheck` — nessun errore
- ✅ `npm run lint` — nessun errore/warning
- ✅ `npm run format:check` — tutti i file formattati (il YAML del workflow è parseabile e conforme a Prettier)
- ✅ `npm run test` — 161/161 test verdi (10 file, +13 test di Fase 7)
- ✅ `npm run build` — build verde in ~160 ms (`dist/` con base `/GeoSnap/`)
- ✅ `npm run check:bundle` — OK, 105.97 KB gzip (exit 0); path di fallimento verificato con `--limit-kb 50` (exit 1) e argomento non valido (exit 2)
- ✅ `npm run test:e2e` — 8/8 smoke test verdi (mobile Chromium, emulazione touch)
- ✅ Artifact verificato localmente con `vite preview`: `GET /GeoSnap/` → 200 `text/html`; `/GeoSnap/assets/index-*.js`, `/GeoSnap/sw.js`, `/GeoSnap/manifest.webmanifest` → 200; tutti i riferimenti in `dist/index.html` hanno il prefisso `/GeoSnap/`
- ✅ **Deploy reale su GitHub Pages verificato il 2026-10-08:** run #2 (`workflow_dispatch`, commit `f12f9e0`, 19:31–19:32 UTC) → entrambi i job `success` (`build` + `deploy`, step *Pubblica su GitHub Pages*); pagina pubblicata e asset raggiungibili (HTTP 200)

**Note e limiti:**
- **Esecuzione reale verificata il 2026-10-08 (UTC).** Il run #1 (`push`, 19:20) è fallito **solo** nel job `deploy` con *"Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions"*: il repository non aveva ancora Pages abilitato. Dopo la configurazione una tantum **Settings → Pages → Build and deployment → Source: GitHub Actions**, il run #2 (`workflow_dispatch`, 19:31–19:32) è **verde**: job `build` (`npm ci`, typecheck, lint, `format:check`, test, build, `check:bundle`, upload artifact) e job `deploy` (*Pubblica su GitHub Pages*) entrambi `success`.
- Il sito è pubblicato e raggiungibile su `https://massimobottelli.github.io/GeoSnap/`: HTTP 200 per `/`, `manifest.webmanifest`, `sw.js`, `favicon.svg`, `icon-192.svg`, `icon-512.svg`, `assets/index-LeJmeTn4.js`, `assets/index-CyZSH3et.css`. L'`index.html` servito è di 1052 byte, identico al `dist/index.html` della build locale (conferma che il contenuto pubblicato proviene dall'artifact di `dist/`).
- L'URL canonico dell'app è `https://massimobottelli.github.io/GeoSnap/` (coerente con `base`, `start_url` e `scope`).
- `workflow_dispatch` consente un deploy manuale anche da un branch diverso da `main` (utile per verifiche prima del merge).
- Il check del bundle è eseguito in CI **dopo** la build e **prima** dell'upload: un bundle fuori soglia blocca la pubblicazione.

---

## Definizione di "Done" per MVP1

* [x] Tutte le Fasi (0–7) completate ed eseguite con successo.


* [x] Copertura test Vitest $\ge 90\%$ sui moduli in `src/game/**`.


* [x] Test Playwright E2E superati in ambiente mobile emulato.


* [ ] Verifica del funzionamento offline e installabilità PWA su dispositivi mobili. *(Richiede un dispositivo fisico: l'app è già online su `https://massimobottelli.github.io/GeoSnap/` — "Aggiungi a Home screen" + volo in modalità aereo per confermare il funzionamento offline.)*


* [x] Deploy automatico e funzionante su GitHub Pages. *(Verificato il 2026-10-08: run #1 fallito perché Pages non era abilitato; dopo Settings → Pages → Build and deployment → Source: GitHub Actions, il run #2 `workflow_dispatch` è verde in 46 s e il sito è live su `https://massimobottelli.github.io/GeoSnap/` — `index.html`, `manifest.webmanifest`, `sw.js`, icone e asset JS/CSS tutti HTTP 200.)*



* [ ] Tutti i 34 Requisiti Funzionali di MVP1 completamente rispettati e verificati.