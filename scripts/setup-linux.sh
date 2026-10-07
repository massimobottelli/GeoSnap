#!/usr/bin/env bash
#
# GeoSnap — Script di setup per Linux
# -----------------------------------
# Prepara l'ambiente di sviluppo locale su Linux (Debian/Ubuntu, Fedora/RHEL,
# Arch, Alpine):
#   1. verifica/installa Node.js (>= 20) tramite il package manager disponibile;
#   2. installa le dipendenze npm;
#   3. scarica Chromium e le dipendenze di sistema per Playwright;
#   4. esegue le verifiche di qualità (typecheck, lint, test unitari, build).
#
# Uso:
#   sudo bash scripts/setup-linux.sh   # consigliato: no sudo? vedi sotto
#   bash scripts/setup-linux.sh [--skip-verify] [--skip-browsers]
#
# Lo script usa `sudo` solo per installare pacchetti di sistema. Se hai già
# Node.js >= 20, puoi eseguirlo senza privilegi aggiungendo --skip-browsers.

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

install_node() {
  warn "Node.js >= ${REQUIRED_NODE_MAJOR} non trovato: installo..."
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg
    curl -fsSL "https://deb.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y nodejs npm
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y nodejs npm
  elif command -v pacman >/dev/null 2>&1; then
    sudo pacman -Sy --noconfirm nodejs npm
  elif command -v apk >/dev/null 2>&1; then
    sudo apk add --no-cache nodejs npm bash
  else
    fail "Package manager non riconosciuto. Installa Node.js >= ${REQUIRED_NODE_MAJOR} manualmente."
  fi
}

# --- 1. Node.js ------------------------------------------------------------
if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge "${REQUIRED_NODE_MAJOR}" ]; then
  log "Node.js $(node -v) già installato (>= ${REQUIRED_NODE_MAJOR})."
else
  install_node
fi
log "npm $(npm -v)"

# --- 2. Dipendenze npm -----------------------------------------------------
if [ -f package-lock.json ]; then
  log "Installo le dipendenze npm (npm ci)..."
  npm ci
else
  log "Installo le dipendenze npm (npm install)..."
  npm install
fi

# --- 3. Browser + dipendenze di sistema Playwright -------------------------
if [ "${SKIP_BROWSERS}" -eq 0 ]; then
  log "Scarico Chromium e le dipendenze di sistema per Playwright..."
  if ! npx --yes playwright install --with-deps chromium; then
    warn "Installazione con --with-deps fallita (serve sudo?). Provo solo il browser..."
    npx --yes playwright install chromium ||
      warn "Download browser Playwright fallito: rilancia 'npx playwright install --with-deps chromium'."
  fi
else
  log "Download browser Playwright saltato (--skip-browsers)."
fi

# --- 4. Verifiche di qualità ----------------------------------------------
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
