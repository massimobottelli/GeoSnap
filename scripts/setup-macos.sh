#!/usr/bin/env bash
#
# GeoSnap — Script di setup per macOS
# -----------------------------------
# Prepara l'ambiente di sviluppo locale su macOS:
#   1. verifica/installa Homebrew e Node.js (>= 20);
#   2. installa le dipendenze npm;
#   3. scarica il browser Chromium per Playwright;
#   4. esegue le verifiche di qualità (typecheck, lint, test unitari, build).
#
# Uso:
#   bash scripts/setup-macos.sh [--skip-verify] [--skip-browsers]
#
# Opzioni:
#   --skip-verify    salta le verifiche finali (typecheck/lint/test/build)
#   --skip-browsers  salta il download dei browser Playwright
#   -h, --help       mostra questo messaggio

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

REQUIRED_NODE_MAJOR=20
SKIP_VERIFY=0
SKIP_BROWSERS=0

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m==>\033[0m %s\n' "$*"; }
fail() {
  printf '\033[1;31m==>\033[0m %s\n' "$*" >&2
  exit 1
}

usage() {
  awk 'NR>1 { if (/^#/) { sub(/^# ?/, ""); print } else { exit } }' "${BASH_SOURCE[0]}"
}

for arg in "$@"; do
  case "${arg}" in
    --skip-verify) SKIP_VERIFY=1 ;;
    --skip-browsers) SKIP_BROWSERS=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    *) fail "Opzione sconosciuta: ${arg} (usa --help)" ;;
  esac
done

node_major() { node -v | sed 's/^v//' | cut -d. -f1; }

# --- 1. Homebrew -----------------------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  fail "Homebrew non trovato. Installalo da https://brew.sh e riprova."
fi
log "Homebrew presente: $(brew --version | head -n1)"

# --- 2. Node.js ------------------------------------------------------------
if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge "${REQUIRED_NODE_MAJOR}" ]; then
  log "Node.js $(node -v) già installato (>= ${REQUIRED_NODE_MAJOR})."
else
  warn "Node.js >= ${REQUIRED_NODE_MAJOR} non trovato: installo con Homebrew..."
  brew install node
fi
log "npm $(npm -v)"

# --- 3. Dipendenze npm -----------------------------------------------------
if [ -f package-lock.json ]; then
  log "Installo le dipendenze npm (npm ci)..."
  npm ci
else
  log "Installo le dipendenze npm (npm install)..."
  npm install
fi

# --- 4. Browser Playwright -------------------------------------------------
if [ "${SKIP_BROWSERS}" -eq 0 ]; then
  log "Scarico Chromium per Playwright..."
  npx --yes playwright install chromium ||
    warn "Download browser Playwright fallito: rilancia 'npx playwright install chromium'."
else
  log "Download browser Playwright saltato (--skip-browsers)."
fi

# --- 5. Verifiche di qualità ----------------------------------------------
if [ "${SKIP_VERIFY}" -eq 0 ]; then
  log "typecheck..."; npm run typecheck
  log "lint..."; npm run lint
  log "test unitari..."; npm run test
  log "build..."; npm run build
else
  log "Verifiche di qualità saltate (--skip-verify)."
fi

log "Setup completato."
printf 'Comandi utili:  npm run dev  |  npm run test  |  npm run test:e2e  |  npm run build\n'
