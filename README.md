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

## Stato

**Fase 0 (setup e infrastruttura) completata:** scheletro compilabile, toolchain
completa e ambienti di test operativi. Le funzionalità di gioco verranno
introdotte nelle fasi successive.

## Crediti

Massimo Bottelli — [massimobottelli.it](https://massimobottelli.it) — [GitHub](https://github.com/massimobottelli)
