# GeoSnap — Requisiti Tecnici (MVP1)

**Versione:** 1.1 | **Autore:** Massimo Bottelli | **Stato:** Approvato per l'implementazione

**Documento di riferimento:** *GeoSnap — Requisiti Funzionali 1.0 (MVP1)*

**Crediti:** Massimo Bottelli — massimobottelli.it — [github.com/massimobottelli](https://www.google.com/search?q=https%3A%2F%2Fgithub.com%2Fmassimobottelli)

---

## 1. Scopo e risposte alle domande aperte (§9 RF)

| # | Domanda aperta | Decisione |
| --- | --- | --- |
| 1 | Persistenza locale (RF-42) | `localStorage` da MVP2. In MVP1 nessuna persistenza. Upgrade path a IndexedDB documentato.

 |
| 2 | Sorgente/formato dati geografici | Natural Earth (TopoJSON world-atlas) → proiezione **Equal Earth** → semplificazione geometrica → SVG path **bakeate a build-time**. Nessuna libreria geografica a runtime.

 |
| 3 | Mappa interattiva zoom/pan | SVG nativo con `viewBox` + **d3-zoom** (pinch/pan touch), disattivato durante il drag delle sagome (RF-22).

 |
| 4 | Hit area e rendering sagome | Rendering SVG; hit test su rettangolo trasparente sovradimensionato (`min 44px`) sovrapposto alla sagoma nel vassoio.

 |
| 5 | Elenco nazioni giocabili | Set di 36 nazioni giocabili congelato in Appendice A (coerente con l'indicativo ~40 di RF-05). Microstati e territori ambigui renderizzati grigi non interattivi (RF-06/07).[cite: 1, 2] |

---

## 2. Stack tecnologico

| Area | Scelta | Versione min. | Note |
| --- | --- | --- | --- |
| Piattaforma | Web app **PWA** | — | Installabile su home screen; offline di fatto (tutti i dati nel bundle)

 |
| Linguaggio | **TypeScript** (strict) | 5.x | Nessun `any` implicito

 |
| Framework UI | **React** | 18/19 | Solo componenti funzione + hooks

 |
| Build | **Vite** | 6.x | Dev server HMR, build statica

 |
| Stile | **Tailwind CSS** | 4.x | Nessuna component library; tema via `@theme` CSS variables

 |
| Rendering gioco | **SVG** (viewBox) | — | Mappa, sagome, vassoio, etichette

 |
| Zoom/pan | **d3-zoom** | 3.x | Unica dipendenza runtime esterna

 |
| Dati geo (build-time) | `world-atlas` + `topojson-client` + `d3-geo` + `mapshaper` | — | Solo nello script di generazione, mai nel bundle

 |
| Test unitari | **Vitest** | — | Logica di gioco pura

 |
| Test E2E | **Playwright** (emulazione touch) | — | 2–3 smoke test

 |
| Formattazione | **Prettier** | 3.x | Config nel repo, format-on-save

 |
| Linting | ESLint (typescript-eslint) | 9.x | `strict-type-checked` ridotto

 |
| Deploy | **GitHub Pages** | — | `vite build` → cartella `dist` statica

 |

**Dimensione attesa del bundle:** < 200 KB gzippati (map data ~80–120 KB incluse le geometrie semplificate).

---

## 3. Architettura

### 3.1 Principio fondamentale

> **Tutta la logica di gioco è pura e isolata dai componenti React.**
> 
> 
> I componenti si occupano solo di rendering e di tradurre eventi DOM in azioni.
> Questo rende il codice testabile senza DOM e affidabile per lo sviluppo assistito da AI agent.
> 
> 

```
src/
├── data/
│   ├── europe-shapes.json      # GENERATO (script) — path, bbox, area per ogni paese
│   └── nations.ts              # elenco paesi giocabili, microstati, ambigui, nomi italiani, colori
├── game/                       # LOGICA PURA — nessun import React, nessun DOM
│   ├── types.ts                # tipi di dominio (GameState, Nation, Placement, …)
│   ├── shuffle.ts              # mescolamento vassoio (RF-04)
│   ├── scoring.ts              # scala punti per tentativi (RF-23)
│   ├── attempts.ts             # conteggio errori per nazione (RF-26)
│   ├── gameState.ts            # reducer: init, place, fail, finish (RF-03, RF-31)
│   └── evaluation/
│       ├── snap.ts             # valutazione overlap (RF-19, §6)
│       └── rasterize.ts        # util raster canvas (puro: accetta ImageData)
├── components/                 # SOLO RENDERING + eventi
│   ├── App.tsx
│   ├── GameScreen.tsx          # mappa + vassoio + HUD
│   ├── MapView.tsx             # <svg> mappa, d3-zoom, nazioni posizionate
│   ├── Tray.tsx                # vassoio scorrevole (RF-09)
│   ├── TrayItem.tsx            # singola sagoma nel vassoio + hit area + label
│   ├── DragLayer.tsx           # sagoma che segue il dito durante il drag
│   ├── HUD.tsx                 # contatore avanzamento + punteggio (RF-12, RF-25)
│   └── SummaryScreen.tsx       # riepilogo fine partita (RF-31)
├── hooks/
│   ├── useMapZoom.ts           # incapsula d3-zoom + filter per il drag (RF-21/22)
│   └── usePieceDrag.ts         # Pointer Events → callback start/move/end
├── styles/
│   └── theme.css               # Tailwind @theme: palette lime, token design
├── tuning.ts                   # TUTTI i parametri di tuning (§10)
└── main.tsx
scripts/
└── generate-map.mjs            # pipeline dati geografici (§4)
tests/
├── unit/                       # Vitest: game/**
└── e2e/                        # Playwright
```[cite: 2]

### 3.2 Flusso del dato (runtime)


```

europe-shapes.json → game/gameState.ts (stato iniziale: shuffle)
→ components (rendering mappa + vassoio)
Pointer Events   → hooks/usePieceDrag.ts (fase imperativa, nessun stato React)
rilascio         → game/evaluation/snap.ts (pura) → esito
esito            → game/gameState.ts (azione place/fail) → React aggiorna UI

```[cite: 2]

**Regola critica:** durante il trascinamento la posizione della sagoma **non** passa dallo stato React. La fase di movimento è imperativa (trasformazione dell'elemento SVG via `transform` diretto nell'event handler)[cite: 2]. Solo l'**esito del rilascio** produce un'azione sullo stato di gioco ("commit al rilascio")[cite: 2]. Questo garantisce 60fps anche su dispositivi modesti[cite: 2].

---

## 4. Pipeline dati geografici (build-time)

### 4.1 Script `scripts/generate-map.mjs`

Esecuzione manuale/one-shot (riutilizzabile in MVP2 per gli altri continenti). Passi:

1. **Input:** `world-atlas/countries-110m.json` (Natural Earth, pubblico dominio).[cite: 2]
2. **Proiezione:** `d3.geoEqualEarth()` — equal-area (dimensioni comparabili a fini didattici), distorsione minima alle latitudini europee, unica proiezione valida anche per la futura modalità "Mondo".[cite: 2]
3. **Semplificazione:** `mapshaper` (visvalingam) con soglia tale da mantenere le sagome riconoscibili (~0.5–1 KB di path per paese; target: tutte le nazioni europee < 150 KB totali).[cite: 2]
4. **Traduzione:** ogni feature → stringa SVG `path d`, calcolo di `bbox`, `centroid` e `area` (in unità SVG planari).[cite: 2]
5. **Nomi:** mappatura ISO-3166 alpha-3 → nome italiano (tabella statica in `nations.ts`, es. `DEU → "Germania"`). Fonte dei nomi: denominazioni ufficiali italiane.[cite: 2]
6. **Output:** `src/data/europe-shapes.json`.[cite: 2]

### 4.2 Formato del dato generato

```jsonc
// europe-shapes.json (estratto)
{
  "projection": "EqualEarth",
  "viewBox": [x0, y0, w, h],           // bbox dell'intera Europa renderizzabile
  "countries": {
    "ITA": {
      "name": "Italia",
      "playable": true,                 // false per microstati/territori grigi (RF-06/07)
      "pathD": "M ... Z",
      "bbox": [x, y, w, h],
      "centroid": [cx, cy],
      "area": 12345.6                    // in unità viewBox, per il punteggio max
    }
    // ...
  }
}
```[cite: 2]

Il file è **vincolato dallo script**: non editare a mano; modifiche alla geometria passano da `generate-map.mjs`[cite: 2]. Lo script accetta un argomento continente (`--continent=europe`) per l'estensibilità MVP2[cite: 2].

---

## 5. Rendering

### 5.1 Mappa (`MapView.tsx`)

- Un elemento `<svg>` radice con `viewBox` dal JSON generato; zoom/pan via `d3-zoom` applicato a un `<g id="map-root">` con `transform`[cite: 2].
- Strati, dal basso verso l'alto:
  1. **Fondo:** paesi non giocabili (microstati e territori ambigui: Kosovo, Cipro, Groenlandia, Russia, Turchia) in grigio neutro, `pointer-events: none` (RF-06/07)[cite: 1, 2].
  2. **Posizionate:** paesi correttamente agganciati, riempiti col colore "posizionata" + `<text>` col nome al centroide (RF-14)[cite: 1, 2].
  3. **Feedback:** effetti temporanei di aggancio (glow/scaling via animazioni CSS, RF-17)[cite: 1, 2].
- Zoom iniziale: vista completa dell'Europa centrata; limiti di zoom: 1×–6× (parametrici, §10)[cite: 2].

### 5.2 Vassoio (`Tray.tsx`, `TrayItem.tsx`)

- Container orizzontale scrollabile nativo (`overflow-x: auto`) — lo swipe orizzontale usa lo scroll nativo del browser: zero gestione custom (RF-09)[cite: 1, 2].
- `TrayItem`: contiene (a) la sagoma scalata a dimensioni leggibili, (b) l'etichetta col nome (RF-10), (c) un **rettangolo trasparente di hit test** `fill="transparent"`[cite: 1, 2].
- **Regola hit area (RF-11):** `hitSize = max(latoMaggiore sagoma scalata, 44px)`. Il rettangolo trasparente, centrato sulla sagoma, ha lati `>= hitSize`. Tocco e drag partono sempre dal rettangolo, mai dal path[cite: 1, 2].
- **Scala sagome nel vassoio:** proporzionale all'area reale (`sqrt(area)`), compressa con potenza esponenziale per evitare che sagome piccole vengano schiacciate: `scale = MIN_TRAY_SCALE + (sqrt(area)/maxSqrtArea)^k * RANGE`. Parametri in §10[cite: 2].

### 5.3 Layer di drag (`DragLayer.tsx`)

- Un `<svg>` overlay full-screen, `pointer-events: none`, sopra mappa e vassoio[cite: 2].
- Contiene la sagoma in corso di drag, renderizzata alla scala della mappa (non quella del vassoio) — la sagoma "cresce" al pickup, transizione di ~150ms[cite: 2].
- Durante il drag: **nessuna evidenza predittiva** di alcun tipo (RF-16)[cite: 1, 2]. La sagoma segue il dito, punto[cite: 2].
- Conversione coordinate pointer → coordinate viewBox SVG via `svg.getScreenCTM().inverse()` (metodo nativo, nessuna matematica custom)[cite: 2].

---

## 6. Valutazione dello snap — overlap di area (RF-19, RF-20)

### 6.1 Algoritmo (eseguito solo al rilascio)

1. Prendere il `pathD` della nazione target e la **trasformazione di rilascio** (traslazione applicata alla sagoma durante il drag)[cite: 2].
2. Rasterizzare entrambi su due canvas offscreen di risoluzione fissa `SNAP_RASTER_SIZE` (default 128×128) mappando il bbox del paese target[cite: 2].
3. Contare i pixel in cui **entrambe** le rasterizzazioni sono opache → `overlapPx`[cite: 2].
4. Contare i pixel opachi del solo target → `targetPx`[cite: 2].
5. **Aggancio riuscito ⇔ `overlapPx / targetPx ≥ MIN_OVERLAP_RATIO`** (default 0.55, parametrico §10)[cite: 2].
6. Se riuscito: la nazione viene ancorata alla posizione esatta (path originale della mappa), **non** alla posizione di rilascio (RF-20: nessuna tolleranza visiva, la sagoma "scatta" al posto giusto)[cite: 1, 2].

### 6.2 Proprietà

- Robusto a qualunque forma (nazioni concave/di forma irregolare incluse)[cite: 2].
- Tolleranza **implicitamente proporzionale** alla nazione: il raster è normalizzato sul bbox del target, quindi una nazione piccola tollera in px quello che una grande tollera in km — soddisfa RF-19 senza fattori di scala espliciti[cite: 1, 2].
- Costo: O(128²) = ~16k confronti → trascurabile, e solo una volta per rilascio[cite: 2].
- La funzione `evaluateSnap(pathD, releaseTransform, target)` è **pura e testabile** (l'accesso al canvas è iniettabile/sostituibile in test)[cite: 2].
- Aggancio **solo alla propria posizione** (RF-20): la valutazione confronta la sagoma solo col suo target; nessun confronto con altri paesi, nessun snap multiplo possibile[cite: 1, 2].

---

## 7. Interazione — drag, zoom, pan

### 7.1 Drag (`usePieceDrag.ts`)

- API: Pointer Events (`pointerdown` → `setPointerCapture` → `pointermove` → `pointerup`/`pointercancel`). Unificano mouse e touch; niente Touch Events né HTML5 DnD[cite: 2].
- `pointerdown` su hit area del `TrayItem`: freeze dello scroll del vassoio (`touch-action: none` sull'item), pickup, crea la sagoma in `DragLayer`[cite: 2].
- `pointermove`: aggiornamento imperativo del `transform` della sagoma. Nessun setState[cite: 2].
- `pointerup`: **commit al rilascio** → calcolo snap (§6) → dispatch azione al game state → la sagoma o si fonde nel target (animazione positiva, RF-17) o ritorna al vassoio (animazione di ritorno con easing, ~300ms, RF-18)[cite: 1, 2].
- `pointercancel`: identico al fallito, senza contare errore (il gesto è stato interrotto dal sistema, non è una risposta del giocatore)[cite: 2].

### 7.2 Zoom/pan (`useMapZoom.ts`)

- `d3-zoom` sull'`<svg>` della mappa: pinch (2 dita), pan (1 dito sulla mappa), double-tap opzionale[cite: 2].
- **RF-22:** `zoom.filter(event => !dragState.active)` — mentre una sagoma è in drag, il filtro rifiuta tutti gli eventi e d3-zoom resta inerte. Al termine del drag, gesto ripristinato[cite: 1, 2].
- Conflitto vassoio/mappa: il vassoio vive **fuori** dall'elemento zoom-able (layout a stack, non dentro l'SVG), quindi scroll del vassoio e zoom della mappa non collidono mai[cite: 2].

### 7.3 Schema degli stati di gesto

| Gesto | Mappa attiva? | Vassoio scrollabile? | In drag? |
|---|---|---|---|
| 1 dito su mappa | pan | no | no |
| 2 dita su mappa | pinch zoom | no | no |
| 1 dito su vassoio (hit area) | **no (filter)** | no (touch-action: none) | **sì** |
| 1 dito su vassoio (fuori hit area) | no | sì (scroll nativo) | no |
| Durante drag | **no** | no | sì |

---

## 8. Logica di gioco (moduli puri)

### 8.1 Tipi di dominio (`types.ts`)

```ts
type NationId = string; // ISO-3166 alpha-3, es. "ITA"

interface Nation {
  id: NationId;
  name: string;          // nome italiano
  playable: boolean;
  pathD: string;
  bbox: [number, number, number, number];
  centroid: [number, number];
  area: number;          // unità viewBox², usato per scala nel vassoio
}

type PlacementResult = 'first' | 'second' | 'third' | 'fourthPlus';

interface NationState {
  attempts: number;      // rilasci falliti su questa nazione (RF-26)
  placed: boolean;
}

interface GameState {
  trayOrder: NationId[];           // ordine casuale del vassoio (RF-04)
  placed: Record<NationId, NationState>;
  score: number;                   // punteggio corrente (RF-25)
  startedAt: number;               // epoch ms registrato a inizio partita (RF-32)
  finishedAt: number | null;       // epoch ms registrato all'ultimo place
  remaining: number;               // n = trayOrder.length - placed
}

```

### 8.2 Modulo punteggio (`scoring.ts`)

* `scoreForAttempt(attempts): number` → mappa `0→100, 1→50, 2→25, ≥3→0` (RF-23). La scala **non è hardcoded**: legge l'array `ATTEMPT_SCORES` da `tuning.ts`[cite: 1, 2].
* `maxScore(nationCount): number` → somma del massimo per nazione (per "2.150 / 3.600" in RF-31)[cite: 1].
* `precision(placed): number` → quota di nazioni posizionate al 1° tentativo (RF-31)[cite: 1].

### 8.3 Riduttore di gioco (`gameState.ts`)

Azioni pure: `startGame(nations)` (shuffle iniziale e salvataggio `startedAt = Date.now()`), `registerFail(id)`, `registerPlace(id)` (attempt+1 → score; se `remaining === 0` imposta `finishedAt = Date.now()`), `finish()`.

* La partita termina quando `remaining === 0` (RF-03.4): nessun timer visibile, nessun limite di tempo[cite: 1].
* **Nessun limite ai tentativi, nessun malus** (RF-24): la funzione di punteggio è l'unica conseguenza degli errori[cite: 1].
* **Tempo (RF-32):** Non viene eseguito alcun `setInterval` o ciclo attivo durante il gioco. `startedAt` viene registrato all'avvio e la durata totale si calcola tramite semplice differenza (`finishedAt - startedAt`) al completamento dell'ultima nazione, per la visualizzazione esclusiva nel riepilogo[cite: 1, 2]. Nessuna logica temporale influenza il punteggio (RF-27)[cite: 1].

### 8.4 Shuffle (`shuffle.ts`)

* Fisher–Yates con `Math.random()`, rimescolato a ogni `startGame` (RF-04, RF-34)[cite: 1, 2].
* Testabilità: accetta un RNG iniettabile (default `Math.random`) per verifiche deterministiche in Vitest.



---

## 9. UI, tema e accessibilità

### 9.1 Token di design (`theme.css`, Tailwind `@theme`)

| Token | Valore | Uso |
| --- | --- | --- |
| `--color-accent` | verde lime (es. `#8CD600`; tono finale da tuning visivo) | titoli, bottoni, elementi interattivi (RF-46)[cite: 1, 2] |
| `--color-placed` | variante scura/stabile dell'accent (es. `#5BA300`) | nazioni posizionate |
| `--color-tray` | neutro chiaro (es. `#F4F7EE`) | sfondo vassoio |
| `--color-map-bg` | bianco caldo | sfondo mappa |
| `--color-disabled-geo` | grigio neutro | microstati e territori esclusi/ambigui (RF-06/07)[cite: 1, 2] |
| `--radius` / spaziature / ombre | scala Tailwind | coerenza |

Tema chiaro unico (RF-46): nessuna dark mode in MVP1[cite: 1, 2].

### 9.2 Palette a prova di daltonico (RF-47)

* La distinzione **posizionata vs. da posizionare** non deve dipendere solo dalla tinta: le sagome posizionate hanno anche (a) **nome visibile** sulla mappa (RF-14) e (b) saturazione/contorno maggiori[cite: 1, 2]. La sagoma nel vassoio ha invece bordo tratteggiato.
* Verificare contrasti WCAG AA su testo (etichette vassoio, HUD, riepilogo): ratio ≥ 4.5:1. In particolare l'etichetta testo su sfondo accent lime va calibrata (lime è cattivo come sfondo per testo bianco → usare testo quasi-nero su lime).


* Test preliminare: simulare deuteranopia/protanopia sulle due palette di stato (es. estensione browser o tool online) e validare la distinguibilità.



### 9.3 Etichette sulla mappa (RF-14)

* `<text>` col nome al `centroid`, dimensione proporzionale al bbox della nazione, con `min`/`max` font-size (parametri §10).


* Nazioni piccole/dense (Benelux): l'etichetta può uscire dal bbox; accettato in MVP1 purché leggibile (nessun sistema di callout/leader-line in MVP1 — nota per eventuale MVP2).


* Visibilità leggibile a zoom 1×: se non possibile per nazioni piccole, priorità al posizionamento sopra la sagoma posizionata con dim. minima garantita.



### 9.4 Componenti React — responsabilità

| Componente | Fa | Non fa |
| --- | --- | --- |
| `GameScreen` | layout stack (mappa sopra, vassoio sotto, HUD sovrapposto) | logica di gioco

 |
| `MapView` | render mappa + nazioni posizionate + etichette; monta `useMapZoom` | valutazione snap

 |
| `Tray` / `TrayItem` | scroll nativo, hit area, label, animazione di ritorno della sagoma fallita | punteggio

 |
| `DragLayer` | sagoma che segue il dito (imperativo) | qualsiasi decisione

 |
| `HUD` | "12/36 posizionate" + punteggio corrente (RF-12, RF-25) | —[cite: 1, 2] |
| `SummaryScreen` | punteggio/max, precisione %, tempo, elenco nazioni con errori, "Gioca ancora" (RF-31, RF-34) | —[cite: 1, 2] |

Animazioni: CSS transitions/keyframes (aggancio: scale-pulse + accent flash; ritorno al vassoio: easing con leggero rimbalzo, tono neutro). Nessuna libreria di animazione in MVP1 (RF-28: nessun suono, nessun `AudioContext` in codebase)[cite: 1, 2].

---

## 10. Parametri di tuning (`tuning.ts`)

Un unico file, tutti i valori in un punto, nessun magic number altrove nel codice:

```ts
export const tuning = {
  snap: {
    MIN_OVERLAP_RATIO: 0.55,      // §6 — soglia di aggancio (RF-19)
    SNAP_RASTER_SIZE: 128,       // risoluzione di rasterizzazione
  },
  scoring: {
    ATTEMPT_SCORES: [100, 50, 25, 0], // RF-23; index = tentativi falliti
  },
  tray: {
    MIN_HIT_SIZE_PX: 44,         // RF-11 — standard touch Apple/Google
    SCALE_MIN: 0.35,            // scala min sagoma nel vassoio
    SCALE_MAX: 1.0,             // scala max sagoma nel vassoio
    SCALE_CURVE: 0.6,           // esponente della compressione proporzionale
  },
  map: {
    ZOOM_MIN: 1.0, ZOOM_MAX: 6.0,
    LABEL_FONT_MIN: 8, LABEL_FONT_MAX: 20,   // unità viewBox
  },
  anim: {
    PICKUP_MS: 150, SNAP_MS: 250, RETURN_MS: 300,
  },
} as const;
```

Nota sulla tolleranza: `MIN_OVERLAP_RATIO` è il parametro di calibrazione principale richiesto da RF-19 — il raster normalizzato sul bbox del target rende la tolleranza automaticamente proporzionale alla nazione[cite: 1, 2].

---

## 11. Persistenza

- **MVP1: nessuna persistenza.** Nessun `localStorage`/`sessionStorage` in codebase (RF-33)[cite: 1, 2]. Chiusura dell'app = partita persa, per design[cite: 2].
- **MVP2 (nota di progettazione):** `localStorage` con chiave `geosnap:v1`, schema JSON versionato (`{ version, nickname, stats }`), scrittura solo a fine partita[cite: 2]. Migrazione a IndexedDB solo se lo storico dovesse superare ~1 MB o servisse uno storico partite illimitato[cite: 2].

---

## 12. PWA e deploy

### 12.1 PWA

- `manifest.webmanifest`: nome "GeoSnap", `display: standalone`, `orientation: portrait`, icone 192/512, `theme_color` lime[cite: 2].
- MVP1 non richiede service worker (tutto è nel bundle → già offline dopo il primo caricamento)[cite: 2]. Uno SW di cache è opzionale per l'installabilità su iOS[cite: 2].
- `viewport`: `width=device-width, initial-scale=1, user-scalable=no` — lo zoom della pagina è del gioco, non del browser (previene il conflitto pinch-pagina vs pinch-mappa)[cite: 2].
- `touch-action`: `none` su hit area del vassoio e su mappa (i gesti sono gestiti via Pointer Events/d3-zoom); `pan-x` sul container del vassoio per lo scroll nativo[cite: 2].

### 12.2 Deploy (GitHub Pages)

- `vite build` → `dist/` statico; base path = `/<repo>/` nel config[cite: 2].
- Workflow GitHub Actions automatico a push su `main` (build + deploy pages)[cite: 2].
- Nessun backend, nessuna variabile d'ambiente, nessun segreto: tutto client-side[cite: 2].

---

## 13. Testing

### 13.1 Unit (Vitest) — target: moduli in `src/game/**` al 100% della logica

| Test | Verifica |
|---|---|
| `scoring.test.ts` | 100/50/25/0 per 1°/2°/3°/4°+ tentativo (RF-23); max score; precision[cite: 1, 2] |
| `shuffle.test.ts` | nessuna perdita di elementi; con RNG seeded, ordine deterministico (RF-04)[cite: 1, 2] |
| `gameState.test.ts` | place/fail aggiornano stato e remaining; fine partita all'ultimo place (RF-03, RF-31); partita sempre completabile (RF-24)[cite: 1, 2] |
| `snap.test.ts` | overlap ≥ soglia → snap; < soglia → no; trasformazioni ai bordi; sagome totalmente fuori → mai snap (RF-20). Rasterizzatore con canvas mock/iniettato[cite: 1, 2] |

### 13.2 E2E (Playwright, emulazione touch) — smoke

1. **Partita completa automatica:** avvio → drag di 2 nazioni note a coordinate corrette (snap riuscito) + 1 drag a coordinate sbagliate (ritorno al vassoio) → verifica HUD/punteggio[cite: 2].
2. **Flusso di errore:** rilascio fallito → la sagoma è di nuovo nel vassoio → riposizione corretta al 2° tentativo → punteggio 50[cite: 2].
3. **Fine partita e replay:** completamento → SummaryScreen visibile → "Gioca ancora" → nuovo ordine del vassoio ≠ dal precedente (RF-34)[cite: 1, 2].

### 13.3 Manuale (checklist di tuning, non automatizzabile)

- Calibrazione `MIN_OVERLAP_RATIO` su dispositivo reale (aggancio percepito né troppo facile né frustrante)[cite: 2].
- Contrasto e leggibilità etichette a zoom 1× e 6×[cite: 2].
- Palette sotto simulazione daltonismo[cite: 2].

---

## 14. Regole per lo sviluppo assistito da AI coding agent

Queste regole vanno fornite all'agente come istruzioni di progetto (es. `AGENTS.md`):

1. **Nessuna logica di gioco nei componenti React.** La logica vive in `src/game/` come funzioni pure. I componenti importano e chiamano[cite: 2].
2. **Nessun `useState` durante il drag.** Il movimento della sagoma è imperativo (`transform` diretto). Lo stato React cambia solo al rilascio[cite: 2].
3. **Nessun magic number.** Tutti i valori calibrabili stanno in `tuning.ts` (§10)[cite: 2]. I numeri geometrici stanno in `europe-shapes.json`[cite: 2].
4. **Nessun effetto predittivo durante il drag** (RF-16): vietato aggiungere highlight, preview, snap-guida o cambiamenti d'aspetto della mappa in funzione della posizione della sagoma trascinata. Vietato valutare lo snap prima del rilascio[cite: 1, 2].
5. **Nessun suono / nessun `AudioContext`** (RF-28)[cite: 1, 2].
6. **Nessun salvataggio** (RF-33): niente storage in MVP1[cite: 1, 2].
7. **Non editare `europe-shapes.json` a mano** — si rigenera con `npm run gen:map`[cite: 2].
8. TypeScript strict, nessun `any`; Prettier applicata a ogni commit; ESLint senza errori[cite: 2].
9. **Test prima della logica:** ogni modifica a `src/game/**` arriva con i relativi test Vitest[cite: 2].
10. **Accessibilità:** ogni aggiunta di colore di stato deve avere un secondo canale non-cromatico (testo, tratteggio, saturazione) oltre alla tinta (RF-47)[cite: 1, 2].

---

## 15. Milestones di implementazione

| # | Milestone | Contenuto | Criterio di uscita |
|---|---|---|---|
| M0 | Setup | Vite + React + TS + Tailwind + Prettier + ESLint + Vitest + CI Pages | Build verde, app vuota deployata[cite: 2] |
| M1 | Dati | `generate-map.mjs` → `europe-shapes.json` (36 giocabili + 10 escluse/ambigue) | Mappa Europa statica renderizzata correttamente[cite: 2] |
| M2 | Mappa interattiva | `MapView` + `useMapZoom` | Pinch/pan fluidi su mobile, limiti 1×–6×[cite: 2] |
| M3 | Vassoio | `Tray`/`TrayItem` + hit area + labels + shuffle | Vassoio scrollabile, ordine casuale, hit 44px verificato[cite: 2] |
| M4 | Drag & snap | `usePieceDrag` + `DragLayer` + `evaluateSnap` + animazioni | Drag 60fps; snap/fallimento secondo RF-17/18/20[cite: 1, 2] |
| M5 | Punteggio e HUD | `scoring` + `gameState` + `HUD` | Contatore e punteggio aggiornati, scala punti RF-23[cite: 1, 2] |
| M6 | Riepilogo | `SummaryScreen` + calcolo durata a fine partita | RF-31/32/34 completi[cite: 1, 2] |
| M7 | Polish | Tema lime, accessibilità, calibrazione tuning, PWA manifest | Checklist §13.3 verde[cite: 2] |

Ogni milestone è indipendente e verificabile; l'agente lavora una milestone alla volta, con test al suo interno[cite: 2].

---

## 16. Rischi e mitigazioni

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Geometrie semplificate troppo aggressive → sagome irriconoscibili | Alto (didattica) | Target dimensione file per paese in M1; revisione visiva di ogni sagoma prima di congelare[cite: 2] |
| Drag con jitter/lag su dispositivi lenti | Alto (esperienza) | Architettura imperativa §3.2; profilazione su un device reale in M4[cite: 2] |
| Pinch-zoom in conflitto col drag | Medio | Separazione strutturale (vassoio fuori dall'SVG zoomabile) + `zoom.filter` (§7)[cite: 2] |
| Etichette illeggibili/sovvrapposte in zone dense (Benelux, Balcani) | Medio | Min font-size + test visivi; callout/leader-line rimandati a MVP2[cite: 2] |
| Tolleranza snap percepita ingiusta | Medio | `MIN_OVERLAP_RATIO` parametrico + sessione di tuning dedicata (M7)[cite: 2] |
| Cipro/Kosovo/Groenlandia: dispute di classificazione | Basso | Già escluse come giocabili in MVP1 (RF-07); renderizzate grigie; decisione MVP2[cite: 1, 2] |

---

## 17. Appendice A — Proposta di elenco nazioni (Congelato)

**Giocabili (36 nazioni):**  
Albania, Austria, Belgio, Bielorussia, Bosnia-Erzegovina, Bulgaria, Croazia, Danimarca, Estonia, Finlandia, Francia, Germania, Grecia, Irlanda, Islanda, Italia, Lettonia, Lituania, Macedonia del Nord, Moldavia, Montenegro, Norvegia, Paesi Bassi, Polonia, Portogallo, Regno Unito, Repubblica Ceca, Romania, Serbia, Slovacchia, Slovenia, Spagna, Svezia, Svizzera, Ucraina, Ungheria.[cite: 2]

**Microstati esclusi dal gioco, renderizzati grigi (7 nazioni, RF-05/06):**  
Andorra, Città del Vaticano, Liechtenstein, Lussemburgo, Malta, Monaco, San Marino.[cite: 1, 2]

**Territori speciali/ambigui esclusi dal gioco, renderizzati grigi (5 territori, RF-07):**  
Cipro, Kosovo, Groenlandia, Russia, Turchia.[cite: 1, 2]

**Note di classificazione:**
- **Set giocabile:** 36 nazioni (perfettamente coerente con l'indicativo "~40" di RF-05)[cite: 1, 2].
- **Lussemburgo:** citato in RF-05 tra gli esempi di microstati esclusi → renderizzato grigio non interattivo[cite: 1, 2].
- **Kosovo e Cipro:** classificate come territori ambigui ai sensi di RF-07 → renderizzati grigi non interattivi[cite: 1, 2].
- **Groenlandia, Russia, Turchia:** ai sensi di RF-07 → renderizzate grigie non interattive in MVP1; rivalutazione in MVP2 (RF-44)[cite: 1, 2].

---

## 18. Appendice B — Traceability requisiti funzionali → soluzioni tecniche

| RF | Requisito | Soluzione tecnica | Sezione |
|---|---|---|---|
| RF-01 | Avvio diretto | `App.tsx` → `startGame()` al mount, nessuna schermata intermedia | §8.3[cite: 2] |
| RF-02 | Solo Europa | `nations.ts` filtra `europe-shapes.json` in MVP1 | §4.2[cite: 2] |
| RF-03 | Flusso partita | `GameState` + milestone M1–M6 | §8.3[cite: 2] |
| RF-04 | Ordine casuale | Fisher–Yates in `shuffle.ts`, re-invocato a ogni `startGame` | §8.4[cite: 2] |
| RF-05 | ~40 nazioni escl. microstati | Set congelato di 36 nazioni giocabili in Appendice A | App. A[cite: 1, 2] |
| RF-06 | Microstati grigi | `playable: false` → strato di fondo, `pointer-events: none` | §5.1[cite: 2] |
| RF-07 | Esclusi nazioni ambigue | Appendice A, `playable: false` | App. A[cite: 2] |
| RF-08 | Mappa parte principale | Layout stack: mappa flessibile, vassoio fisso in basso | §9.4[cite: 2] |
| RF-09 | Vassoio scorrevole | `overflow-x: auto` nativo | §5.2[cite: 2] |
| RF-10 | Nome accanto alla sagoma | Etichetta `TrayItem` | §5.2[cite: 2] |
| RF-11 | Hit area minima | Rettangolo trasparente `≥ 44px`, `touch-action: none` | §5.2, §10[cite: 2] |
| RF-12 | Contatore avanzamento | `HUD` ("n/N posizionate") | §9.4[cite: 2] |
| RF-13 | Vassoio si svuota | `registerPlace` rimuove da `trayOrder` | §8.3[cite: 2] |
| RF-14 | Colore posizionata + nome | Strato "posizionate" + `<text>` al centroide | §5.1[cite: 2] |
| RF-15 | Sagoma segue il dito | Pointer Events + `DragLayer` imperativo | §7.1, §5.3[cite: 2] |
| RF-16 | Nessun feedback predittivo | Divieto esplicito agente AI #4; valutazione solo al rilascio | §14, §6[cite: 2] |
| RF-17 | Aggancio: animazione positiva | CSS keyframes scale-pulse + accent flash | §9.4[cite: 2] |
| RF-18 | Fallito: ritorno al vassoio | Animazione di ritorno, easing neutro, nessun malus | §7.1, §8.3[cite: 2] |
| RF-19 | Tolleranza proporzionale | Overlap ratio normalizzato sul bbox del target | §6[cite: 2] |
| RF-20 | Solo posizione corretta | Valutazione contro il solo target; ancoraggio al path esatto | §6.1.6[cite: 2] |
| RF-21 | Zoom/pan liberi | `d3-zoom` su `<svg>` mappa | §7.2[cite: 2] |
| RF-22 | Disattivati durante il drag | `zoom.filter` + separazione strutturale vassoio/mappa | §7.2, §7.3[cite: 2] |
| RF-23 | Scala punti 100/50/25/0 | `scoring.ts` + `ATTEMPT_SCORES` in `tuning.ts` | §8.2, §10[cite: 2] |
| RF-24 | Nessun malus assoluto | Nessun limite in `gameState.ts` | §8.3[cite: 2] |
| RF-25 | Punteggio visibile | `HUD` | §9.4[cite: 2] |
| RF-26 | Errori conteggiati per nazione | `NationState.attempts` | §8.1[cite: 2] |
| RF-27 | No punteggio tempo | `startedAt` misurato ma non influenza lo score | §8.3[cite: 2] |
| RF-28 | Nessun suono | Nessun audio in codebase (regola agente #5) | §14[cite: 2] |
| RF-29 | Solo feedback visivo | Animazioni CSS, niente audio/haptics | §9.4[cite: 2] |
| RF-30 | Nessun aiuto | Nessun modulo aiuti | —[cite: 2] |
| RF-31 | Schermata riepilogo | `SummaryScreen`: punteggio/max, precisione %, tempo, elenco errori | §9.4[cite: 2] |
| RF-32 | Timer nascosto | Durata calcolata solo a partita finita, nessun timer attivo durante il gioco | §8.3[cite: 1, 2] |
| RF-33 | Nessun salvataggio | Nessuno storage in MVP1 (regola agente #6) | §11, §14[cite: 2] |
| RF-34 | Gioca ancora | `startGame()` → nuovo shuffle | §8.4[cite: 2] |
| RF-46 | Tema chiaro + lime | `theme.css` token, unico tema | §9.1[cite: 2] |
| RF-47 | Accessibilità/daltonismo | Doppio canale non-cromatico per stati; WCAG AA; simulazione daltonismo in checklist | §9.2, §13.3[cite: 2] |
| RF-48 | Italiano | Mappatura ISO→italiano in `nations.ts` | §4.1.5[cite: 2] |
| RF-49 | No onboarding | Nessuna schermata introduttiva | §8.3[cite: 2] |

---

## 19. Decisioni da congelare prima dell'implementazione

1. **Elenco nazioni giocabili** (Appendice A) — Confermato a 36 nazioni giocabili, 7 microstati grigi e 5 territori ambigui grigi[cite: 1, 2].
2. **Tono esatto del lime** (`--color-accent` e derivati) — tuning visivo in M7, ma valori di partenza da approvare[cite: 2].
3. **Soglia `MIN_OVERLAP_RATIO`** — parte da 0.55, calibrazione finale a M7 su dispositivo reale[cite: 2].

---

## 20. Definizione di "Done" per MVP1

- [ ] Tutte le milestone M0–M7 completate con i criteri di uscita indicati[cite: 2].
- [ ] Copertura Vitest ≥ 90% su `src/game/**` (globale del progetto: ≥ 80%)[cite: 2].
- [ ] 3 smoke test Playwright verdi su browser mobile emulato[cite: 2].
- [ ] Test manuale su almeno un dispositivo Android e un iOS fisico: drag fluido, pinch/pan, snap percepito corretto[cite: 2].
- [ ] Checklist accessibilità §13.3 verificata (contrasto AA, simulazione daltonismo)[cite: 2].
- [ ] Deploy su GitHub Pages funzionante, PWA installabile su home screen[cite: 2].
- [ ] Tutti i 34 RF di MVP1 verificati contro la traceability di Appendice B[cite: 2].

---

*Documento di requisiti tecnici GeoSnap MVP1 — autore Massimo Bottelli. Da fornire all'AI coding agent insieme ai Requisiti Funzionali 1.0 e alle regole di §14 (come `AGENTS.md`).*[cite: 2]
