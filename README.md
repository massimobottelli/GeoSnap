# GeoSnap

Gioco didattico mobile-first: il giocatore trascina le sagome delle nazioni dal
vassoio alla posizione corretta sulla mappa dell'Europa; al rilascio la sagoma
si aggancia se abbastanza vicina. MVP1: giocatore singolo, solo Europa, punteggio,
nessuna persistenza, nessun suono.

- Requisiti funzionali: [`doc/functional-requirements-mvp1.md`](doc/functional-requirements-mvp1.md)
- Requisiti tecnici: [`doc/technical-requirements.mvp1.md`](doc/technical-requirements.mvp1.md)
- Piano di implementazione: [`doc/implementation-plan-mvp1.md`](doc/implementation-plan-mvp1.md)

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · SVG + d3-zoom ·
Vitest (unit) · Playwright (E2E) · ESLint + Prettier. Nessun backend, nessuna
richiesta di rete a runtime.

## Requisiti

- Node.js >= 20.19
- npm >= 10

## Setup automatico

```bash
# macOS
bash scripts/setup-macos.sh

# Linux
bash scripts/setup-linux.sh
```

Gli script verificano/installano Node.js, installano le dipendenze npm, scaricano
il browser Chromium di Playwright ed eseguono le verifiche di qualità
(`typecheck`, `lint`, `test`, `build`). Opzioni: `--skip-verify`, `--skip-browsers`.

## Script npm

| Comando                                   | Descrizione                                      |
| ----------------------------------------- | ------------------------------------------------ |
| `npm run dev`                             | Avvia il dev server Vite (HMR).                  |
| `npm run build`                           | Build statica in `dist/` (base `/GeoSnap/`).     |
| `npm run preview`                         | Anteprima locale della build.                    |
| `npm run typecheck`                       | `tsc --noEmit`.                                  |
| `npm run lint`                            | ESLint (flat config, strict).                    |
| `npm run format` / `npm run format:check` | Prettier.                                        |
| `npm run test` / `npm run test:watch`     | Test unitari (Vitest).                           |
| `npm run test:e2e`                        | Smoke test E2E (Playwright).                     |
| `npm run gen:map`                         | Rigenera `src/data/europe-shapes.json` (Fase 1). |
| `npm run check:bundle`                    | Verifica che `dist/` gzippato sia < 200 KB.      |

## Struttura

```
src/
├── data/         # nations.ts + europe-shapes.json (generato)
├── game/         # logica pura (no React/DOM)
├── components/   # rendering + eventi
├── hooks/        # useMapZoom, usePieceDrag
├── styles/       # theme.css
└── tuning.ts     # parametri calibrabili
scripts/          # setup + pipeline dati geografici
tests/            # unit/ (Vitest), e2e/ (Playwright)
```

## Deploy (GitHub Pages)

Il workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) esegue,
a ogni push su `main` (o manualmente via _Run workflow_):

1. `npm ci`;
2. verifiche di qualità: `typecheck`, `lint`, `format:check`, `test`;
3. `npm run build` → `dist/` statico con base path `/GeoSnap/`;
4. `npm run check:bundle` → fallisce se il bundle gzippato supera 200 KB;
5. pubblicazione di `dist/` su GitHub Pages (`actions/upload-pages-artifact` +
   `actions/deploy-pages`).

Configurazione una tantum sul repository: **Settings → Pages → Build and
deployment → Source: GitHub Actions**.

## Stato

**MVP1 completato (Fasi 0–7).** Il gioco è funzionante (36 nazioni giocabili,
drag & drop con snap, punteggio, schermata di riepilogo), coperto da test
unitari ed E2E, e viene pubblicato automaticamente su GitHub Pages dal workflow
`.github/workflows/deploy.yml` a ogni push su `main`. Bundle di produzione:
~106 KB gzip (soglia 200 KB).

## Crediti

Massimo Bottelli — [massimobottelli.it](https://massimobottelli.it) — [GitHub](https://github.com/massimobottelli)
